import React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/pnl";

type Position = {
  quantity: string;
  entryPrice: string;
};

type Scenario = {
  price: number;
  pnl: number;
  roi: number;
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildScenarios(
  totalQty: number,
  totalCostWithBuyFee: number,
  sellFeePercent: number,
  start: number,
  end: number,
  step: number
) {
  const rows: Scenario[] = [];
  if (totalQty <= 0 || step <= 0) return rows;

  const min = Math.min(start, end);
  const max = Math.max(start, end);
  for (let price = min; price <= max + 1e-9; price += step) {
    const roundedPrice = Math.round(price * 1_000_000) / 1_000_000;
    const grossValue = roundedPrice * totalQty;
    const sellFee = grossValue * (sellFeePercent / 100);
    const netSellValue = grossValue - sellFee;
    const pnl = netSellValue - totalCostWithBuyFee;
    const roi = totalCostWithBuyFee > 0 ? (pnl / totalCostWithBuyFee) * 100 : 0;
    rows.push({ price: roundedPrice, pnl, roi });
  }
  return rows;
}

function numberFormatter(value: number, maximumFractionDigits = 4) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  }).format(value);
}

function currencyFormatter(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${numberFormatter(value, 2)} ${currency || "USD"}`;
  }
}

export default function PnlPage() {
  const [asset, setAsset] = React.useState("SOL");
  const [currency, setCurrency] = React.useState("USDT");
  const [feePercent, setFeePercent] = React.useState("0.1");
  const [status, setStatus] = React.useState<string | null>(null);
  const [positions, setPositions] = React.useState<Position[]>([
    { quantity: "25", entryPrice: "123.3" },
    { quantity: "12.5", entryPrice: "80" },
  ]);

  const [profitStart, setProfitStart] = React.useState("130");
  const [profitEnd, setProfitEnd] = React.useState("180");
  const [profitStep, setProfitStep] = React.useState("5");

  const [lossStart, setLossStart] = React.useState("120");
  const [lossEnd, setLossEnd] = React.useState("50");
  const [lossStep, setLossStep] = React.useState("5");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const totals = React.useMemo(() => {
    let totalQty = 0;
    let totalCost = 0;
    const fee = Math.max(0, toNumber(feePercent));
    positions.forEach((position) => {
      const qty = toNumber(position.quantity);
      const entry = toNumber(position.entryPrice);
      if (qty > 0 && entry > 0) {
        totalQty += qty;
        const gross = qty * entry;
        const buyFee = gross * (fee / 100);
        totalCost += gross + buyFee;
      }
    });
    const avgEntry = totalQty > 0 ? totalCost / totalQty : 0;
    return { totalQty, totalCost, avgEntry };
  }, [positions, feePercent]);

  const profitScenarios = React.useMemo(
    () =>
      buildScenarios(
        totals.totalQty,
        totals.totalCost,
        Math.max(0, toNumber(feePercent)),
        toNumber(profitStart),
        toNumber(profitEnd),
        toNumber(profitStep)
      ),
    [totals, feePercent, profitStart, profitEnd, profitStep]
  );

  const lossScenarios = React.useMemo(
    () =>
      buildScenarios(
        totals.totalQty,
        totals.totalCost,
        Math.max(0, toNumber(feePercent)),
        toNumber(lossStart),
        toNumber(lossEnd),
        toNumber(lossStep)
      ),
    [totals, feePercent, lossStart, lossEnd, lossStep]
  );

  function updatePosition(index: number, field: keyof Position, value: string) {
    setPositions((previous) => {
      const copy = previous.slice();
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addPosition() {
    setPositions((previous) => [...previous, { quantity: "", entryPrice: "" }]);
  }

  function removePosition(index: number) {
    setPositions((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  }

  function exportData() {
    const payload = {
      asset,
      currency,
      feePercent,
      positions,
      profit: { start: profitStart, end: profitEnd, step: profitStep },
      loss: { start: lossStart, end: lossEnd, step: lossStep },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "profit-calculator-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus("Exported data to profit-calculator-export.json");
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));

        if (typeof parsed.asset === "string") setAsset(parsed.asset.toUpperCase());
        if (typeof parsed.currency === "string") setCurrency(parsed.currency.toUpperCase());
        if (parsed.feePercent !== undefined) setFeePercent(String(parsed.feePercent));
        if (Array.isArray(parsed.positions)) {
          const normalized = parsed.positions
            .map((p: any) => ({
              quantity: typeof p?.quantity === "string" ? p.quantity : String(p?.quantity ?? ""),
              entryPrice: typeof p?.entryPrice === "string" ? p.entryPrice : String(p?.entryPrice ?? ""),
            }))
            .filter((p: Position) => p.quantity !== "" || p.entryPrice !== "");
          setPositions(normalized.length ? normalized : [{ quantity: "", entryPrice: "" }]);
        }

        if (parsed.profit && typeof parsed.profit === "object") {
          if (parsed.profit.start !== undefined) setProfitStart(String(parsed.profit.start));
          if (parsed.profit.end !== undefined) setProfitEnd(String(parsed.profit.end));
          if (parsed.profit.step !== undefined) setProfitStep(String(parsed.profit.step));
        }

        if (parsed.loss && typeof parsed.loss === "object") {
          if (parsed.loss.start !== undefined) setLossStart(String(parsed.loss.start));
          if (parsed.loss.end !== undefined) setLossEnd(String(parsed.loss.end));
          if (parsed.loss.step !== undefined) setLossStep(String(parsed.loss.step));
        }

        setStatus("Imported data from file.");
      } catch (err: any) {
        setStatus(`Import failed: ${err?.message ?? String(err)}`);
      }
    };
    reader.readAsText(f);
    e.currentTarget.value = "";
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Profit Calculator</h1>
        <Link to="/" className="text-sm text-sky-600 hover:underline">
          ← Back to Home
        </Link>
        <button onClick={exportData} className="ml-auto px-3 py-1 bg-emerald-600 text-white rounded text-sm">
          Export
        </button>
        <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1 bg-amber-600 text-white rounded text-sm">
          Import
        </button>
      </div>

      {status && <p className="text-sm text-slate-600 mb-3">{status}</p>}

      <p className="text-sm text-slate-600 mb-6">
        Calculate average entry and projected profit/loss for crypto, gold, silver, or any traded asset.
      </p>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Asset Setup</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Asset</label>
              <input
                value={asset}
                onChange={(e) => setAsset(e.target.value.toUpperCase())}
                className="w-full p-2 border rounded"
                placeholder="SOL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quote Currency</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="w-full p-2 border rounded"
                placeholder="USDT"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trading Fee (%) per trade</label>
              <input
                value={feePercent}
                onChange={(e) => setFeePercent(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="0.1"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Buy Positions</label>
            {positions.map((position, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 items-center">
                <input
                  value={position.quantity}
                  onChange={(e) => updatePosition(index, "quantity", e.target.value)}
                  className="sm:col-span-4 p-2 border rounded"
                  placeholder={`Quantity (${asset || "ASSET"})`}
                  inputMode="decimal"
                />
                <input
                  value={position.entryPrice}
                  onChange={(e) => updatePosition(index, "entryPrice", e.target.value)}
                  className="sm:col-span-5 p-2 border rounded"
                  placeholder={`Entry price (${currency || "USD"})`}
                  inputMode="decimal"
                />
                <button
                  onClick={() => removePosition(index)}
                  className="sm:col-span-3 px-3 py-2 bg-red-600 text-white rounded text-sm"
                  disabled={positions.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}

            <button onClick={addPosition} className="mt-1 px-3 py-2 bg-slate-800 text-white rounded text-sm">
              Add position
            </button>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Position Summary</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <span className="text-slate-600">Total Quantity: </span>
              <span className="font-medium">{numberFormatter(totals.totalQty, 6)} {asset || "ASSET"}</span>
            </li>
            <li>
              <span className="text-slate-600">Total Cost: </span>
              <span className="font-medium">{currencyFormatter(totals.totalCost, currency || "USD")}</span>
            </li>
            <li>
              <span className="text-slate-600">Average Entry: </span>
              <span className="font-medium">{numberFormatter(totals.avgEntry, 6)} {currency || "USD"}</span>
            </li>
            <li>
              <span className="text-slate-600">Fee Applied: </span>
              <span className="font-medium">{numberFormatter(Math.max(0, toNumber(feePercent)), 4)}%</span>
            </li>
          </ul>
          <p className="text-xs text-slate-500 mt-3">P/L includes buy-side fee on entries and sell-side fee on exit.</p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Profit Scenarios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={profitStart} onChange={(e) => setProfitStart(e.target.value)} className="p-2 border rounded" placeholder="Start" inputMode="decimal" />
            <input value={profitEnd} onChange={(e) => setProfitEnd(e.target.value)} className="p-2 border rounded" placeholder="End" inputMode="decimal" />
            <input value={profitStep} onChange={(e) => setProfitStep(e.target.value)} className="p-2 border rounded" placeholder="Step" inputMode="decimal" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Example: 130 → 180 with step 5</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Loss Scenarios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={lossStart} onChange={(e) => setLossStart(e.target.value)} className="p-2 border rounded" placeholder="Start" inputMode="decimal" />
            <input value={lossEnd} onChange={(e) => setLossEnd(e.target.value)} className="p-2 border rounded" placeholder="End" inputMode="decimal" />
            <input value={lossStep} onChange={(e) => setLossStep(e.target.value)} className="p-2 border rounded" placeholder="Step" inputMode="decimal" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Example: 120 → 50 with step 5</p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="p-4 border rounded overflow-auto">
          <h3 className="font-semibold mb-3">Profit Table</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Price ({currency || "USD"})</th>
                <th className="py-2 pr-2">P/L ({currency || "USD"})</th>
                <th className="py-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {profitScenarios.map((row) => (
                <tr key={`profit-${row.price}`} className="border-b last:border-0">
                  <td className="py-2 pr-2">{numberFormatter(row.price, 6)}</td>
                  <td className={`py-2 pr-2 ${row.pnl >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {currencyFormatter(row.pnl, currency || "USD")}
                  </td>
                  <td className={`py-2 ${row.roi >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {numberFormatter(row.roi, 2)}%
                  </td>
                </tr>
              ))}
              {!profitScenarios.length && (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-500">Enter valid values to see scenarios.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border rounded overflow-auto">
          <h3 className="font-semibold mb-3">Loss Table</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">Price ({currency || "USD"})</th>
                <th className="py-2 pr-2">P/L ({currency || "USD"})</th>
                <th className="py-2">ROI</th>
              </tr>
            </thead>
            <tbody>
              {lossScenarios.map((row) => (
                <tr key={`loss-${row.price}`} className="border-b last:border-0">
                  <td className="py-2 pr-2">{numberFormatter(row.price, 6)}</td>
                  <td className={`py-2 pr-2 ${row.pnl >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {currencyFormatter(row.pnl, currency || "USD")}
                  </td>
                  <td className={`py-2 ${row.roi >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                    {numberFormatter(row.roi, 2)}%
                  </td>
                </tr>
              ))}
              {!lossScenarios.length && (
                <tr>
                  <td colSpan={3} className="py-3 text-slate-500">Enter valid values to see scenarios.</td>
                </tr>
              )}
            </tbody>
          </table>
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
  return [{ title: "Profit Calculator" }];
}
