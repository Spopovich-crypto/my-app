// 📁 frontend/utils/invokePython.js
import { invoke } from "@tauri-apps/api/core";

/**
 * PythonスクリプトをTauri経由で実行する共通関数
 * @param {string} script - Pythonファイル名（例: "main.py"）
 * @param {Object} params - Pythonに渡す引数オブジェクト
 * @returns {Promise<string>} Pythonスクリプトからの文字列出力 or エラー文字列
 */
export async function runPythonScript(script, param) {
  try {
    const result = await invoke("run_python_script", {
      script,
      param: JSON.stringify(param),
    });
    return String(result);
  } catch (error) {
    return `Python実行エラー: ${String(error)}`;
  }
}
