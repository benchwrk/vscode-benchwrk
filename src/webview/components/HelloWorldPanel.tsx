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
     
    </div>
  );
};

export default HelloWorldPanel;
