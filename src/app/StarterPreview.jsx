"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
} from "@codesandbox/sandpack-react";

export default async function StarterPreview(props) {
  const { starter, files } = props;

  // Only render a preview if the starter has a preview entry
  const renderPreview = !!starter.preview
  const previewConfig = starter.preview;

  const filesForSandpack = files.reduce((p, v) => {
    // Rewrite files into ./starter directory to avoid conflicts with
    // codesandbox's "index.js"
    p[`/starter/${v.path}`] = v.contents;
    return p;
  }, {});

  if (previewConfig?.template === "react") {
    // Rewrite App.js to return the preview
    filesForSandpack["/App.js"] = {
      hidden: true,
      code: `import Preview from "./starter/Preview.js";
  export default function App() {
    return <Preview />
  }`,
    };
  }

  return (
    <SandpackProvider
      template={previewConfig?.template || "vanilla"}
      files={filesForSandpack}
      // TODO visibleFiles, activeFile are not working
      visibleFiles={files.map(d => '/starter/' + d.path)}
      activeFile={'/starter/' + starter.mainFile}
      customSetup={
        previewConfig?.dependencies ? {
          dependencies: previewConfig.dependencies,
        } : {}
      }
    >
      <SandpackLayout>
        <SandpackCodeEditor />
        {renderPreview && <SandpackPreview />}
      </SandpackLayout>
    </SandpackProvider>
  );
}
