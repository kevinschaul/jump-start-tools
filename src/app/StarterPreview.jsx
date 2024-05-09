"use client";

import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { useEffect, useState } from "react";

export default function StarterPreview(props) {
  const { starter, files } = props;

  // Show in html whether the preview has rendered yet. Useful for taking
  // screenshots of the previews.
  const [hasPreviewRendered, setHasPreviewRendered] = useState(false)

  // Only render a preview if the starter has a preview entry
  const renderPreview = !!starter.preview;
  const previewConfig = starter.preview;

  // Figure out which file to activate in the editor by default. It can be
  // specified in the jump-start.yaml, otherwise it defaults to the first file.
  const mainFile =
    files.find((d) => d.path === starter.mainFile)?.path || files[0].path;

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
    <div className="starter-preview" data-has-rendered={hasPreviewRendered}>
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
        <SandpackListener setHasPreviewRendered={setHasPreviewRendered} />

        {renderPreview && (
          <>
            <hr />
            <h3>Preview</h3>

            <SandpackLayout>
              <SandpackPreview style={{ height: 400 }} />
            </SandpackLayout>
          </>
        )}

        <hr />
        <h3>Starter files</h3>
        <SandpackLayout>
          <SandpackCodeEditor
            showTabs={true}
            showLineNumbers={true}
            style={{ width: "100%", height: "80svh" }}
          />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}

/* This is a bit goofy, but `useSandpack()` users must be a child
 * of `SandpackProvider`
 */
function SandpackListener(props) {
  const { setHasPreviewRendered } = props;
  const { listen } = useSandpack();

  useEffect(() => {
    const stopListening = listen((msg) => {
      if (msg.type === "success") {
        setHasPreviewRendered(true)
      }
    });

   return () => {
      stopListening();
    };
  }, [listen]);

  return null
}
