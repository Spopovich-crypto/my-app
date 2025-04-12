use chrono::Local;
use tauri::Emitter;

// 🔽 ログをファイルに書き出す関数
fn write_log(level: &str, message: &str) {
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::path::PathBuf;

    let log_path = PathBuf::from("chinami-log.txt");
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
        let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
        let _ = writeln!(file, "[{}] [{}] {}", timestamp, level, message);
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
fn run_python_script_streaming(window: tauri::Window, script: String, param: String) -> Result<(), String> {
    use std::io::{BufRead, BufReader, Write};
    use std::process::{Command, Stdio};
    use std::os::windows::process::CommandExt;
    use encoding_rs::UTF_8;
    use std::thread;
    use std::sync::{Arc, Mutex};
    use std::collections::HashSet;

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    write_log("INFO", &format!("Pythonスクリプト実行開始: {}", script));

    // 既に送信したメッセージを追跡するためのセット（スレッド間で共有）
    let sent_messages = Arc::new(Mutex::new(HashSet::<String>::new()));

    let mut child = Command::new("python-embed/python.exe")
        .arg(format!("src-python/{}", script))
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
        .map_err(|e| format!("起動失敗: {}", e))?;

    if let Some(stdin) = &mut child.stdin {
        let (encoded_param, _, _) = UTF_8.encode(&param);
        stdin
            .write_all(&encoded_param)
            .map_err(|e| format!("stdin書き込み失敗: {}", e))?;
    }

    // 標準出力の処理
    let stdout = child.stdout.take().ok_or("stdout取得失敗")?;
    let stdout_reader = BufReader::new(stdout);
    let window_clone = window.clone();
    let sent_messages_clone = Arc::clone(&sent_messages);
    
    thread::spawn(move || {
        for line in stdout_reader.lines() {
            match line {
                Ok(l) => {
                    // ログファイルには常に記録
                    write_log("STDOUT", &l);
                    
                    // 重複チェック - 既に送信済みのメッセージは送信しない
                    let mut sent_set = sent_messages_clone.lock().unwrap();
                    if !sent_set.contains(&l) {
                        // JSONデータの場合は特別処理
                        if l.trim().starts_with("{") && l.trim().ends_with("}") {
                            // JSONデータは一度だけ送信
                            window_clone.emit("python-log", &l).unwrap_or_else(|err| {
                                println!("stdout JSON emit失敗: {:?}", err);
                            });
                        } else {
                            // 通常のログメッセージ
                            window_clone.emit("python-log", &l).unwrap_or_else(|err| {
                                println!("stdout emit失敗: {:?}", err);
                            });
                        }
                        
                        // 送信済みとしてマーク
                        sent_set.insert(l);
                    }
                }
                Err(e) => {
                    write_log("ERROR", &format!("stdout読み込み失敗: {}", e));
                }
            }
        }
    });

    // 標準エラー出力の処理 - 実際のエラーのみを送信
    if let Some(stderr) = child.stderr.take() {
        let stderr_reader = BufReader::new(stderr);
        let window_clone = window.clone();
        let sent_messages_clone = Arc::clone(&sent_messages);
        
        thread::spawn(move || {
            for line in stderr_reader.lines() {
                match line {
                    Ok(l) => {
                        // ログファイルには常に記録
                        write_log("STDERR", &l);
                        
                        // 重要なエラーメッセージのみをフロントエンドに送信
                        if !l.is_empty() && !l.contains("全CSVファイルの処理が完了しました") {
                            let mut sent_set = sent_messages_clone.lock().unwrap();
                            let error_msg = format!("[ERROR] {}", l);
                            
                            // 重複チェック - 既に送信済みのメッセージは送信しない
                            if !sent_set.contains(&error_msg) {
                                window_clone.emit("python-log", &error_msg).unwrap_or_else(|err| {
                                    println!("stderr emit失敗: {:?}", err);
                                });
                                
                                // 送信済みとしてマーク
                                sent_set.insert(error_msg);
                            }
                        }
                    }
                    Err(e) => {
                        write_log("ERROR", &format!("stderr読み込み失敗: {}", e));
                    }
                }
            }
        });
    }

    // 子プロセスの終了を待つスレッド
    let window_clone = window.clone();
    thread::spawn(move || {
        match child.wait() {
            Ok(status) => {
                let msg = format!("Pythonプロセス終了: {}", status);
                write_log("INFO", &msg);
                window_clone.emit("python-log", format!("[INFO] {}", msg)).unwrap_or_default();
            }
            Err(e) => {
                let msg = format!("Pythonプロセス待機エラー: {}", e);
                write_log("ERROR", &msg);
                window_clone.emit("python-log", format!("[ERROR] {}", msg)).unwrap_or_default();
            }
        }
    });

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
