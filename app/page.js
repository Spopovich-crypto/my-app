"use client";

import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { checkForUpdate } from "./utils/checkForUpdate";

export default function Page() {
  const [logLines, setLogLines] = useState([]);
  const [updateMessage, setUpdateMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const startPython = async () => {
      const script = "main.py";
      const params = {
        mode: "csv",
        folder: "./data",
        plant_name: "工場B",
      };

      // リスナーを登録（ログ受信）
      const unlisten = await listen("python-log", (event) => {
        const line = event.payload;

        setLogLines((prev) => [...prev, line]);

        // 任意：終了っぽいワードが来たらcompletedにする
        if (line.includes("CSV処理完了") || line.includes("全処理完了")) {
          setCompleted(true);
        }
      });

      // Pythonの実行スタート（streaming版）
      await invoke("run_python_script_streaming", {
        script,
        param: JSON.stringify(params),
      });

      return () => {
        unlisten();
      };
    };

    startPython();
  }, []);

  const handleUpdateCheck = async () => {
    setLoading(true);
    const msg = await checkForUpdate();
    setUpdateMessage(msg);
    setLoading(false);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-bold">Python 実行ログ</h2>
        <pre className="mt-2 p-2 bg-gray-100 border rounded h-80 overflow-auto whitespace-pre-wrap">
          {logLines.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </pre>
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
