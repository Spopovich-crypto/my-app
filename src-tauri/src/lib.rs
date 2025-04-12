use chrono::Local;

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
        .invoke_handler(tauri::generate_handler![run_python_script])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
