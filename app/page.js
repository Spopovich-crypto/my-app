"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export default function Home() {
  const [result, setResult] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await invoke("run_embedded_python", {
          param: JSON.stringify({ name: "Chinami", message: "Hello!" })
        });
        setResult(String(res));
      } catch (error) {
        setResult(`エラー: ${String(error)}`);
      }
    };
    run();
  }, []);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Next.js × Tauri × Python</h1>
      <p>結果：</p>
      <pre className="p-2 bg-gray-100 border rounded">{result}</pre>
    </div>
  );
}
