"use client";

import { useState } from "react";

export default function CopyableCommand({ command }: { command: string }) {
  const defaultButtonText = "Copy"
  const [buttonText, setButtonText] = useState(defaultButtonText)

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setButtonText("Copied")
      setTimeout(() => {
        setButtonText(defaultButtonText)
      }, 1000)
    } catch (e) {
      console.error(e);
      setButtonText('Error');
    }
  }
  
  return (
    <div className="copyable-command">
      <pre className="copyable-command">{command}</pre>
      <button onClick={onClick}>
        {buttonText}
      </button>
    </div>
  );
}
