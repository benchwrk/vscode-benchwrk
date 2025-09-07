import { useState, useEffect } from "react";

export const useListOrgSources = () => {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    // Listen for messages from extension
    const messageHandler = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "sourcesData") {
        setSources(message.data.sources || []);
      }
    };

    window.addEventListener("message", messageHandler);
    return () => window.removeEventListener("message", messageHandler);
  }, []);

  return { sources };
};
