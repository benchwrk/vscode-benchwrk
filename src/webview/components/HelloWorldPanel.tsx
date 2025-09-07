import * as React from "react";
import {
  VscodeBadge,
  VscodeTabHeader,
  VscodeTabPanel,
  VscodeTabs,
  VscodeButton,
} from "@vscode-elements/react-elements";

interface HelloWorldPanelProps {
  message: string;
  onButtonClick: () => void;
}

const HelloWorldPanel: React.FC<HelloWorldPanelProps> = ({
  message,
  onButtonClick,
}) => {
  return (
    <div style={{ backgroundColor: "#2c2c2cff" }}>
      <VscodeButton>byn</VscodeButton>
      <VscodeTabs
        onVscTabsSelect={(e) => {
          console.log(e);
        }}
      >
        <VscodeTabHeader>
          Lorem
          <VscodeBadge variant="counter" slot="content-after">
            10
          </VscodeBadge>
        </VscodeTabHeader>
        <VscodeTabPanel>panel content 1</VscodeTabPanel>
        <VscodeTabHeader>Ipsum</VscodeTabHeader>
        <VscodeTabPanel>panel content 2</VscodeTabPanel>
      </VscodeTabs>
    </div>
  );
};

export default HelloWorldPanel;
