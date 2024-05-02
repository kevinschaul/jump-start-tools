"use client";

export default function StarterFile(props) {
  return (
    <div>
      <h3>{props.path}</h3>
      <pre>
        <code>{props.contents}</code>
      </pre>
    </div>
  );
}
