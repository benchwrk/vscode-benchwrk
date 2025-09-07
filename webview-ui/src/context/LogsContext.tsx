import {
  createContext,
  useContext,
  useState,
  useRef,
  type ReactNode,
  useEffect,
  useCallback,
} from "react";
import { useLogStream } from "./LogStreamContext";
import { StreamLogsService } from "../sources/services/StreamLogsService";

// Define types for our logs context
interface LogsState {
  [sourceId: string]: any[] | UnifiedLog[] | null;
}

export interface UnifiedLog {
  id: string;
  timestamp: string;
  source: "coolify" | "sentry" | "stripe" | "cloudwatch" | "gcp" | "newrelic";
  level: "info" | "error" | "warn" | "debug";
  message: string;
  meta?: Record<string, any>;
}

// Interface to track the last log entry for each source
interface LastLogsState {
  [sourceId: string]: string;
}

interface LogsContextType {
  logs: LogsState;
  registerSource: (sourceId: string) => void;
  unregisterSource: (sourceId: string) => void;
  clearLogs: (sourceId: string) => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export function LogsProvider({
  children,
  sources,
}: {
  children: ReactNode;
  sources: Source[];
}) {
  const [logs, setLogs] = useState<LogsState>({});
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(
    new Set()
  );

  // Use a ref to track the last received log content for each source
  // This will help us avoid duplicating log entries
  const lastLogsRef = useRef<LastLogsState>({});

  // Track the last update time to implement throttling
  const lastUpdateTimeRef = useRef<{ [sourceId: string]: number }>({});
  // Minimum time between updates for each source (in ms)
  const UPDATE_THROTTLE = 500;

  const { registerStreamActivity } = useLogStream();

  // Throttled function to update logs state with UnifiedLog objects
  const updateLogs = useCallback(
    (sourceId: string, newLogs: UnifiedLog[]) => {
      const now = Date.now();
      const lastUpdateTime = lastUpdateTimeRef.current[sourceId] || 0;
      // Only update if enough time has passed since the last update
      if (now - lastUpdateTime > UPDATE_THROTTLE) {
        lastUpdateTimeRef.current[sourceId] = now;

        setLogs((prev) => ({
          ...prev,
          [sourceId]: prev[sourceId]
            ? [...newLogs, ...(prev[sourceId] || [])]
            : newLogs,
        }));

        registerStreamActivity(sourceId);
      }
    },
    [registerStreamActivity]
  );

  // Register sources from props on component mount
  useEffect(() => {
    const sourceIds = sources.map((source) => source.id);

    // Add all sources to active sources
    setActiveSourceIds(new Set(sourceIds));

    // Initialize logs state for all sources
    const initialLogs: LogsState = {};
    sourceIds.forEach((id) => {
      initialLogs[id] = logs[id] || null;
    });
    setLogs(initialLogs);
  }, [sources]);

  // Fetch initial logs for each source
  useEffect(() => {
    const fetchInitialLogs = async () => {
      const sourceIds = Array.from(activeSourceIds);
      for (const sourceId of sourceIds) {
        try {
          const source = sources.find((s) => s.id === sourceId);
          if (!source) continue;

          //fetch initial logs
          const data = await StreamLogsService.streamLogs({
            source,
            format: "unified",
          });
          const result = data.data;
          if (result) {
            // Parse the result as UnifiedLog objects
            const logEntries = Array.isArray(result) ? result : [result];
            // Save the first log ID to lastLogsRef to avoid duplicates
            if (logEntries.length > 0) {
              lastLogsRef.current[sourceId] = logEntries[0].id;
            }
            setLogs((prev) => ({
              ...prev,
              [sourceId]: logEntries,
            }));
          }
        } catch (error) {
          console.error(`Error fetching initial logs for ${sourceId}:`, error);
        }
      }
    };
    if (activeSourceIds.size > 0) {
      fetchInitialLogs();
    }
  }, [activeSourceIds]);

  // Set up streaming logs for all active sources
  useEffect(() => {
    // Set up interval to fetch logs for all active sources
    const sourceIds = Array.from(activeSourceIds);
    const fetchIntervalId = setInterval(async () => {
      for (const sourceId of sourceIds) {
        try {
          const source = sources.find((s) => s.id === sourceId);
          if (!source) continue;

          const result = await StreamLogsService.streamLogs({
            source,
            format: "unified",
            line: 1,
          });

          if (result) {
            // Parse the result as UnifiedLog objects
            const newLogEntries = (
              Array.isArray(result) ? result.data : [result.data]
            ) as UnifiedLog[];
            if (newLogEntries && newLogEntries?.length > 0) {
              // Filter out logs we've already seen
              const lastLogId = lastLogsRef.current[sourceId];
              const uniqueNewLogs = lastLogId
                ? newLogEntries.filter((log) => log.id !== lastLogId)
                : newLogEntries;
              // Update the last log reference with the newest log ID
              if (uniqueNewLogs.length > 0) {
                lastLogsRef.current[sourceId] = uniqueNewLogs[0].id;
                // Use the throttled update function
                updateLogs(sourceId, uniqueNewLogs);
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching logs for ${sourceId}:`, error);
        }
      }
    }, 15000);

    return () => clearInterval(fetchIntervalId);
  }, [activeSourceIds, updateLogs]);

  // Functions to register/unregister sources
  const registerSource = (sourceId: string) => {
    setActiveSourceIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(sourceId);
      return newSet;
    });
  };

  const unregisterSource = (sourceId: string) => {
    // Remove from active sources
    setActiveSourceIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(sourceId);
      return newSet;
    });

    // Clean up the lastLogsRef
    if (sourceId in lastLogsRef.current) {
      delete lastLogsRef.current[sourceId];
    }
  };

  // Clear logs for a specific source
  const clearLogs = (sourceId: string) => {
    setLogs((prev) => ({
      ...prev,
      [sourceId]: [],
    }));
  };

  return (
    <LogsContext.Provider
      value={{ logs, registerSource, unregisterSource, clearLogs }}
    >
      {children}
    </LogsContext.Provider>
  );
}

export const useLogs = () => {
  const context = useContext(LogsContext);
  if (context === undefined) {
    throw new Error("useLogs must be used within a LogsProvider");
  }
  return context;
};
