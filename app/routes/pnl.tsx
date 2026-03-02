import React from "react";
import { Link } from "react-router";
import type { Route } from "./+types/pnl";

type Position = {
  quantity: string;
  entryPrice: string;
};

type SellPosition = {
  quantity: string;
  sellPrice: string;
};

type Scenario = {
  price: number;
  pnl: number;
  roi: number;
};

function toNumber(value: string) {
  const raw = String(value ?? "").trim().replace(/\s+/g, "");
  if (!raw) return 0;

  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  let normalized = raw;

  if (hasComma && hasDot) {
    const lastComma = raw.lastIndexOf(",");
    const lastDot = raw.lastIndexOf(".");
    if (lastComma > lastDot) {
      normalized = raw.replace(/\./g, "").replace(/,/g, ".");
    } else {
      normalized = raw.replace(/,/g, "");
    }
  } else if (hasComma) {
    if (raw.split(",").length > 2 && /^-?\d{1,3}(,\d{3})+$/.test(raw)) {
      normalized = raw.replace(/,/g, "");
    } else {
      const firstComma = raw.indexOf(",");
      normalized = `${raw.slice(0, firstComma).replace(/,/g, "")}.${raw.slice(firstComma + 1).replace(/,/g, "")}`;
    }
  } else if (hasDot) {
    if (raw.split(".").length > 2 && /^-?\d{1,3}(\.\d{3})+$/.test(raw)) {
      normalized = raw.replace(/\./g, "");
    } else {
      const firstDot = raw.indexOf(".");
      normalized = `${raw.slice(0, firstDot).replace(/\./g, "")}.${raw.slice(firstDot + 1).replace(/\./g, "")}`;
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatInputNumber(value: string, maximumFractionDigits = 8) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = toNumber(raw);
  return new Intl.NumberFormat(undefined, {
    useGrouping: true,
    maximumFractionDigits,
  }).format(parsed);
}

function buildScenarios(
  remainingQty: number,
  remainingCostBasis: number,
  realizedPnl: number,
  roiBaseCost: number,
  sellFeePercent: number,
  start: number,
  end: number,
  step: number
) {
  const rows: Scenario[] = [];
  if (step <= 0) return rows;

  const min = Math.min(start, end);
  const max = Math.max(start, end);
  for (let price = min; price <= max + 1e-9; price += step) {
    const roundedPrice = Math.round(price * 1_000_000) / 1_000_000;
    const grossValue = roundedPrice * remainingQty;
    const sellFee = grossValue * (sellFeePercent / 100);
    const netSellValue = grossValue - sellFee;
    const unrealizedPnl = netSellValue - remainingCostBasis;
    const pnl = realizedPnl + unrealizedPnl;
    const roi = roiBaseCost > 0 ? (pnl / roiBaseCost) * 100 : 0;
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
  const [sellPositions, setSellPositions] = React.useState<SellPosition[]>([]);

  const [profitStart, setProfitStart] = React.useState("130");
  const [profitEnd, setProfitEnd] = React.useState("180");
  const [profitStep, setProfitStep] = React.useState("5");

  const [lossStart, setLossStart] = React.useState("120");
  const [lossEnd, setLossEnd] = React.useState("50");
  const [lossStep, setLossStep] = React.useState("5");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const totals = React.useMemo(() => {
    let totalBuyQty = 0;
    let totalBuyCost = 0;
    const fee = Math.max(0, toNumber(feePercent));
    positions.forEach((position) => {
      const qty = toNumber(position.quantity);
      const entry = toNumber(position.entryPrice);
      if (qty > 0 && entry > 0) {
        totalBuyQty += qty;
        const gross = qty * entry;
        const buyFee = gross * (fee / 100);
        totalBuyCost += gross + buyFee;
      }
    });

    const avgEntry = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;

    let requestedSoldQty = 0;
    let netSellProceeds = 0;
    sellPositions.forEach((position) => {
      const qty = toNumber(position.quantity);
      const sellPrice = toNumber(position.sellPrice);
      if (qty > 0 && sellPrice > 0) {
        requestedSoldQty += qty;
        const gross = qty * sellPrice;
        const sellFee = gross * (fee / 100);
        netSellProceeds += gross - sellFee;
      }
    });

    const soldQty = Math.min(requestedSoldQty, totalBuyQty);
    const realizedCostBasis = soldQty * avgEntry;
    const remainingQty = Math.max(0, totalBuyQty - soldQty);
    const remainingCostBasis = Math.max(0, totalBuyCost - realizedCostBasis);
    const realizedPnl = netSellProceeds - realizedCostBasis;
    const sellFeeMultiplier = 1 - fee / 100;
    const breakEvenSellPrice =
      remainingQty > 0 && sellFeeMultiplier > 0
        ? (remainingCostBasis - realizedPnl) / (remainingQty * sellFeeMultiplier)
        : 0;

    return {
      totalBuyQty,
      totalBuyCost,
      avgEntry,
      requestedSoldQty,
      soldQty,
      remainingQty,
      remainingCostBasis,
      breakEvenSellPrice,
      netSellProceeds,
      realizedPnl,
    };
  }, [positions, sellPositions, feePercent]);

  const profitScenarios = React.useMemo(
    () =>
      buildScenarios(
        totals.remainingQty,
        totals.remainingCostBasis,
        totals.realizedPnl,
        totals.totalBuyCost,
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
        totals.remainingQty,
        totals.remainingCostBasis,
        totals.realizedPnl,
        totals.totalBuyCost,
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

  function updateSellPosition(index: number, field: keyof SellPosition, value: string) {
    setSellPositions((previous) => {
      const copy = previous.slice();
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  function addSellPosition() {
    setSellPositions((previous) => [...previous, { quantity: "", sellPrice: "" }]);
  }

  function removeSellPosition(index: number) {
    setSellPositions((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  }

  function exportData() {
    const payload = {
      asset,
      currency,
      feePercent,
      positions,
      sellPositions,
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
        if (parsed.feePercent !== undefined) setFeePercent(formatInputNumber(String(parsed.feePercent), 8));
        if (Array.isArray(parsed.positions)) {
          const normalized = parsed.positions
            .map((p: any) => ({
              quantity:
                p?.quantity === undefined || p?.quantity === null || String(p?.quantity).trim() === ""
                  ? ""
                  : formatInputNumber(String(p?.quantity), 8),
              entryPrice:
                p?.entryPrice === undefined || p?.entryPrice === null || String(p?.entryPrice).trim() === ""
                  ? ""
                  : formatInputNumber(String(p?.entryPrice), 8),
            }))
            .filter((p: Position) => p.quantity !== "" || p.entryPrice !== "");
          setPositions(normalized.length ? normalized : [{ quantity: "", entryPrice: "" }]);
        }

        if (Array.isArray(parsed.sellPositions)) {
          const normalizedSell = parsed.sellPositions
            .map((p: any) => ({
              quantity:
                p?.quantity === undefined || p?.quantity === null || String(p?.quantity).trim() === ""
                  ? ""
                  : formatInputNumber(String(p?.quantity), 8),
              sellPrice:
                p?.sellPrice === undefined || p?.sellPrice === null || String(p?.sellPrice).trim() === ""
                  ? ""
                  : formatInputNumber(String(p?.sellPrice), 8),
            }))
            .filter((p: SellPosition) => p.quantity !== "" || p.sellPrice !== "");
          setSellPositions(normalizedSell);
        }

        if (parsed.profit && typeof parsed.profit === "object") {
          if (parsed.profit.start !== undefined) setProfitStart(formatInputNumber(String(parsed.profit.start), 8));
          if (parsed.profit.end !== undefined) setProfitEnd(formatInputNumber(String(parsed.profit.end), 8));
          if (parsed.profit.step !== undefined) setProfitStep(formatInputNumber(String(parsed.profit.step), 8));
        }

        if (parsed.loss && typeof parsed.loss === "object") {
          if (parsed.loss.start !== undefined) setLossStart(formatInputNumber(String(parsed.loss.start), 8));
          if (parsed.loss.end !== undefined) setLossEnd(formatInputNumber(String(parsed.loss.end), 8));
          if (parsed.loss.step !== undefined) setLossStep(formatInputNumber(String(parsed.loss.step), 8));
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
            <p className="text-xs text-slate-500 mb-2">You can enter numbers like 1,234.56 or 1.234,56.</p>
            {positions.map((position, index) => (
              <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 items-center">
                <input
                  value={position.quantity}
                  onChange={(e) => updatePosition(index, "quantity", e.target.value)}
                  onBlur={(e) => updatePosition(index, "quantity", formatInputNumber(e.target.value, 8))}
                  className="sm:col-span-4 p-2 border rounded"
                  placeholder={`Quantity (${asset || "ASSET"})`}
                  inputMode="decimal"
                />
                <input
                  value={position.entryPrice}
                  onChange={(e) => updatePosition(index, "entryPrice", e.target.value)}
                  onBlur={(e) => updatePosition(index, "entryPrice", formatInputNumber(e.target.value, 8))}
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
              <span className="font-medium">{numberFormatter(totals.totalBuyQty, 6)} {asset || "ASSET"}</span>
            </li>
            <li>
              <span className="text-slate-600">Total Buy Cost: </span>
              <span className="font-medium">{currencyFormatter(totals.totalBuyCost, currency || "USD")}</span>
            </li>
            <li>
              <span className="text-slate-600">Average Entry: </span>
              <span className="font-medium">{numberFormatter(totals.avgEntry, 6)} {currency || "USD"}</span>
            </li>
            <li>
              <span className="text-slate-600">Sold Quantity: </span>
              <span className="font-medium">{numberFormatter(totals.soldQty, 6)} {asset || "ASSET"}</span>
            </li>
            <li>
              <span className="text-slate-600">Remaining Quantity: </span>
              <span className="font-medium">{numberFormatter(totals.remainingQty, 6)} {asset || "ASSET"}</span>
            </li>
            <li>
              <span className="text-slate-600">Break-even Sell Price: </span>
              <span className="font-medium">{numberFormatter(Math.max(0, totals.breakEvenSellPrice), 6)} {currency || "USD"}</span>
            </li>
            <li>
              <span className="text-slate-600">Realized P/L: </span>
              <span className={`font-medium ${totals.realizedPnl >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {currencyFormatter(totals.realizedPnl, currency || "USD")}
              </span>
            </li>
            <li>
              <span className="text-slate-600">Fee Applied: </span>
              <span className="font-medium">{numberFormatter(Math.max(0, toNumber(feePercent)), 4)}%</span>
            </li>
          </ul>
          {totals.requestedSoldQty > totals.totalBuyQty && (
            <p className="text-xs text-amber-700 mt-2">
              Sold quantity is capped to total bought quantity for calculation.
            </p>
          )}
          <p className="text-xs text-slate-500 mt-3">P/L includes buy-side fee on buys and sell-side fee on each sell trade (past + scenario exit).</p>
        </div>
      </section>

      <section className="mb-8">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Sell Positions (Optional)</h2>
          <p className="text-xs text-slate-500 mb-2">Add historical sells to include realized profit/loss before scenario calculation.</p>
          {sellPositions.map((position, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-2 items-center">
              <input
                value={position.quantity}
                onChange={(e) => updateSellPosition(index, "quantity", e.target.value)}
                onBlur={(e) => updateSellPosition(index, "quantity", formatInputNumber(e.target.value, 8))}
                className="sm:col-span-4 p-2 border rounded"
                placeholder={`Sold quantity (${asset || "ASSET"})`}
                inputMode="decimal"
              />
              <input
                value={position.sellPrice}
                onChange={(e) => updateSellPosition(index, "sellPrice", e.target.value)}
                onBlur={(e) => updateSellPosition(index, "sellPrice", formatInputNumber(e.target.value, 8))}
                className="sm:col-span-5 p-2 border rounded"
                placeholder={`Sell price (${currency || "USD"})`}
                inputMode="decimal"
              />
              <button
                onClick={() => removeSellPosition(index)}
                className="sm:col-span-3 px-3 py-2 bg-red-600 text-white rounded text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          <button onClick={addSellPosition} className="mt-1 px-3 py-2 bg-slate-800 text-white rounded text-sm">
            Add sell position
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Profit Scenarios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={profitStart} onChange={(e) => setProfitStart(e.target.value)} onBlur={(e) => setProfitStart(formatInputNumber(e.target.value, 8))} className="p-2 border rounded" placeholder="Start" inputMode="decimal" />
            <input value={profitEnd} onChange={(e) => setProfitEnd(e.target.value)} onBlur={(e) => setProfitEnd(formatInputNumber(e.target.value, 8))} className="p-2 border rounded" placeholder="End" inputMode="decimal" />
            <input value={profitStep} onChange={(e) => setProfitStep(e.target.value)} onBlur={(e) => setProfitStep(formatInputNumber(e.target.value, 8))} className="p-2 border rounded" placeholder="Step" inputMode="decimal" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Example: 130 → 180 with step 5</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-lg font-semibold mb-3">Loss Scenarios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input value={lossStart} onChange={(e) => setLossStart(e.target.value)} onBlur={(e) => setLossStart(formatInputNumber(e.target.value, 8))} className="p-2 border rounded" placeholder="Start" inputMode="decimal" />
            <input value={lossEnd} onChange={(e) => setLossEnd(e.target.value)} onBlur={(e) => setLossEnd(formatInputNumber(e.target.value, 8))} className="p-2 border rounded" placeholder="End" inputMode="decimal" />
            <input value={lossStep} onChange={(e) => setLossStep(e.target.value)} onBlur={(e) => setLossStep(formatInputNumber(e.target.value, 8))} className="p-2 border rounded" placeholder="Step" inputMode="decimal" />
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
