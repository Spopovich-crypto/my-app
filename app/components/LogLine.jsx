// components/LogLine.jsx
"use client";

const LogLine = ({ log }) => {
  let color = "text-gray-700";
  let icon = "📝";

  switch (log.level.toUpperCase()) {
    case "INFO":
      color = "text-blue-600";
      icon = "ℹ️";
      break;
    case "ERROR":
      color = "text-red-600 font-bold";
      icon = "❌";
      break;
    case "WARN":
    case "WARNING":
      color = "text-yellow-600";
      icon = "⚠️";
      break;
    case "DEBUG":
      color = "text-purple-600";
      icon = "🐛";
      break;
    default:
      icon = "🧾";
      break;
  }

  return (
    <div className={`mb-1 ${color} font-mono text-sm`}>
      <span className="mr-2">{icon}</span>
      <span className="opacity-70">[{log.source}]</span>{" "}
      <span>{log.message}</span>
    </div>
  );
};

export default LogLine;
