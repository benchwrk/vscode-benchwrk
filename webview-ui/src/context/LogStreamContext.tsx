import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";

type LogStreamContextType = {
  registerStreamActivity: (sourceId: string) => void;
  unregisterStreamActivity: (sourceId: string) => void;
  hasActiveStream: (sourceId: string) => boolean;
};

const LogStreamContext = createContext<LogStreamContextType | undefined>(
  undefined
);

// Track last activity time for each source ID
interface ActivityTimestamps {
  [sourceId: string]: number;
}

const INACTIVITY_TIMEOUT = 3000; // 3 seconds

export function LogStreamProvider({ children }: { children: ReactNode }) {
  const [activeStreamIds, setActiveStreamIds] = useState<Set<string>>(
    new Set()
  );
  const activityTimestampsRef = useRef<ActivityTimestamps>({});
  const checkIntervalRef = useRef<number | null>(null);

  // Set up interval to check for inactive streams
  useEffect(() => {
    // Clean up function for component unmount
    const checkForInactiveStreams = () => {
      const now = Date.now();
      const inactiveIds: string[] = [];

      // Find streams that haven't had activity in INACTIVITY_TIMEOUT
      Object.entries(activityTimestampsRef.current).forEach(
        ([id, timestamp]) => {
          if (now - timestamp > INACTIVITY_TIMEOUT) {
            inactiveIds.push(id);
            // Remove from timestamps
            delete activityTimestampsRef.current[id];
          }
        }
      );

      // Update active streams if we found any inactive ones
      if (inactiveIds.length > 0) {
        setActiveStreamIds((prev) => {
          let hasChanges = false;
          const newSet = new Set(prev);

          inactiveIds.forEach((id) => {
            if (newSet.has(id)) {
              newSet.delete(id);
              hasChanges = true;
            }
          });

          return hasChanges ? newSet : prev;
        });
      }
    };

    // Set up interval to check every second
    const intervalId = window.setInterval(checkForInactiveStreams, 1000);
    checkIntervalRef.current = intervalId as unknown as number;

    return () => {
      if (checkIntervalRef.current !== null) {
        window.clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Register stream activity with timestamp
  const registerStreamActivity = useCallback((sourceId: string) => {
    // Update timestamp regardless of active state
    activityTimestampsRef.current[sourceId] = Date.now();

    // Update active streams state if needed
    setActiveStreamIds((prev) => {
      if (prev.has(sourceId)) return prev;

      const newSet = new Set(prev);
      newSet.add(sourceId);
      return newSet;
    });
  }, []);

  // For manual cleanup if needed
  const unregisterStreamActivity = useCallback((sourceId: string) => {
    // Remove from timestamps
    if (sourceId in activityTimestampsRef.current) {
      delete activityTimestampsRef.current[sourceId];
    }

    // Remove from active streams
    setActiveStreamIds((prev) => {
      if (!prev.has(sourceId)) return prev;

      const newSet = new Set(prev);
      newSet.delete(sourceId);
      return newSet;
    });
  }, []);

  const hasActiveStream = useCallback(
    (sourceId: string) => {
      return activeStreamIds.has(sourceId);
    },
    [activeStreamIds]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      registerStreamActivity,
      unregisterStreamActivity,
      hasActiveStream,
    }),
    [registerStreamActivity, unregisterStreamActivity, hasActiveStream]
  );

  return (
    <LogStreamContext.Provider value={contextValue}>
      {children}
    </LogStreamContext.Provider>
  );
}

export const useLogStream = (): LogStreamContextType => {
  const context = useContext(LogStreamContext);
  if (context === undefined) {
    throw new Error("useLogStream must be used within a LogStreamProvider");
  }
  return context;
};
