// hooks/usePythonStreaming.js
"use client";

import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";




const usePythonStreaming = (script, params) => {
  const [logLines, setLogLines] = useState([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let isUnmounted = false;
    let unlistenCallback = null;

    const startPython = async () => {
 
      try {
        unlistenCallback = await listen("python-log", (event) => {
          if (isUnmounted) return;

          const log = event.payload;

          // ログの構造を検証
          if (
            typeof log !== "object" ||
            !("message" in log && "level" in log && "source" in log)
          ) {
            console.warn("受信ログが構造化されていません:", log);
            return;
          }

          setLogLines((prev) => {
            // 連続する重複ログの排除
            if (prev.length > 0 && prev[prev.length - 1].message === log.message) {
              return prev;
            }
            return [...prev, log];
          });

        //   console.log(log);
          // 終了条件の判定
          if (
            log.message.includes("Pythonプロセス終了")
          ) {
            setCompleted(true);
          }
        });

        if (!isUnmounted) {
          await invoke("run_python_script_streaming", {
            script,
            param: JSON.stringify(params),
          });
        }
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
  }, []);

  return { logLines, completed };
};

export default usePythonStreaming;
