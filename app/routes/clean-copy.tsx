import React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/clean-copy";

function CopyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [done, setDone] = React.useState(false);
  async function handle() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text || "");
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text || "";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    }
  }
  return (
    <button onClick={handle} disabled={!text} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-800 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed ${className}`} aria-label="copy" title={done ? "Copied" : "Copy"}>
      <CopyIcon />
      <span>{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

const DEFAULT_START_MARKER = "You are a helpful AI assistant";
const DEFAULT_END_MARKER = "Do you understand?.";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function CleanCopy() {
  const [input, setInput] = React.useState("");
  const [startMarker, setStartMarker] = React.useState(DEFAULT_START_MARKER);
  const [endMarker, setEndMarker] = React.useState(DEFAULT_END_MARKER);
  const [collapseBlankLines, setCollapseBlankLines] = React.useState(true);

  const { output, removed } = React.useMemo(() => {
    const text = input;
    if (!text || !startMarker) return { output: text, removed: false };
    let re: RegExp;
    try {
      re = new RegExp(escapeRegExp(startMarker) + "[\\s\\S]*?" + escapeRegExp(endMarker), "gi");
    } catch {
      return { output: text, removed: false };
    }
    let cleaned = text.replace(re, "");
    if (collapseBlankLines) {
      cleaned = cleaned.replace(/\n[ \t]*\n([ \t]*\n)+/g, "\n\n");
    }
    return { output: cleaned, removed: cleaned !== text };
  }, [input, startMarker, endMarker, collapseBlankLines]);

  const noEndMarker = input && startMarker && !removed && new RegExp(escapeRegExp(startMarker), "i").test(input);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold dark:text-gray-100">Clean Copy</h1>
        <Link to="/" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
          ← Back to Home
        </Link>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Paste copied text and remove everything between the start and end markers
        (e.g. injected AI-assistant messages when copying from web pages).
      </p>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <label className="text-sm font-medium dark:text-gray-100 whitespace-nowrap">Start marker</label>
          <input
            value={startMarker}
            onChange={(e) => setStartMarker(e.target.value)}
            className="p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <label className="text-sm font-medium dark:text-gray-100 whitespace-nowrap">End marker</label>
          <input
            value={endMarker}
            onChange={(e) => setEndMarker(e.target.value)}
            className="p-2 border rounded w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
        </div>
        <label className="flex items-center gap-2 text-sm dark:text-gray-100">
          <input type="checkbox" checked={collapseBlankLines} onChange={(e) => setCollapseBlankLines(e.target.checked)} />
          Collapse blank lines
        </label>
        <button
          onClick={() => {
            setStartMarker(DEFAULT_START_MARKER);
            setEndMarker(DEFAULT_END_MARKER);
          }}
          className="px-3 py-1 bg-slate-800 text-white rounded text-sm"
        >
          Reset markers
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium dark:text-gray-100 mb-1">Input (paste here)</label>
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste text containing the block to remove..."
              className="w-full p-3 pr-24 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              rows={12}
            />
            <CopyButton text={input} className="absolute top-2 right-2" />
          </div>
          {noEndMarker ? (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Start marker found but end marker missing — nothing removed.
            </p>
          ) : (
            removed && <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">Block removed ({input.length - output.length} chars).</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium dark:text-gray-100 mb-1">Output (clean)</label>
          <div className="relative">
            <textarea
              readOnly
              value={output}
              className="w-full p-3 pr-24 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              rows={12}
            />
            <CopyButton text={output} className="absolute top-2 right-2" />
          </div>
        </div>
      </div>
    </main>
  );
}

export function meta(_: Route.MetaArgs) {
  return [{ title: "Clean Copy" }];
}
