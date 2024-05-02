"use client";

export default function CopyableCommand({ command }: { command: string }) {
  return (
    <code className="copyable-command">
      {command}
      <button onClick={() => navigator.clipboard.writeText(command)}>
        Copy
      </button>
    </code>
  );
}
