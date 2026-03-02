import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Developer Toolbox" }];
}

export default function Home() {
  return (
    <main className="pt-16 p-4 container mx-auto">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold">Developer Toolbox</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          A growing collection of developer utilities. Start with Template
          Studio and Curl Runner, and add more tools over time.
        </p>
        <div className="mt-6">
          <Link
            to="/template-studio"
            className="inline-block px-5 py-2 bg-sky-600 text-white rounded-lg"
          >
            Open Template Studio
          </Link>
          <Link
            to="/curl"
            className="ml-3 inline-block px-5 py-2 bg-emerald-600 text-white rounded-lg"
          >
            Open Curl Runner
          </Link>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        <article className="p-4 border rounded">
          <h3 className="font-semibold">Quick Copy</h3>
          <p className="text-sm text-gray-600 mt-2">
            Type any string and copy it to your clipboard with a single
            click. Useful for generating snippets, tokens, or short text.
          </p>
        </article>

        <article className="p-4 border rounded">
          <h3 className="font-semibold">QR Generator</h3>
          <p className="text-sm text-gray-600 mt-2">
            Create a QR preview from your text and open a larger version for
            sharing or printing.
          </p>
        </article>

        <article className="p-4 border rounded">
          <h3 className="font-semibold">Template Studio</h3>
          <p className="text-sm text-gray-600 mt-2">
            Define simple mustache-like templates and variables to produce
            final strings. Copy outputs or view variables as JSON.
          </p>
          <div className="mt-4">
            <Link to="/template-studio" className="inline-block px-4 py-2 bg-sky-600 text-white rounded text-sm">Open Template Studio</Link>
          </div>
        </article>

        <article className="p-4 border rounded">
          <h3 className="font-semibold">Curl Runner</h3>
          <p className="text-sm text-gray-600 mt-2">
            Run and inspect curl commands, save multiple commands, and use
            variable substitution with {'{{key}}'} placeholders.
            Open the dedicated Curl Runner to test API requests from your browser.
          </p>
          <div className="mt-4">
            <Link to="/curl" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded text-sm">Open Curl Runner</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
