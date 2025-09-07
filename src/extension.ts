// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { join } from "path";
import { getUri } from "./utils/getUri";
import { getNonce } from "./utils/getNonce";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "benchwrk" is now active!');

  try {
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    const helloWorldCommand = vscode.commands.registerCommand(
      "benchwrk.helloWorld",
      () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage("Hello World from BenchWrk!");
      }
    );

    // Register our custom panel webview provider
    const provider = new CustomPanelViewProvider(context.extensionUri);
    console.log("Created custom panel provider");

    // Register the provider for our custom webview views
    const panelRegistration = vscode.window.registerWebviewViewProvider(
      "benchwrk.customPanel",
      provider
    );

    const debugPanelRegistration = vscode.window.registerWebviewViewProvider(
      "benchwrk.debugPanel",
      provider
    );

    const terminalPanelRegistration = vscode.window.registerWebviewViewProvider(
      "benchwrk.terminalPanel",
      provider
    );

    console.log("Registered webview providers for BenchWrk panels");

    // Show an information message to make the panel more noticeable
    vscode.window.showInformationMessage(
      "BenchWrk panel is now available in multiple locations: Panel tab, Debug tab, and Terminal tab"
    );

    // Try to open the panel automatically - try the terminal version first since that's what you want
    vscode.commands.executeCommand("benchwrk.terminalPanel.focus");

    // Command to show the panel
    const showPanelCommand = vscode.commands.registerCommand(
      "benchwrk.showPanel",
      () => {
        // Focus on our panel in the bottom panel area
        vscode.commands.executeCommand(
          "workbench.view.extension.benchwrkPanel"
        );
      }
    );

    context.subscriptions.push(
      helloWorldCommand,
      panelRegistration,
      debugPanelRegistration,
      terminalPanelRegistration,
      showPanelCommand
    );
  } catch (error) {
    console.error("Error activating BenchWrk extension:", error);
    vscode.window.showErrorMessage(
      "Failed to activate BenchWrk panel: " + error
    );
  }
}

/**
 * Custom panel view provider that creates a webview panel using vscode-elements
 */
class CustomPanelViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    // Allow scripts in the webview
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Set the webview's HTML content
    webviewView.webview.html = this._getWebviewContent(webviewView.webview);

    // Handle messages from the webview if needed
    webviewView.webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "info":
          vscode.window.showInformationMessage(message.value);
          break;
      }
    });
  }

  private _getWebviewContent(webview: vscode.Webview): string {
    // Create URIs for the script files that will be loaded in the webview
    // const webviewScriptUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "out", "webview.js")
    // );
    // const vsCodeElementsUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(
    //     this._extensionUri,
    //     "node_modules",
    //     "@vscode-elements",
    //     "elements",
    //     "dist",
    //     "bundled.js"
    //   )
    // );

    const nonce = getNonce();
    // The CSS file from the React build output
    const stylesUri = getUri(webview, this._extensionUri, [
      "out",
      "webview-ui",
      "assets",
      "index.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, this._extensionUri, [
      "out",
      "webview-ui",
      "assets",
      "index.js",
    ]);

    // const benchwrkUiUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(
    //     this._extensionUri,
    //     "node_modules",
    //     "@benchwrk",
    //     "ui",
    //     "dist",
    //     "index.js"
    //   )
    // );

    // The HTML content for the webview panel with React
    return `<!DOCTYPE html>
		<html lang="en" class="dark">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'unsafe-inline'; img-src ${webview.cspSource} https:; connect-src https://api.benchwrk.com;"> 
      <title>BenchWrk Panel</title>
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
			<!-- Load VSCode Elements first --> 
		</head>
		<body style="margin:0; padding:0 !important; overflow:hidden;">
			<div id="root"  class="dark"></div>
			
			<!-- Load React application --> 
        <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
		</body>
		</html>`;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
