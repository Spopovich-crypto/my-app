"use client";


import RunStreamingPython from "./components/RunStreamingPython";
import CheckUpdate from "./components/CheckUpdate";
import ImportForm from "./components/ImportForm";

export default function Page() {


  return (
    <div className="p-4 space-y-6">
 
      {/* <RunStreamingPython />
      <CheckUpdate/> */}
      <ImportForm />

    </div>
  );
}
