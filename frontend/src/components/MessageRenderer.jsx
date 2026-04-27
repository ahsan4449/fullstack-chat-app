/**
 * MessageRenderer — Parses message text and renders:
 * - Triple-backtick code blocks as formatted <pre><code> with copy button
 * - Inline `code` with monospace styling
 * - Plain text as normal paragraphs
 */

import { useState } from "react";
import { Copy, Check } from "lucide-react";

const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative mt-1 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 text-left w-full">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 border-b border-white/10">
        <span className="text-xs text-zinc-400 font-mono">
          {lang || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="size-3 text-green-400" />
              <span className="text-green-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="size-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <pre className="overflow-x-auto p-3 text-xs text-zinc-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

const MessageRenderer = ({ text }) => {
  if (!text) return null;

  // Split on triple-backtick code blocks: ```lang\ncode\n```
  const parts = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Text before this code block
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: "code", lang: match[1], content: match[2] });
    lastIndex = match.index + match[0].length;
  }

  // Remaining text after last code block
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  // If no code blocks found, treat entire text as plain
  if (parts.length === 0) {
    parts.push({ type: "text", content: text });
  }

  return (
    <div className="w-full">
      {parts.map((part, i) => {
        if (part.type === "code") {
          return <CodeBlock key={i} code={part.content} lang={part.lang} />;
        }

        // Render plain text — also handle inline `code`
        const inlineParts = part.content.split(/(`[^`]+`)/g);
        return (
          <p key={i} className="whitespace-pre-wrap break-words leading-relaxed">
            {inlineParts.map((chunk, j) =>
              chunk.startsWith("`") && chunk.endsWith("`") ? (
                <code
                  key={j}
                  className="bg-white/20 rounded px-1 py-0.5 font-mono text-xs"
                >
                  {chunk.slice(1, -1)}
                </code>
              ) : (
                chunk
              )
            )}
          </p>
        );
      })}
    </div>
  );
};

export default MessageRenderer;
