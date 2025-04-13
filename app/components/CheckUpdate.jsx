"use client";

import { useState } from "react";
import { checkForUpdate } from "../utils/checkForUpdate";


export default function CheckUpdate() {
  const [updateMessage, setUpdateMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateCheck = async () => {
    setLoading(true);
    const msg = await checkForUpdate();
    setUpdateMessage(msg);
    setLoading(false);
  };

  return (
 
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
  );
}
