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
          Studio, Profit Calculator, and Curl Runner, and add more tools over
          time.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/template-studio"
            className="px-5 py-2 bg-sky-600 text-white rounded-lg"
          >
            Open Template Studio
          </Link>
          <Link
            to="/profit-calculator"
            className="px-5 py-2 bg-amber-600 text-white rounded-lg"
          >
            Open Profit Calculator
          </Link>
          <Link
            to="/curl"
            className="px-5 py-2 bg-emerald-600 text-white rounded-lg"
          >
            Open Curl Runner
          </Link>
          <Link
            to="/loto"
            className="px-5 py-2 bg-red-600 text-white rounded-lg"
          >
            Open Lô tô
          </Link>
          <Link
            to="/hrtool"
            className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Open HRTool
          </Link>
          <Link
            to="/houses"
            className="px-5 py-2 bg-purple-600 text-white rounded-lg"
          >
            Open Houses Database
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
          <h3 className="font-semibold">Profit Calculator</h3>
          <p className="text-sm text-gray-600 mt-2">
            Add multiple buy entries, calculate average entry, and generate
            profit/loss tables across price ranges for crypto, gold, silver,
            and more.
          </p>
          <div className="mt-4">
            <Link to="/profit-calculator" className="inline-block px-4 py-2 bg-amber-600 text-white rounded text-sm">Open Profit Calculator</Link>
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

        <article className="p-4 border rounded">
          <h3 className="font-semibold">Lô tô</h3>
          <p className="text-sm text-gray-600 mt-2">
            Trò chơi Xổ số Việt Nam. Gọi các số từ 1 đến 90 một cách ngẫu nhiên.
            Tùy chỉnh thời gian chờ giữa các lần gọi số và thưởng thức âm thanh độc nhất.
          </p>
          <div className="mt-4">
            <Link to="/loto" className="inline-block px-4 py-2 bg-red-600 text-white rounded text-sm">Open Lô tô</Link>
          </div>
        </article>

        <article className="p-4 border rounded">
          <h3 className="font-semibold">HRTool WFH</h3>
          <p className="text-sm text-gray-600 mt-2">
            Register WFH days and OT requests by month with quick confirmation dialogs.
            Includes Sprint Planning OT and Weekly Discussion OT helpers.
          </p>
          <div className="mt-4">
            <Link to="/hrtool" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded text-sm">Open HRTool</Link>
          </div>
        </article>

        <article className="p-4 border rounded">
          <h3 className="font-semibold">Houses Database</h3>
          <p className="text-sm text-gray-600 mt-2">
            Browse a database of real estate listings with descriptions, images, and media URLs.
            Search, filter by images, and navigate through listings easily.
          </p>
          <div className="mt-4">
            <Link to="/houses" className="inline-block px-4 py-2 bg-purple-600 text-white rounded text-sm">Open Houses Database</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
