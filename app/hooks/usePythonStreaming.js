// hooks/usePythonStreaming.js
"use client";

import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

/**
 * trigger が更新されたときに、Pythonプログラムのストリーミング実行を行います。
 *
 * @param {number} trigger - 実行トリガー（0以外の場合に実行開始）
 * @param {string} script - 実行する Python スクリプト名
 * @param {Object} params - スクリプトに渡すパラメーター
 * @returns {{ logLines: Array, completed: boolean }}
 */
const usePythonStreaming = (trigger, script, params) => {
  const [logLines, setLogLines] = useState([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!trigger) return; // triggerが falsy の場合は何もしない

    // 再実行時にログをクリアし、完了状態をリセット
    setLogLines([]);
    setCompleted(false);

    let isUnmounted = false;
    let unlistenCallback = null;

    const startPython = async () => {
      try {
        unlistenCallback = await listen("python-log", (event) => {
          if (isUnmounted) return;
          const log = event.payload;

          // 受信ログの形式チェック
          if (
            typeof log !== "object" ||
            !("message" in log && "level" in log && "source" in log)
          ) {
            console.warn("受信ログが構造化されていません:", log);
            return;
          }

          // 連続する重複ログは除外
          setLogLines((prev) => {
            if (prev.length > 0 && prev[prev.length - 1].message === log.message) {
              return prev;
            }
            return [...prev, log];
          });

          // 終了判定（例：ログに "Pythonプロセス終了" が含まれる場合）
          if (log.message.includes("Pythonプロセス終了")) {
            setCompleted(true);
          }
        });

        // Python プログラムの実行開始
        await invoke("run_python_script_streaming", {
          script,
          param: JSON.stringify(params),
        });
      } catch (error) {
        console.error("Python実行エラー:", error);
      }
    };

    startPython();

    return () => {
      isUnmounted = true;
      if (unlistenCallback) {
        unlistenCallback();
      }
    };
  }, [trigger, script, params]);

  return { logLines, completed };
};

export default usePythonStreaming;
