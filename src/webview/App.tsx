import * as React from "react";
import { useState, useEffect } from "react";
import HelloWorldPanel from "./components/HelloWorldPanel";

// Access the VS Code API
declare global {
  interface Window {
    acquireVsCodeApi(): {
      postMessage(message: any): void;
      getState(): any;
      setState(state: any): void;
    };
  }
}

// Acquire the VS Code API on component mount
const vscode = window.acquireVsCodeApi();

const App: React.FC = () => {
  // Example state
  const [message, setMessage] = useState<string>("Hello World");

  // Function to send messages to the extension
  const sendMessage = (message: string) => {
    vscode.postMessage({
      type: "info",
      value: message,
    });
  };

  // Example useEffect for initialization
  useEffect(() => {
    console.log("BenchWrk panel React component mounted");
  }, []);

  return (
    <div className="container">
      <HelloWorldPanel
        message={message}
        onButtonClick={() =>
          sendMessage("Hello from BenchWrk React panel with vscode-elements!")
        }
      />
    </div>
  );
};

export default App;
