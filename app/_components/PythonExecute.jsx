"use client";

import { useState } from "react";

export function PythonExecute({ code = "Hello from Tauri!" }) {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const { callFunction } = await import("tauri-plugin-python-api");
      const output = await callFunction("greet_python", [code]);
      setResult(output);
    } catch (error) {
      setResult(`エラー: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-bold mb-2">Python 実行</h2>
      <button
        onClick={handleExecute}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? "実行中..." : "Pythonを実行"}
      </button>
      <pre className="mt-4 p-2 bg-gray-100 border rounded whitespace-pre-wrap">{result}</pre>
    </div>
  );
}
