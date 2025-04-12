// 🔽 ログをファイルに書き出す関数
fn write_log(line: &str) {
    use std::fs::OpenOptions;
    use std::io::Write;
    use std::path::PathBuf;

    let log_path = PathBuf::from("chinami-log.txt"); // ← カレントディレクトリに出力
    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
        let _ = writeln!(file, "{}", line);
    }
}

#[tauri::command]
fn run_python_script(script: String, param: String) -> Result<String, String> {
    use std::env;
    use std::io::Write;
    use std::process::{Command, Stdio};

    let current_dir = env::current_dir().map_err(|e| e.to_string())?;
    println!("Current working directory: {:?}", current_dir);
    write_log(&format!("Current working directory: {:?}", current_dir));

    let script_path = format!("src-python/{}", script); // ここで任意の.pyを指定
    let mut child = Command::new("python-embed/python.exe")
        .arg(&script_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    if let Some(stdin) = &mut child.stdin {
        stdin
            .write_all(param.as_bytes())
            .map_err(|e| e.to_string())?;
    }

    let output = child.wait_with_output().map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
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
