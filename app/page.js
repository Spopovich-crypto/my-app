"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { checkForUpdate } from "./utils/checkForUpdate";

export default function Page() {
  const [logLines, setLogLines] = useState([]);
  const [updateMessage, setUpdateMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const logContainerRef = useRef(null);

  const handleScroll = () => {
    if (!logContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
    setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 20);
  };

  const scrollToBottom = useCallback(() => {
    if (logContainerRef.current && shouldAutoScroll) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [shouldAutoScroll]);

  useEffect(() => {
    if (logLines.length > 0 && shouldAutoScroll) {
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
      setTimeout(scrollToBottom, 50);
    }
  }, [logLines, scrollToBottom]);

  useEffect(() => {
    const logContainer = logContainerRef.current;
    if (logContainer) {
      logContainer.addEventListener("scroll", handleScroll);
      return () => logContainer.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    let isUnmounted = false;
    let unlistenCallback = null;

    const startPython = async () => {
      const script = "main.py";
      const params = {
        mode: "csv",
        folder: "./data",
        plant_name: "工場B",
      };

      try {
        unlistenCallback = await listen("python-log", (event) => {
          if (isUnmounted) return;

          const log = event.payload;
          if (
            typeof log !== "object" ||
            !("message" in log && "level" in log && "source" in log)
          ) {
            console.warn("受信ログが構造化されていません:", log);
            return;
          }

          setLogLines((prev) => {
            if (prev.length > 0 && prev[prev.length - 1].message === log.message) return prev;
            return [...prev, log];
          });

          if (
            log.message.includes("CSV処理完了") ||
            log.message.includes("全処理完了")
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

  const handleUpdateCheck = async () => {
    setLoading(true);
    const msg = await checkForUpdate();
    setUpdateMessage(msg);
    setLoading(false);
  };

  const renderLogLine = (log, idx) => {
    let color = "text-gray-700";
    let icon = "📝";

    switch (log.level.toUpperCase()) {
      case "INFO":
        color = "text-blue-600";
        icon = "ℹ️";
        break;
      case "ERROR":
        color = "text-red-600 font-bold";
        icon = "❌";
        break;
      case "WARN":
      case "WARNING":
        color = "text-yellow-600";
        icon = "⚠️";
        break;
      case "DEBUG":
        color = "text-purple-600";
        icon = "🐛";
        break;
      default:
        icon = "🧾";
        break;
    }

    return (
      <div key={idx} className={`mb-1 ${color} font-mono text-sm`}>
        <span className="mr-2">{icon}</span>
        <span className="opacity-70">[{log.source}]</span>{" "}
        <span>{log.message}</span>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h2 className="text-lg font-bold">Python 実行ログ</h2>
        <div
          ref={logContainerRef}
          className="mt-2 p-2 bg-gray-100 border rounded h-80 overflow-auto whitespace-pre-wrap font-mono text-sm"
          style={{ scrollBehavior: "smooth" }}
          onScroll={handleScroll}
        >
          {logLines.map(renderLogLine)}
        </div>
        {completed && (
          <p className="text-green-600 mt-2 font-medium">✅ 処理が完了しました！</p>
        )}
      </div>

      <div className="p-4 border rounded">
        <h2 className="text-lg font-bold mb-2">アップデート確認</h2>
        <button
          onClick={handleUpdateCheck}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "確認中..." : "アップデートを確認する"}
        </button>
        {updateMessage && <p className="mt-4">{updateMessage}</p>}
      </div>
    </div>
  );
}
