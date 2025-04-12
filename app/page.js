"use client";

import { useEffect, useState } from "react";
import { runPythonScript } from "./utils/invokePython";
import { checkForUpdate } from "./utils/checkForUpdate"; // ← これも使う

export default function Page() {
  const [result, setResult] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const script = "main.py";
      const params = {
        mode: "csv",
        folder: "./data",
        plant_name: "工場B",
      };
      console.log("params before invoke:", params);
      const encoded = new TextEncoder().encode(JSON.stringify(params));
      console.log("Encoded bytes:", encoded);

      const output = await runPythonScript(script, params);
      setResult(output);
    })();
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
        <h2 className="text-lg font-bold">Python実行結果</h2>
        <pre className="mt-2 p-2 bg-gray-100 border rounded">{result}</pre>
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
