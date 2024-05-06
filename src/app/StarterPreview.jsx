"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";

export default function StarterPreview(props) {
  const { starter, files } = props;

  // Only render a preview if the starter has a preview entry
  const renderPreview = !!starter.preview;
  const previewConfig = starter.preview;

  // Figure out which file to activate in the editor by default. It can be
  // specified in the jump-start.yaml, otherwise it defaults to the first file.
  const mainFile =
    files.find((d) => d.path === starter.mainFile).path || files[0].path;
  
  const filesForSandpack = files.reduce((p, v) => {
    // Rewrite files into ./starter directory to avoid conflicts with
    // codesandbox's "index.js"
    p[`/starter/${v.path}`] = {
      active: v.path === mainFile,
      code: v.contents,
    };
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
      customSetup={
        previewConfig?.dependencies
          ? {
              dependencies: previewConfig.dependencies,
            }
          : {}
      }
    >
      <SandpackLayout>
        <SandpackCodeEditor showTabs={true} />
        {renderPreview && <SandpackPreview />}
      </SandpackLayout>
    </SandpackProvider>
  );
}
