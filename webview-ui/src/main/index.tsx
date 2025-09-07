import { MainTabs } from "./MainTabs";
import { appConfig } from "../config";
import { Logo } from "../components/Logo";
import { VscodeButton } from "@vscode-elements/react-elements";

interface BenchwrkProps {}

export const BenchwrkMain = ({}: BenchwrkProps) => {
  // Assuming vscode API is available (injected by VSCode)
  const vscode = (window as any).acquireVsCodeApi();

  const handleRefresh = () => {
    vscode.postMessage({ type: "refreshSources" });
  };
  return (
    <div className="flex flex-col h-full w-full min-h-svh  bg-background text-foreground overflow-hidden">
      <header className="py-1 px-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className=" ">
            <a href={appConfig.homepage} target="_blank">
              <Logo variant="default" size="xl" className="h-[18px]" />
            </a>
          </div>
          <div className="flex items-center">
            <VscodeButton onClick={handleRefresh}>Refresh</VscodeButton>
            {/* <a href={appConfig.npm} target="_blank" className="p-1">
              <IconBrandNpm className="size-5" />
            </a>
            <a href={appConfig.supportUrl} target="_blank" className="p-1">
              <IconHelp className="size-5" />
            </a> */}
          </div>
        </div>
      </header>
      <div className="flex-grow overflow-auto">
        <MainTabs />
      </div>
    </div>
  );
};
