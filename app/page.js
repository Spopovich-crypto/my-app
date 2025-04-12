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
        // リスナーを登録（ログ受信）- マウント状態を確認
        unlistenCallback = await listen("python-log", (event) => {
          // コンポーネントがアンマウントされていたら何もしない
          if (isUnmounted) return;
          
          const line = event.payload;
          
          // 重複を防ぐためのフィルタリング
          // 同じ行が短時間に複数回来た場合は無視する
          setLogLines((prev) => {
            // 直近の行と同じ内容なら追加しない
            if (prev.length > 0 && prev[prev.length - 1] === line) {
              return prev;
            }
            return [...prev, line];
          });

          // 任意：終了っぽいワードが来たらcompletedにする
          if (line.includes("CSV処理完了") || line.includes("全処理完了")) {
            setCompleted(true);
          }
        });

        // Pythonの実行スタート（streaming版）
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

    // クリーンアップ関数
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
