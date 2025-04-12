"use client";

import { useEffect, useState } from "react";
import { runPythonScript } from "./utils/invokePython";

export default function Page() {
  const [result, setResult] = useState("");

  useEffect(() => {
    (async () => {
      const script = "main.py";
      const params = {
        mode: "csv",
        folder: "./data",
        plant_name: "工場B",
      };
      const output = await runPythonScript(script, params);
      setResult(output);
    })();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">Python実行結果</h2>
      <pre className="mt-2 p-2 bg-gray-100 border rounded">{result}</pre>
    </div>
  );
}
