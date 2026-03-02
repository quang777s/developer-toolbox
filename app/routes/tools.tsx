import React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/tools";
import { createClient } from "@supabase/supabase-js";

function CopyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
      aria-hidden="true"
    >
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
      // fallback
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
    <button
      onClick={handle}
      disabled={!text}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-800 text-white rounded-md disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      aria-label="copy"
      title={done ? "Copied" : "Copy"}
    >
      <CopyIcon />
      <span>{done ? "Copied" : "Copy"}</span>
    </button>
  );
}

export default function Tools() {
  const [input, setInput] = React.useState("");

  const [status, setStatus] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");

  function isValidEmail(s: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  // Supabase client (requires VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
  // Toggle to hide all Supabase UI and initialization while developing offline
  const SUPABASE_ENABLED = false;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = React.useMemo(() => {
    if (!SUPABASE_ENABLED) return null;
    if (!supabaseUrl || !supabaseAnonKey) {
      setStatus("Supabase env vars missing");
      return null;
    }
    try {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      setStatus("Supabase client ready.");
      return client;
    } catch (err) {
      console.error("Supabase init error", err);
      setStatus("Error initializing Supabase client.");
      return null;
    }
  }, [supabaseUrl, supabaseAnonKey]);

  async function getUserId(): Promise<string | null> {
    if (!supabase) return null;
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id ?? null;
    } catch {
      return null;
    }
  }

  const [vars, setVars] = React.useState<{ key: string; value: string }[]>([
    { key: "name", value: "" },
  ]);
  const [templates, setTemplates] = React.useState<{ name: string; content: string }[]>([
    { name: "Default", content: "Hello, {{name}}!" },
  ]);
  const [selectedTemplateIndex, setSelectedTemplateIndex] = React.useState(0);
  const [output, setOutput] = React.useState("");
  const [topString, setTopString] = React.useState("");

  const activeTemplate = templates[selectedTemplateIndex]?.content ?? "";

  React.useEffect(() => {
    const obj = vars.reduce<Record<string, string>>((acc, cur) => {
      if (cur.key) acc[cur.key] = cur.value;
      return acc;
    }, {});
    // expose top string as variable `top` and alias `default`, defaulting to Quick Copy `input` when empty
    const topVal = topString && topString.length > 0 ? topString : input;
    obj["top"] = topVal;
    obj["default"] = topVal;
    let out = activeTemplate;
    Object.entries(obj).forEach(([k, v]) => {
      const re = new RegExp("{{\\s*" + escapeRegExp(k) + "\\s*}}", "g");
      out = out.replace(re, v);
    });
    setOutput(out);
  }, [activeTemplate, vars, topString, input]);

  function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&");
  }

  function updateVar(index: number, field: "key" | "value", value: string) {
    setVars((prev) => {
      const copy = prev.slice();
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addVar() {
    setVars((p) => [...p, { key: "", value: "" }]);
  }

  function removeVar(i: number) {
    setVars((p) => p.filter((_, idx) => idx !== i));
  }

  function varsAsJson() {
    return JSON.stringify(
      vars.reduce<Record<string, string>>((acc, cur) => {
        if (cur.key) acc[cur.key] = cur.value;
        return acc;
      }, {}),
      null,
      2
    );
  }

  function updateActiveTemplate(value: string) {
    setTemplates((prev) => prev.map((t, index) => (index === selectedTemplateIndex ? { ...t, content: value } : t)));
  }

  function addTemplate() {
    setTemplates((prev) => {
      const next = [...prev, { name: `Template ${prev.length + 1}`, content: "New template {{name}}" }];
      setSelectedTemplateIndex(next.length - 1);
      return next;
    });
  }

  function removeTemplate(indexToRemove: number) {
    setTemplates((prev) => {
      if (prev.length === 1) {
        setSelectedTemplateIndex(0);
        return [{ name: "Default", content: "" }];
      }
      const next = prev.filter((_, index) => index !== indexToRemove);
      setSelectedTemplateIndex((current) => {
        if (current > indexToRemove) return current - 1;
        if (current === indexToRemove) return Math.max(0, current - 1);
        return current;
      });
      return next;
    });
  }

  function updateTemplateName(index: number, name: string) {
    setTemplates((prev) => prev.map((t, i) => (i === index ? { ...t, name } : t)));
  }

  // Curl runner state + helpers: parse a simple curl command and run it via fetch
  const [curlInput, setCurlInput] = React.useState<string>(
    "curl -sS -X POST 'http://localhost:3099/chat/connect'   -H 'Content-Type: application/json'   -d '{\"appId\":\"019c8418-ba43-7000-aa12-13cc150f8b13\",\"externalId\":\"alice\",\"name\":\"Alice\",\"avatar\":\"avatar.png\",\"email\":\"alice@example.com\",\"deviceType\":\"WEB\"}'"
  );
  const [curlOutput, setCurlOutput] = React.useState<string>("");
  const [curlStatusCode, setCurlStatusCode] = React.useState<number | null>(null);
  const [curlResponseHeaders, setCurlResponseHeaders] = React.useState<Record<string, string>>({});
  const [curlRunning, setCurlRunning] = React.useState(false);
  const [curlError, setCurlError] = React.useState<string | null>(null);
  const [lastRequestOptions, setLastRequestOptions] = React.useState<any>(null);
  const [sendRawBody, setSendRawBody] = React.useState(false);

  function parseCurl(cmd: string) {
    // Tokenize respecting quotes so multi-line or complex --data-raw values are captured
    const tokens: string[] = [];
    let i = 0;
    while (i < cmd.length) {
      // skip whitespace
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
            // keep escaped char as-is (unescape later)
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
          const k = raw.slice(0, idx).trim();
          const v = raw.slice(idx + 1).trim();
          headers[k] = v;
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

  async function runCurl() {
    setCurlRunning(true);
    setCurlError(null);
    setCurlOutput("");
    setCurlStatusCode(null);
    setCurlResponseHeaders({});
    try {
      const { url, method, headers, body } = parseCurl(curlInput);
      if (!url) return setCurlError("No URL found in curl command");
      const opts: RequestInit = { method };
      // clone headers to allow normalization
      const reqHeaders: Record<string, string> = { ...headers };

      let cleanedBody: any = body;
      if (typeof cleanedBody === "string") {
        let b = cleanedBody.trim();
        // remove surrounding single/double quotes if present
        if ((b.startsWith("'") && b.endsWith("'")) || (b.startsWith('"') && b.endsWith('"'))) {
          b = b.slice(1, -1);
        }
        // unescape common escaped quotes (e.g. from pasted curl strings)
        b = b.replace(/\\'/g, "'").replace(/\\\"/g, '"');
        if (!sendRawBody) {
          // try to parse JSON and re-stringify to ensure valid JSON formatting
          try {
            const parsed = JSON.parse(b);
            cleanedBody = JSON.stringify(parsed);
            // ensure Content-Type header for JSON is present
            const hasContentType = Object.keys(reqHeaders).some((k) => k.toLowerCase() === "content-type");
            if (!hasContentType) reqHeaders["Content-Type"] = "application/json";
          } catch {
            // not JSON — send as-is
            cleanedBody = b;
          }
        } else {
          // send raw string body as-is
          cleanedBody = b;
        }
      }

      if (Object.keys(reqHeaders).length) opts.headers = reqHeaders as Record<string, string>;
      if (cleanedBody !== undefined) opts.body = cleanedBody as any;

      // capture exact request options so developer can inspect what the browser will send
      setLastRequestOptions({ url, opts });

      const res = await fetch(url, opts);
      setCurlStatusCode(res.status);
      const rh: Record<string, string> = {};
      res.headers.forEach((v, k) => (rh[k] = v));
      setCurlResponseHeaders(rh);
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        setCurlOutput(JSON.stringify(parsed, null, 2));
      } catch {
        setCurlOutput(text);
      }
    } catch (err: any) {
      setCurlError(String(err?.message ?? err));
    } finally {
      setCurlRunning(false);
    }
  }

  function curlCombinedCopyText() {
    const hdrs = Object.entries(curlResponseHeaders)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    return `Status: ${curlStatusCode ?? "-"}\n\nHeaders:\n${hdrs}\n\nBody:\n${curlOutput}`;
  }

  /* Supabase CRUD helpers */
  async function fetchTemplatesFromDb() {
    if (!supabase) return;
    setStatus("Loading templates...");
    const uid = await getUserId();
    if (!uid) {
      setStatus("Sign in to load templates from Supabase.");
      return;
    }
    const { data, error } = await supabase.from("templates").select("id, name, content").eq("owner", uid);
    if (error) {
      setStatus(`Error loading templates: ${error.message}`);
      return;
    }
    if (data) {
      setTemplates(data.map((r: any) => ({ name: r.name, content: r.content })));
      setSelectedTemplateIndex(0);
      setStatus("Templates loaded.");
    }
  }

  async function saveTemplateToDb() {
    if (!supabase) {
      setStatus("Supabase not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).");
      return;
    }
    const uid = await getUserId();
    if (!uid) {
      setStatus("Sign in to save templates.");
      return;
    }
    const tpl = templates[selectedTemplateIndex];
    if (!tpl) return setStatus("No template selected.");

    const { data: existing } = await supabase.from("templates").select("id").eq("owner", uid).eq("name", tpl.name).maybeSingle();
    if (existing?.id) {
      const { error } = await supabase.from("templates").update({ content: tpl.content, updated_at: new Date().toISOString() }).eq("id", existing.id);
      if (error) return setStatus(`Error updating template: ${error.message}`);
      setStatus("Template updated.");
    } else {
      const { error } = await supabase.from("templates").insert({ owner: uid, name: tpl.name, content: tpl.content });
      if (error) return setStatus(`Error inserting template: ${error.message}`);
      setStatus("Template saved.");
    }
    await fetchTemplatesFromDb();
  }

  async function deleteTemplateFromDb() {
    if (!supabase) return setStatus("Supabase not configured.");
    const uid = await getUserId();
    if (!uid) return setStatus("Sign in to delete templates.");
    const tpl = templates[selectedTemplateIndex];
    if (!tpl) return setStatus("No template selected.");
    const { error } = await supabase.from("templates").delete().eq("owner", uid).eq("name", tpl.name);
    if (error) return setStatus(`Error deleting template: ${error.message}`);
    setStatus("Template deleted.");
    await fetchTemplatesFromDb();
  }

  async function saveSnippetToDb() {
    if (!supabase) return setStatus("Supabase not configured.");
    const uid = await getUserId();
    if (!uid) return setStatus("Sign in to save snippets.");
    const title = prompt("Snippet title", input.slice(0, 80)) || "";
    if (!input) return setStatus("Nothing to save.");
    const { error } = await supabase.from("snippets").insert({ owner: uid, title, content: input });
    if (error) return setStatus(`Error saving snippet: ${error.message}`);
    setStatus("Snippet saved.");
  }

  React.useEffect(() => {
    if (supabase) fetchTemplatesFromDb();
  }, [supabase]);

  // Export / Import
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  function exportData() {
    const payload = {
      templates,
      vars,
      topString,
      selectedTemplateIndex,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tools-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("Exported data to tools-export.json");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.templates && Array.isArray(parsed.templates)) {
          setTemplates(parsed.templates);
        }
        if (parsed.vars && Array.isArray(parsed.vars)) {
          setVars(parsed.vars);
        }
        if (typeof parsed.topString === "string") setTopString(parsed.topString);
        if (typeof parsed.selectedTemplateIndex === "number") setSelectedTemplateIndex(parsed.selectedTemplateIndex);
        setStatus("Imported data from file.");
      } catch (err: any) {
        setStatus(`Import failed: ${err?.message ?? String(err)}`);
      }
    };
    reader.readAsText(f);
    // reset input so same file can be re-imported later
    e.currentTarget.value = "";
  }

  // Auth state
  const [user, setUser] = React.useState<any | null>(null);
  React.useEffect(() => {
    let unsub: any;
    if (!supabase) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setUser(data?.user ?? null);
      } catch {
        // ignore
      }
    })();

    // subscribe to auth changes
    try {
      unsub = supabase.auth.onAuthStateChange((event: any, session: any) => {
        setUser(session?.user ?? null);
      });
    } catch {
      unsub = null;
    }

    return () => {
      mounted = false;
      if (unsub && unsub.data && typeof unsub.data.unsubscribe === "function") unsub.data.unsubscribe();
    };
  }, [supabase]);

  async function sendMagicLink(email: string) {
    if (!supabase) return setStatus("Supabase not configured.");
    setStatus("Sending sign-in link...");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return setStatus(`Error sending link: ${error.message}`);
    setStatus("Magic link sent — check your email.");
  }

  async function signOut() {
    if (!supabase) return setStatus("Supabase not configured.");
    const { error } = await supabase.auth.signOut();
    if (error) return setStatus(`Sign out error: ${error.message}`);
    setStatus("Signed out.");
    setUser(null);
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Template Studio</h1>
          <Link to="/" className="text-sm text-sky-600 hover:underline">
            ← Back to Home
          </Link>
        </div>

        {/** Supabase UI hidden while offline/developing */}
      </div>
      {status && (
        <div className="mb-4">
          <p className="text-sm text-slate-600">{status}</p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Quick Copy / QR</h2>
        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="relative w-full">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type text to copy or encode as QR"
              className="w-full p-3 pr-24 border rounded"
              rows={7}
            />
            <CopyButton text={input} className="absolute top-2 right-2" />
          </div>
          <div className="flex flex-col items-start">
              {input ? (
                <img
                  alt="qr"
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    input
                  )}`}
                  width={200}
                  height={200}
                />
              ) : (
                <div className="w-[200px] h-[200px] bg-slate-100 flex items-center justify-center text-slate-400">
                  QR preview
                </div>
              )}

              <div className="mt-2 flex items-center gap-3">
                <a
                  className={`text-sm text-sky-600 ${!input ? "opacity-50 pointer-events-none" : ""}`}
                  href={input ? `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(input)}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open larger
                </a>
                {SUPABASE_ENABLED ? (
                  <button onClick={saveSnippetToDb} className="px-2 py-1 bg-emerald-600 text-white rounded text-sm">
                    Save snippet
                  </button>
                ) : null}
                {status && <span className="text-sm text-slate-600">{status}</span>}
              </div>
          </div>
        </div>
      </section>
      {/* Curl Runner moved to its own page: /curl */}

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Template Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Template</label>
              <div className="flex gap-2">
                <button onClick={addTemplate} className="px-3 py-1 bg-slate-800 text-white rounded text-sm">
                  Add template
                </button>
                <button onClick={exportData} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm">
                  Export
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-amber-600 text-white rounded text-sm">
                  Import
                </button>
                {SUPABASE_ENABLED ? (
                  <>
                    <button onClick={saveTemplateToDb} className="px-3 py-1 bg-sky-600 text-white rounded text-sm">
                      Save to DB
                    </button>
                    <button onClick={deleteTemplateFromDb} className="px-3 py-1 bg-red-600 text-white rounded text-sm">
                      Delete from DB
                    </button>
                  </>
                ) : null}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 items-center">
              {templates.map((t, index) => (
                <div key={index} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplateIndex(index)}
                    className={`px-3 py-1 rounded-l border text-sm ${
                      index === selectedTemplateIndex ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-700 border-slate-300"
                    }`}
                  >
                    {t.name || `Template ${index + 1}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTemplate(index)}
                    className="px-2 py-1 rounded-r border border-l-0 border-red-600 text-red-600 text-sm"
                    aria-label={`remove-template-${index + 1}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <label className="text-sm">Name</label>
              <input
                value={templates[selectedTemplateIndex]?.name ?? ""}
                onChange={(e) => updateTemplateName(selectedTemplateIndex, e.target.value)}
                className="p-2 border rounded flex-1"
              />
            </div>

            


            <textarea
              value={activeTemplate}
              onChange={(e) => updateActiveTemplate(e.target.value)}
              className="w-full p-2 border rounded mt-2"
              rows={6}
            />

            <div className="mt-3">
              <label className="block text-sm font-medium">Variables</label>
              {vars.map((v, i) => (
                <div key={i} className="flex gap-2 mt-2">
                  <input
                    placeholder="key"
                    value={v.key}
                    onChange={(e) => updateVar(i, "key", e.target.value)}
                    className="p-2 border rounded w-1/3"
                  />
                  <input
                    placeholder="value"
                    value={v.value}
                    onChange={(e) => updateVar(i, "value", e.target.value)}
                    className="p-2 border rounded flex-1"
                  />
                  <button
                    onClick={() => removeVar(i)}
                    className="px-2 bg-red-600 text-white rounded"
                    aria-label="remove-var"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="mt-2">
                <button onClick={addVar} className="px-3 py-1 bg-slate-800 text-white rounded">
                  Add variable
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Output</label>
            <div className="relative mt-1">
              <textarea
                readOnly
                value={output}
                className="w-full p-3 pr-24 border rounded"
                rows={8}
              />
              <CopyButton text={output} className="absolute top-2 right-2" />
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium mb-1">Variables JSON</label>
              <pre className="p-2 bg-slate-50 border rounded w-full overflow-auto text-sm">
                <code>{varsAsJson()}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          onChange={handleImportFile}
          style={{ display: "none" }}
        />
    </main>
  );
}

export function meta(_: Route.MetaArgs) {
  return [{ title: "Template Studio" }];
}
