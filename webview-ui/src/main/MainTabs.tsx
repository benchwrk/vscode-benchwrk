import React, { memo } from "react";
import { useListOrgSources } from "../hooks/useListOrgSources";
import { LogContent } from "./LogContent";
import { LogStreamProvider } from "../context/LogStreamContext";
import { LogsProvider } from "../context/LogsContext";
import {
  VscodeTabHeader,
  VscodeTabPanel,
  VscodeTabs,
} from "@vscode-elements/react-elements";

export const MainTabs = memo(() => {
  const { sources } = useListOrgSources();

  const tabs = sources.map((source) => {
    return {
      id: source.id,
      label: source.name,
      icon: null,
      content: `Content for ${source.name}`,
    };
  });

  if (sources.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center gap-1 px-2 py-4 max-h-[340px] overflow-y-auto">
        No sources available. Please add to `sources.json``
      </div>
    );
  }

  return (
    <LogStreamProvider>
      <LogsProvider sources={sources}>
        <VscodeTabs className="gap-0" selectedIndex={0}>
          {tabs.map((tab) => (
            <React.Fragment key={tab.id}>
              <VscodeTabHeader slot="header">{tab.label}</VscodeTabHeader>
              <VscodeTabPanel>
                <LogContent sourceId={tab.id} />
              </VscodeTabPanel>
            </React.Fragment>
          ))}
        </VscodeTabs>
      </LogsProvider>
    </LogStreamProvider>
  );
});
