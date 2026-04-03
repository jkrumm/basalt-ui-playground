import { Button, Pre } from "@blueprintjs/core";
import { useCallback, useRef, useState } from "react";
import styles from "./CodeBlock.module.css";

const LANGUAGE_RE = /language-(\w+)/;

interface CodeBlockProps extends React.HTMLAttributes<HTMLPreElement> {
  children?: React.ReactNode;
  "data-filename"?: string;
}

export function CodeBlock({
  children,
  className,
  style,
  "data-filename": filename,
  ...props
}: CodeBlockProps) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    const text = preRef.current?.textContent ?? "";
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(setCopied, 2000, false);
    });
  }, []);

  const lang = extractLanguage(className);

  return (
    <div className={styles.wrapper}>
      {filename && <div className={styles.filename}>{filename}</div>}
      <Pre ref={preRef} className={className} style={style} {...props}>
        {children}
      </Pre>
      {lang && <span className={styles.langBadge}>{lang}</span>}
      <Button
        variant="minimal"
        size="small"
        type="button"
        className={`${styles.copyBtn}${copied ? ` ${styles.copied}` : ""}`}
        onClick={copyToClipboard}
      >
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}

function extractLanguage(className?: string): string | null {
  if (!className) return null;
  const match = className.match(LANGUAGE_RE);
  return match ? (match[1] ?? null) : null;
}
