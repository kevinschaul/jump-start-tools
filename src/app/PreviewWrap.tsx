import { componentMap } from "./componentMap";

export default async function PreviewWrap({ dir }: { dir: string }) {
  if (dir in componentMap) {
    const Preview = componentMap[dir];

    return (
      <div className="preview">
        <h2>Preview</h2>
        <Preview />
      </div>
    );
  } else {
    return (
      <p>
        <i>
          No preview found. To add a preview for this starter, add a
          `Preview.js` file.
        </i>
      </p>
    );
  }
}
