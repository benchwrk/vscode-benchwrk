#!/usr/bin/env bun

import { build } from "bun";

// Build the extension
const extensionBuild = await build({
  entrypoints: ["./src/extension.ts"],
  outdir: "./out",
  target: "node",
  sourcemap: "external",
  external: ["vscode"],
});

console.log("Extension built successfully:", extensionBuild.outputs);

// Build the webview
// const webviewBuild = await build({
//   entrypoints: ["./src/webview/index.tsx"],
//   outdir: "./out",
//   naming: {
//     entry: "webview.js",
//   },
//   output: {
//     globals: {
//       react: "React",
//       "react-dom": "React-dom",
//       "react/jsx-runtime": "react/jsx-runtime",
//     },
//   },
//   target: "browser",
//   sourcemap: "external",
//   external: ["vscode"],
//   plugins: [
//     {
//       name: "css-loader",
//       setup(build) {
//         build.onLoad({ filter: /\.css$/ }, async (args) => {
//           const text = await Bun.file(args.path).text();
//           return {
//             contents: `
//               const style = document.createElement('style');
//               style.textContent = ${JSON.stringify(text)};
//               document.head.appendChild(style);
//               export default {};
//             `,
//             loader: "js",
//           };
//         });
//       },
//     },
//   ],
// });

// console.log("Webview built successfully:", webviewBuild.outputs);
