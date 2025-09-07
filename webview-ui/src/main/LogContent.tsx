import React, { memo, Suspense } from "react";
import { type UnifiedLog, useLogs } from "../context/LogsContext";
import { cn } from "../lib/utils";
import { CopyButton } from "../components/copy-button";
import { levelStyles } from "../config";
import {
  VscodeBadge,
  VscodeProgressRing,
} from "@vscode-elements/react-elements";

export const LogContent = ({ sourceId }: { sourceId: string }) => {
  const { logs } = useLogs();
  const logEntries = logs[sourceId];

  if (!logEntries && !Array.isArray(logEntries)) {
    return <LogListSkeleton />;
  }
  return <LogList sourceId={sourceId} />;
};

export const LogListSkeleton = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-1 px-2 py-4 max-h-[340px] overflow-y-auto">
      <VscodeProgressRing />
    </div>
  );
};

const LogList = memo(({ sourceId }: { sourceId: string }) => {
  const { logs } = useLogs();
  const logEntries = logs[sourceId] || [];
  console.log("Rendering LogList with logs:", logEntries);
  return (
    <div className="flex flex-col gap-1 px-2 py-0 max-h-[calc(100vh_-_70px)] overflow-y-auto">
      {logEntries.length > 0 ? (
        logEntries.flat().map((log) => <LogSlice log={log} key={log.id} />)
      ) : (
        <div className="text-center py-4 text-gray-500">No logs available</div>
      )}
    </div>
  );
});

export const LogSlice = ({ log }: { log: UnifiedLog }) => {
  return (
    <div
      key={log.id}
      className="flex items-center gap-3 py-1 border-b border-gray-50/10"
    >
      <span className="text-xs text-gray-500 font-mono min-w-[80px]">
        {new Date(log.timestamp).toLocaleTimeString()}
      </span>
      <VscodeBadge
        className={cn(
          `text-xs px-2 py-0.5 rounded-full font-medium min-w-[60px] text-center capitalize`,
          levelStyles[log.level as keyof typeof levelStyles]
        )}
      >
        {log.level}
      </VscodeBadge>
      <span className="text-xs flex-1 truncate font-mono">{log.message}</span>

      <CopyButton value={log.message} />
    </div>
  );
};
