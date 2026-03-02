import React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/tools";

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
    <button onClick={handle} disabled={!text} className={`inline-flex items-center gap-1.5 bg-slate-800 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed ${className}`} aria-label="copy" title={done ? "Copied" : "Copy"}>
      <CopyIcon />
      <span>{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

export default function CurlPage() {
  const [commands, setCommands] = React.useState<{ name: string; cmd: string }[]>([
    {
      name: "Connect",
      cmd:
        "curl -sS -X POST 'http://localhost:3099/chat/connect'   -H 'Content-Type: application/json'   -d '{\"appId\":\"019c8418-ba43-7000-aa12-13cc150f8b13\",\"externalId\":\"alice\",\"name\":\"Alice\",\"avatar\":\"avatar.png\",\"email\":\"alice@example.com\",\"deviceType\":\"WEB\"}'",
    },
  ]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [curlOutput, setCurlOutput] = React.useState("");
  const [responseJson, setResponseJson] = React.useState<any | null>(null);
  const [curlStatusCode, setCurlStatusCode] = React.useState<number | null>(null);
  const [curlResponseHeaders, setCurlResponseHeaders] = React.useState<Record<string, string>>({});
  const [curlRunning, setCurlRunning] = React.useState(false);
  const [curlError, setCurlError] = React.useState<string | null>(null);
  const [lastRequestOptions, setLastRequestOptions] = React.useState<any>(null);
  
  function JsonValue({ value }: { value: any }) {
    const isPrimitive = value === null || typeof value !== "object";
    async function copy() {
      try {
        await navigator.clipboard.writeText(String(value ?? "null"));
      } catch {}
    }
    if (isPrimitive) {
      return (
        <div className="flex items-center gap-2">
          <code className="break-words">{String(value)}</code>
          <button onClick={copy} className="px-2 py-0.5 bg-slate-800 text-white rounded text-xs">Copy</button>
        </div>
      );
    }
    if (Array.isArray(value)) {
      return (
        <div className="ml-4">
          [
          {value.map((v, i) => (
            <div key={i} className="ml-2">
              <JsonValue value={v} />
            </div>
          ))}
          ]
        </div>
      );
    }
    return (
      <div className="ml-2">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="mb-1">
            <div className="text-sm font-medium">{k}:</div>
            <div className="ml-3">
              <JsonValue value={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  function exportData() {
    const payload = { commands, vars, selectedIndex };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curl-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.commands && Array.isArray(parsed.commands)) setCommands(parsed.commands);
        if (parsed.vars && Array.isArray(parsed.vars)) setVars(parsed.vars);
        if (typeof parsed.selectedIndex === "number") setSelectedIndex(parsed.selectedIndex);
      } catch (err: any) {
        console.error("Import failed:", err);
      }
    };
    reader.readAsText(f);
    e.currentTarget.value = "";
  }

  const [vars, setVars] = React.useState<{ key: string; value: string }[]>([{ key: "appId", value: "019c8418-ba43-7000-aa12-13cc150f8b13" }]);
  const [sendRawBody, setSendRawBody] = React.useState(false);

  function updateCmd(i: number, cmd: string) {
    setCommands((p) => p.map((c, idx) => (idx === i ? { ...c, cmd } : c)));
  }
  function addCmd() {
    setCommands((p) => [...p, { name: `Command ${p.length + 1}`, cmd: "" }]);
    setSelectedIndex(commands.length);
  }
  function removeCmd(i: number) {
    setCommands((p) => p.filter((_, idx) => idx !== i));
    setSelectedIndex((s) => Math.max(0, s - (i <= s ? 1 : 0)));
  }

  function parseCurl(cmd: string) {
    const tokens: string[] = [];
    let i = 0;
    while (i < cmd.length) {
      if (/\s/.test(cmd[i])) {
        i++;
        continue;
      }
      const ch = cmd[i];
      if (ch === '"' || ch === "'") {
        const quote = ch;
        i++;
        let buf = "";
        while (i < cmd.length) {
          const c = cmd[i];
          if (c === "\\" && i + 1 < cmd.length) {
            buf += cmd[i + 1];
            i += 2;
            continue;
          }
          if (c === quote) {
            i++;
            break;
          }
          buf += c;
          i++;
        }
        tokens.push(buf);
      } else {
        let buf = "";
        while (i < cmd.length && !/\s/.test(cmd[i])) {
          buf += cmd[i];
          i++;
        }
        tokens.push(buf);
      }
    }

    let url = "";
    let method = "GET";
    const headers: Record<string, string> = {};
    let body: string | undefined = undefined;

    for (let t = 0; t < tokens.length; t++) {
      const token = tokens[t];
      if (!url && /^https?:\/\//i.test(token)) {
        url = token;
        continue;
      }
      if (token === "-X" && tokens[t + 1]) {
        method = tokens[t + 1].toUpperCase();
        t++;
        continue;
      }
      if ((token === "-H" || token === "--header") && tokens[t + 1]) {
        const raw = tokens[t + 1];
        const idx = raw.indexOf(":");
        if (idx > -1) {
          headers[raw.slice(0, idx).trim()] = raw.slice(idx + 1).trim();
        }
        t++;
        continue;
      }
      if (token === "-d" || token === "--data" || token === "--data-raw" || token === "--data-binary") {
        if (tokens[t + 1] !== undefined) {
          body = tokens[t + 1];
          t++;
        }
        continue;
      }
    }

    if (!method && body) method = "POST";
    return { url, method, headers, body };
  }

  function applyVarsToBody(body: string | undefined) {
    if (!body) return body;
    let out = body;
    vars.forEach((v) => {
      if (!v.key) return;
      const re = new RegExp("{{\\s*" + v.key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&") + "\\s*}}", "g");
      out = out.replace(re, v.value);
    });
    return out;
  }

  async function runSelected() {
    setCurlRunning(true);
    setCurlError(null);
    setCurlOutput("");
    setCurlStatusCode(null);
    setCurlResponseHeaders({});
    try {
      const cmd = commands[selectedIndex]?.cmd ?? "";
      const { url, method, headers, body } = parseCurl(cmd);
      // apply variable substitution to URL and header values
      const urlWithVars = applyVarsToBody(url) || url;
      if (!url) return setCurlError("No URL found in curl command");
      const opts: RequestInit = { method };
      const reqHeaders: Record<string, string> = { ...headers };

      Object.keys(reqHeaders).forEach((k) => {
        reqHeaders[k] = applyVarsToBody(reqHeaders[k]) ?? reqHeaders[k];
      });

      let cleanedBody: any = body;
      if (typeof cleanedBody === "string") {
        let b = cleanedBody.trim();
        if ((b.startsWith("'") && b.endsWith("'")) || (b.startsWith('"') && b.endsWith('"'))) {
          b = b.slice(1, -1);
        }
        b = b.replace(/\\'/g, "'").replace(/\\\"/g, '"');
        b = applyVarsToBody(b);
        if (!sendRawBody) {
          try {
            const parsed = JSON.parse(b);
            cleanedBody = JSON.stringify(parsed);
            const hasContentType = Object.keys(reqHeaders).some((k) => k.toLowerCase() === "content-type");
            if (!hasContentType) reqHeaders["Content-Type"] = "application/json";
          } catch {
            cleanedBody = b;
          }
        } else {
          cleanedBody = b;
        }
      }

      if (Object.keys(reqHeaders).length) opts.headers = reqHeaders as Record<string, string>;
      if (cleanedBody !== undefined) opts.body = cleanedBody as any;
      setLastRequestOptions({ url: urlWithVars, opts });

      const res = await fetch(urlWithVars, opts);
      setCurlStatusCode(res.status);
      const rh: Record<string, string> = {};
      res.headers.forEach((v, k) => (rh[k] = v));
      setCurlResponseHeaders(rh);
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        setResponseJson(parsed);
        setCurlOutput(JSON.stringify(parsed, null, 2));
      } catch {
        setResponseJson(null);
        setCurlOutput(text);
      }
    } catch (err: any) {
      setCurlError(String(err?.message ?? err));
    } finally {
      setCurlRunning(false);
    }
  }

  const substitutedCmd = React.useMemo(() => {
    const cmd = commands[selectedIndex]?.cmd ?? "";
    return applyVarsToBody(cmd) ?? cmd;
  }, [commands, selectedIndex, vars]);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Curl Runner</h1>
          <Link to="/" className="text-sm text-sky-600 hover:underline">← Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium">Commands</label>
            <div className="flex gap-2">
              <button onClick={exportData} className="px-2 py-1 bg-emerald-600 text-white rounded text-sm">Export</button>
              <button onClick={() => fileInputRef.current?.click()} className="px-2 py-1 bg-amber-600 text-white rounded text-sm">Import</button>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {commands.map((c, i) => (
              <div key={i} className={`p-2 border rounded ${i === selectedIndex ? "bg-slate-100" : "bg-white"}`}>
                <div className="flex items-center justify-between">
                  <input value={c.name} onChange={(e) => setCommands((p) => p.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} className="p-1 border rounded text-sm flex-1 mr-2" />
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedIndex(i)} className="px-2 py-1 bg-slate-800 text-white rounded text-sm">Select</button>
                    <button onClick={() => removeCmd(i)} className="px-2 py-1 bg-red-600 text-white rounded text-sm">Del</button>
                  </div>
                </div>
                <textarea value={c.cmd} onChange={(e) => updateCmd(i, e.target.value)} className="w-full p-2 mt-2 border rounded text-sm" rows={4} />
              </div>
            ))}
            <div>
              <button onClick={addCmd} className="px-3 py-1 bg-slate-800 text-white rounded text-sm">Add command</button>
            </div>
          </div>
          <input type="file" accept="application/json" ref={fileInputRef} onChange={handleImportFile} style={{ display: "none" }} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium">Selected Command</label>
          <div className="mt-2 p-3 border rounded">
            <div className="flex gap-2 items-center mb-2">
              <CopyButton text={commands[selectedIndex]?.cmd ?? ""} className="px-4 py-2 text-base" />
              <button onClick={runSelected} disabled={curlRunning} className="px-4 py-2 bg-slate-800 text-white rounded text-base">{curlRunning ? "Running..." : "Run"}</button>
              <label className="inline-flex items-center gap-2 text-sm ml-4"><input type="checkbox" checked={sendRawBody} onChange={(e) => setSendRawBody(e.target.checked)} /> <span>Send raw body</span></label>
            </div>

            <div className="mb-3">
              <label className="text-sm">Command (variables applied)</label>
                <div className="mt-2 flex items-start gap-2">
                <pre className="p-2 bg-slate-50 border rounded w-full overflow-auto text-sm whitespace-pre-wrap break-words"><code>{substitutedCmd || "-"}</code></pre>
                <div className="pt-2">
                  <CopyButton text={substitutedCmd ?? ""} className="px-4 py-2 text-base" />
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="text-sm">Variables ({'{{key}}'} substitution)</label>
              {vars.map((v, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <input placeholder="key" value={v.key} onChange={(e) => setVars((p) => p.map((x, idx) => (idx === i ? { ...x, key: e.target.value } : x)))} className="p-2 border rounded w-1/3" />
                  <input placeholder="value" value={v.value} onChange={(e) => setVars((p) => p.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)))} className="p-2 border rounded flex-1" />
                </div>
              ))}
              <div className="mt-2">
                <button onClick={() => setVars((p) => [...p, { key: "", value: "" }])} className="px-3 py-1 bg-slate-800 text-white rounded text-sm">Add variable</button>
              </div>
            </div>

            <div>
              <label className="text-sm">Response</label>
              <div className="mt-2">
                <div className="mb-2 flex items-center gap-2">
                  <CopyButton text={curlOutput} className="px-4 py-2 text-base" />
                  <span className="text-sm text-slate-600">{curlStatusCode ? `Status ${curlStatusCode}` : ""}</span>
                </div>
                <div className="mb-2">
                  <label className="text-sm">Headers</label>
                  <pre className="p-2 bg-slate-50 border rounded w-full overflow-auto text-sm"><code>{Object.entries(curlResponseHeaders).map(([k, v]) => `${k}: ${v}`).join("\n")}</code></pre>
                </div>
                <div>
                  <label className="text-sm">Body</label>
                  <div className="p-2 bg-white border rounded w-full overflow-auto text-sm">
                    {responseJson ? (
                      <div>
                        <div className="mb-2 flex gap-2">
                          <button
                            onClick={async () => {
                              const token = responseJson?.data?.token;
                              if (token) {
                                await navigator.clipboard.writeText(String(token));
                                setVars((p) => {
                                  const idx = p.findIndex((x) => x.key === "token");
                                  if (idx >= 0) {
                                    const copy = p.slice();
                                    copy[idx] = { ...copy[idx], value: String(token) };
                                    return copy;
                                  }
                                  return [...p, { key: "token", value: String(token) }];
                                });
                              }
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded text-base"
                          >
                            Copy token
                          </button>
                          <CopyButton text={JSON.stringify(responseJson, null, 2)} className="px-4 py-2 text-base" />
                        </div>
                        <div>
                          <JsonValue value={responseJson} />
                        </div>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap break-words">{curlOutput}</pre>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <label className="text-sm">Request sent (inspect)</label>
                  <pre className="p-2 bg-slate-50 border rounded w-full overflow-auto text-sm"><code>{lastRequestOptions ? JSON.stringify(lastRequestOptions, null, 2) : "-"}</code></pre>
                  <div className="mt-3 flex justify-end">
                    <button onClick={runSelected} disabled={curlRunning} className="px-4 py-2 bg-slate-800 text-white rounded text-base">{curlRunning ? "Running..." : "Run"}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export function meta(_: Route.MetaArgs) {
  return [{ title: "Curl Runner" }];
}
