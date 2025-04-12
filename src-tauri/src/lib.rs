use chrono::Local;
use tauri::Emitter;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashSet;

// 🔽 ログをファイルに書き出す関数（日付ごとにファイルを分ける）
fn write_log(level: &str, message: &str) {
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::path::PathBuf;

    let now = Local::now();
    let date_str = now.format("%Y-%m-%d");
    let time_str = now.format("%H:%M:%S");

    let log_path = PathBuf::from(format!("chinami-log-{}.txt", date_str));
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
        let _ = writeln!(file, "[{}] [{}] {}", time_str, level, message);
    }
}

// emitとログ書き出しを統合した補助関数
async fn safe_emit<T: serde::Serialize>(
    window: &tauri::Window,
    event: &str,
    payload: T,
    task_name: &str
) {
    if let Err(err) = window.emit(event, &payload) {
        write_log("ERROR", &format!("[{}] emit失敗: {:?}", task_name, err));
    }
}



#[tauri::command]
fn run_python_script(script: String, param: String) -> Result<String, String> {
    // use std::env;
    use std::io::Write;
    use std::process::{Command, Stdio};
    use std::os::windows::process::CommandExt;
    use encoding_rs::UTF_8;

    const CREATE_NO_WINDOW: u32 = 0x08000000; // コンソールウィンドウを表示しないフラグ

    // let current_dir = env::current_dir().map_err(|e| e.to_string())?;
    // write_log(&format!("Current working directory: {:?}", current_dir));

    write_log("INFO", &format!("PARAM: {}", param));
    // write_log(&format!("PARAM BYTES: {:?}", param.as_bytes()));

    let script_path = format!("src-python/{}", script);

    let mut child = Command::new("python-embed/python.exe")
        .arg(&script_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| e.to_string())?;

    if let Some(stdin) = &mut child.stdin {
        let (encoded_param, _, _) = UTF_8.encode(&param); // ← ちゃんとUTF-8で強制エンコード
        stdin
            .write_all(&encoded_param)
            .map_err(|e| e.to_string())?;
    }

    let output = child.wait_with_output().map_err(|e| e.to_string())?;

    // write_log(&format!("STDOUT RAW: {:?}", output.stdout));
    // write_log(&format!("STDERR RAW: {:?}", output.stderr));

    let stdout_str = String::from_utf8(output.stdout)
        .map_err(|e| {
            write_log("ERROR", &format!("STDOUT decode error: {:?}", e));
            format!("出力のデコードに失敗しました（UTF-8じゃない可能性）")
        })?;

    let stderr_str = String::from_utf8(output.stderr)
        .unwrap_or_else(|e| format!("Could not decode stderr: {:?}", e));
        
    write_log("INFO", &format!("PYTHON OUTPUT: {}", stdout_str));

    // write_log(&format!("STDOUT TEXT: {}", stdout_str));
    // write_log(&format!("STDERR TEXT: {}", stderr_str));

    if output.status.success() {
        // JSONとしてパースして、中の "status" を見る
        if let Ok(json_val) = serde_json::from_str::<serde_json::Value>(&stdout_str) {
            if json_val.get("status") == Some(&serde_json::Value::String("error".to_string())) {
                // Pythonが「status: error」って言ってるならこっちがエラーにする
                return Err(stdout_str);
            }
        }
    
        Ok(stdout_str)
    } else {
        Err(stderr_str)
    }
}

#[tauri::command]
async fn run_python_script_streaming(window: tauri::Window, script: String, param: String) -> Result<(), String> {
    use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
    use tokio::process::Command;
    use std::process::Stdio;
    use encoding_rs::UTF_8;
    use tokio::task;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    write_log("INFO", &format!("[main-task] Pythonスクリプト実行開始: {}", script));

    let sent_messages = Arc::new(Mutex::new(HashSet::<String>::new()));

    let mut child = Command::new("python-embed/python.exe")
        .arg(format!("src-python/{}", script))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| format!("起動失敗: {}", e))?;

    if let Some(stdin) = child.stdin.as_mut() {
        let (encoded_param, _, _) = UTF_8.encode(&param);
        stdin
            .write_all(&encoded_param)
            .await
            .map_err(|e| format!("stdin書き込み失敗: {}", e))?;
    }

    let stdout = child.stdout.take().ok_or("stdout取得失敗")?;
    let stdout_reader = BufReader::new(stdout);
    let window_clone = window.clone();
    let sent_messages_clone = Arc::clone(&sent_messages);

    let stdout_task = task::spawn(async move {
        let mut lines = stdout_reader.lines();
        while let Some(line) = lines.next_line().await.unwrap_or(None) {
            write_log("STDOUT", &format!("[stdout-task] {}", line));
            let mut sent_set = sent_messages_clone.lock().await;
            if !sent_set.contains(&line) {
                let event = if serde_json::from_str::<serde_json::Value>(&line).is_ok() {
                    "python-json"
                } else {
                    "python-log"
                };
                safe_emit(&window_clone, event, &line, "stdout-task").await;
                sent_set.insert(line);
            }
        }
    });

    let stderr_task = if let Some(stderr) = child.stderr.take() {
        let stderr_reader = BufReader::new(stderr);
        let window_clone = window.clone();
        let sent_messages_clone = Arc::clone(&sent_messages);

        Some(task::spawn(async move {
            let mut lines = stderr_reader.lines();
            while let Some(line) = lines.next_line().await.unwrap_or(None) {
                write_log("STDERR", &format!("[stderr-task] {}", line));
                if !line.is_empty() && !line.contains("全CSVファイルの処理が完了しました") {
                    let mut sent_set = sent_messages_clone.lock().await;
                    if serde_json::from_str::<serde_json::Value>(&line).is_ok() {
                        if !sent_set.contains(&line) {
                            safe_emit(&window_clone, "python-json-error", &line, "stderr-task").await;
                            sent_set.insert(line);
                        }
                    } else {
                        let error_msg = format!("[ERROR] {}", line);
                        if !sent_set.contains(&error_msg) {
                            safe_emit(&window_clone, "python-log", &error_msg, "stderr-task").await;
                            sent_set.insert(error_msg);
                        }
                    }
                }
            }
        }))
    } else {
        None
    };

    let window_clone = window.clone();
    let wait_task = task::spawn(async move {
        match child.wait().await {
            Ok(status) => {
                let msg = format!("Pythonプロセス終了: {}", status);
                write_log("INFO", &format!("[wait-task] {}", msg));
                safe_emit(&window_clone, "python-log", format!("[INFO] {}", msg), "wait-task").await;
            }
            Err(e) => {
                let msg = format!("Pythonプロセス待機エラー: {}", e);
                write_log("ERROR", &format!("[wait-task] {}", msg));
                safe_emit(&window_clone, "python-log", format!("[ERROR] {}", msg), "wait-task").await;
            }
        }
    });

    if let Some(stderr_task) = stderr_task {
        tokio::try_join!(stdout_task, stderr_task, wait_task)
            .map_err(|e| format!("タスク実行エラー: {}", e))?;
    } else {
        tokio::try_join!(stdout_task, wait_task)
            .map_err(|e| format!("タスク実行エラー: {}", e))?;
    }

    Ok(())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_python_script, 
            run_python_script_streaming])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
