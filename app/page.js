"use client";
import ImportFormStreaming from "./components/ImportFormStreaming";
import UpdateBadge from "./components/UpdateBadge";
import AutoUpdateBadge from "./components/AutoUpdateBadge";

export default function Page() {


  return (
    <div className="p-4 space-y-6">
 
      <ImportFormStreaming />
      <UpdateBadge />
      <AutoUpdateBadge />

    </div>
  );
}
