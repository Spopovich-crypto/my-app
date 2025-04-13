// components/LogViewer.jsx
"use client";

import { useLayoutEffect, useEffect, useState, useRef } from "react";

const LogViewer = ({ children }) => {
  const containerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShouldAutoScroll(scrollHeight - scrollTop - clientHeight < 50); // 閾値を50pxに調整
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useLayoutEffect(() => {
    if (containerRef.current && shouldAutoScroll) {
      setTimeout(() => {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }, 0);
    }
  }, [children, shouldAutoScroll]);

  return (
    <div
      ref={containerRef}
      className="mt-2 p-2 bg-gray-100 border rounded h-80 overflow-auto whitespace-pre-wrap font-mono text-sm"
    >
      {children}
    </div>
  );
};

export default LogViewer;
