"use client";
import ImportFormStreaming from "./components/ImportFormStreaming";
import UpdateBadge from "./components/UpdateBadge";
import AutoUpdateBadge from "./components/AutoUpdateBadge";
import UpdateNotification from "./components/UpdateNotification";

export default function Page() {


  return (
    <div className="p-4 space-y-6">
 
      <ImportFormStreaming />
      <UpdateBadge />
      <AutoUpdateBadge />
      <UpdateNotification />

    </div>
  );
}
