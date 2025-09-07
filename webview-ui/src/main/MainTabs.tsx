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
