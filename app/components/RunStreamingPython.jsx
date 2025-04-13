// components/RunStreamingPython.jsx
"use client";

import React, { useState } from "react";
import usePythonStreaming from "../hooks/usePythonStreaming";
import LogViewer from "../components/LogViewer";
import LogLine from "../components/LogLine";

const script = "main.py";
const params = {
  mode: "csv",
  folder: "./data",
  plant_name: "工場B",
};

export default function RunStreamingPython() {
  // trigger を state として保持し、ボタン押下時に更新することで再実行をトリガーします
  const [trigger, setTrigger] = useState(0);
  const { logLines, completed } = usePythonStreaming(trigger, script, params);

  // 実行中は trigger>0 でかつ completed が false の状態
  const running = trigger > 0 && !completed;

  const handleRun = () => {
    if (!running) {
      setTrigger(trigger + 1);
    }
  };

  return (
    <div>
      <button
        onClick={handleRun}
        disabled={running}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mb-4"
      >
        {running ? "実行中..." : "Pythonプログラムを実行"}
      </button>
      <h2 className="text-lg font-bold">実行ログ</h2>
      <LogViewer>
        {logLines.map((log, idx) => (
          <LogLine key={idx} log={log} />
        ))}
      </LogViewer>
      {completed && (
        <p className="text-green-600 mt-2 font-medium">
          ✅ 処理が完了しました！
        </p>
      )}
    </div>
  );
}
