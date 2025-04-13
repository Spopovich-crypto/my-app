// components/RunStreamingPython.jsx
"use client";

import React from "react";
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
  const { logLines, completed } = usePythonStreaming(script, params);
  

  return (
    <div>
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
