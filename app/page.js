"use client";


import RunStreamingPython from "./components/RunStreamingPython";
import CheckUpdate from "./components/CheckUpdate";

export default function Page() {


  return (
    <div className="p-4 space-y-6">
 
      <RunStreamingPython />
      <CheckUpdate/>

    </div>
  );
}
