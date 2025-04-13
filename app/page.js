"use client";


import RunStreamingPython from "./components/RunStreamingPython";
import CheckUpdate from "./components/CheckUpdate";
import ImportForm from "./components/ImportForm";
import ImportFormStreaming from "./components/ImportFormStreaming";

export default function Page() {


  return (
    <div className="p-4 space-y-6">
 
      {/* <RunStreamingPython />*/}
      <CheckUpdate/> 
      {/* <ImportForm /> */}
      <ImportFormStreaming />

    </div>
  );
}
