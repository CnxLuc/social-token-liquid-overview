import { useState, useMemo, useRef, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  tokens,
  CHAIN_COLORS,
  formatCurrency,
  formatPrice,
  computeTokenScore,
  computePenalty,
  computeFinalScore,
  TOKEN_DIMENSIONS,
  PENALTY_KEYS,
} from "@/lib/data";
import type { Token, TokenScores, Penalties } from "@/lib/data";
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown, Filter, X } from "lucide-react";

/* ── Types ─────────────────────────────────────── */

type SortKey = "name" | "chain" | "marketCap" | "fdv" | "athPrice" | "pctFromAth" | "finalScore" | "activity" | "category";
type SortDir = "asc" | "desc";

interface ColumnFilter {
  column: string;
  values: Set<string>;
}

/* ── Helpers ───────────────────────────────────── */

function dimColor(val: number): string {
  if (val >= 7) return "#059669";
  if (val >= 4) return "#D97706";
  return "#DC2626";
}

function scoreColor(score: number) {
  if (score >= 70) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

function getFinalScore(t: Token) {
  return computeFinalScore(computeTokenScore(t.scores), t.penalties);
}

/* ── Filter Dropdown ──────────────────────────── */

function FilterDropdown({
  column,
  allValues,
  activeFilter,
  onApply,
  onClear,
}: {
  column: string;
  allValues: string[];
  activeFilter: Set<string> | null;
  onApply: (column: string, values: Set<string>) => void;
  onClear: (column: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(activeFilter ?? new Set(allValues));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    setSelected(activeFilter ?? new Set(allValues));
  }, [activeFilter, allValues]);

  const isFiltered = activeFilter != null && activeFilter.size < allValues.length;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`ml-1 p-0.5 rounded hover:bg-muted/80 transition-colors ${isFiltered ? "text-primary" : "text-muted-foreground/50"}`}
        data-testid={`filter-${column}`}
      >
        <Filter className="h-3 w-3" />
      </button>
      {open && (
        <div
          className="absolute z-50 top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-lg p-2 min-w-[140px] max-h-[240px] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-medium text-muted-foreground uppercase">Filter</span>
            {isFiltered && (
              <button
                className="text-[10px] text-primary hover:underline"
                onClick={() => { onClear(column); setOpen(false); }}
              >
                Clear
              </button>
            )}
          </div>
          <label className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer hover:bg-muted/50 rounded px-1">
            <input
              type="checkbox"
              checked={selected.size === allValues.length}
              onChange={() => {
                if (selected.size === allValues.length) setSelected(new Set());
                else setSelected(new Set(allValues));
              }}
              className="h-3 w-3 rounded"
            />
            <span className="font-medium">(All)</span>
          </label>
          {allValues.map((v) => (
            <label key={v} className="flex items-center gap-1.5 text-xs py-0.5 cursor-pointer hover:bg-muted/50 rounded px-1">
              <input
                type="checkbox"
                checked={selected.has(v)}
                onChange={() => {
                  const next = new Set(selected);
                  if (next.has(v)) next.delete(v);
                  else next.add(v);
                  setSelected(next);
                }}
                className="h-3 w-3 rounded"
              />
              <span>{v}</span>
            </label>
          ))}
          <button
            className="mt-1.5 w-full text-[10px] bg-primary text-primary-foreground rounded px-2 py-1 font-medium hover:bg-primary/90"
            onClick={() => { onApply(column, selected); setOpen(false); }}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Sortable Header ─────────────────────────── */

function SortableHead({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  className,
  filterNode,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
  filterNode?: React.ReactNode;
}) {
  const active = currentSort === sortKey;
  return (
    <TableHead
      className={`cursor-pointer select-none group ${className || ""}`}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-0.5">
        <span className={active ? "text-foreground font-semibold" : ""}>{label}</span>
        <div className="flex flex-col -space-y-0.5">
          {active ? (
            currentDir === "asc" ? (
              <ArrowUp className="h-3 w-3 text-foreground" />
            ) : (
              <ArrowDown className="h-3 w-3 text-foreground" />
            )
          ) : (
            <ArrowDown className="h-3 w-3 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
        {filterNode}
      </div>
    </TableHead>
  );
}

/* ── Score Breakdown ─────────────────────────── */

function ScoreBreakdown({ scores, penalties }: { scores: TokenScores; penalties: Penalties }) {
  const raw = computeTokenScore(scores);
  const pen = computePenalty(penalties);
  const final = Math.max(0, raw + pen);

  return (
    <div className="space-y-3" data-testid="score-breakdown">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5">
        {TOKEN_DIMENSIONS.map((dim) => {
          const val = scores[dim.key];
          return (
            <div key={dim.key} className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground w-24 shrink-0">{dim.label}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-sm"
                    style={{
                      backgroundColor: i <= val ? dimColor(val) : "hsl(220 14% 90%)",
                    }}
                  />
                ))}
              </div>
              <span className="font-mono text-[11px]" style={{ color: dimColor(val) }}>
                {val}/10
              </span>
            </div>
          );
        })}
      </div>

      {pen < 0 && (
        <div className="flex flex-wrap gap-1.5">
          {PENALTY_KEYS.map((p) => {
            const val = penalties[p.key];
            if (val === 0) return null;
            return (
              <Badge key={p.key} className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                {p.label}: {val}
              </Badge>
            );
          })}
        </div>
      )}

      <p className="text-xs font-mono text-muted-foreground">
        Raw {raw} | Penalties {pen} | Final{" "}
        <span className="font-bold" style={{ color: scoreColor(final) }}>{final}</span>
      </p>
    </div>
  );
}

/* ── Token Row ───────────────────────────────── */

function TokenRow({
  token,
  expanded,
  onToggle,
}: {
  token: Token;
  expanded: boolean;
  onToggle: () => void;
}) {
  const final = getFinalScore(token);
  return (
    <>
      <TableRow
        className="cursor-pointer"
        onClick={onToggle}
        data-testid={`token-row-${token.id}`}
      >
        <TableCell className="w-8 px-2">
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div>
              <span className="font-medium text-sm">{token.name}</span>
              <span className="text-muted-foreground text-xs ml-1.5">${token.ticker}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 font-mono"
            style={{ borderColor: CHAIN_COLORS[token.chain], color: CHAIN_COLORS[token.chain] }}
          >
            {token.chain}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-mono text-sm">{formatCurrency(token.marketCap)}</TableCell>
        <TableCell className="text-right font-mono text-sm">{formatCurrency(token.fdv)}</TableCell>
        <TableCell className="text-right font-mono text-sm hidden md:table-cell" data-testid={`token-ath-${token.id}`}>
          {formatPrice(token.athPrice)}
        </TableCell>
        <TableCell className="text-right font-mono text-sm hidden md:table-cell" data-testid={`token-pct-ath-${token.id}`}>
          {token.pctFromAth != null ? (
            <span className="text-red-600">{token.pctFromAth}%</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${final}%`,
                  backgroundColor: scoreColor(final),
                }}
              />
            </div>
            <span className="text-xs font-mono" style={{ color: scoreColor(final) }}>
              {final}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <span
            className={`text-xs font-medium ${
              token.activity === "Active"
                ? "text-emerald-600"
                : token.activity === "Declining"
                  ? "text-red-600"
                  : "text-muted-foreground"
            }`}
          >
            {token.activity}
          </span>
        </TableCell>
        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
          {token.category}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={10} className="bg-muted/30 px-6 py-4">
            <div className="space-y-3">
              <ScoreBreakdown scores={token.scores} penalties={token.penalties} />
              <p className="text-sm text-muted-foreground">{token.description}</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Team: </span>
                  <span>{token.teamStatus}</span>
                </div>
                {token.pctFromAth != null && (
                  <div>
                    <span className="text-muted-foreground">From ATH: </span>
                    <span className="text-red-600">{token.pctFromAth}%</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Circulating: </span>
                  <span>{token.circulatingPct}%</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {token.catalysts.map((c) => (
                  <Badge key={c} className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                    {c}
                  </Badge>
                ))}
                {token.risks.map((r) => (
                  <Badge key={r} className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/* ── Main Overview ───────────────────────────── */

export default function Overview() {
  const [sortKey, setSortKey] = useState<SortKey>("finalScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Map<string, Set<string>>>(new Map());

  // Unique values for filterable columns
  const chainValues = useMemo(() => [...new Set(tokens.map((t) => t.chain))].sort(), []);
  const activityValues = useMemo(() => [...new Set(tokens.map((t) => t.activity))].sort(), []);
  const categoryValues = useMemo(() => [...new Set(tokens.map((t) => t.category))].sort(), []);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      // Default direction per column type
      setSortDir(
        key === "name" || key === "chain" || key === "activity" || key === "category" ? "asc" : "desc"
      );
    }
  }

  function handleFilterApply(column: string, values: Set<string>) {
    const next = new Map(filters);
    // Get all values for this column to check if filter is effectively "all"
    let allVals: string[] = [];
    if (column === "chain") allVals = chainValues;
    else if (column === "activity") allVals = activityValues;
    else if (column === "category") allVals = categoryValues;

    if (values.size === allVals.length || values.size === 0) {
      next.delete(column);
    } else {
      next.set(column, values);
    }
    setFilters(next);
  }

  function handleFilterClear(column: string) {
    const next = new Map(filters);
    next.delete(column);
    setFilters(next);
  }

  const scatterData = useMemo(() => {
    return tokens.map((t) => ({
      name: t.name,
      ticker: t.ticker,
      fdv: t.fdv,
      score: getFinalScore(t),
      marketCap: t.marketCap,
      chain: t.chain,
      fill: CHAIN_COLORS[t.chain],
    }));
  }, []);

  const processed = useMemo(() => {
    let result = [...tokens];

    // Apply filters
    const chainFilter = filters.get("chain");
    if (chainFilter) result = result.filter((t) => chainFilter.has(t.chain));
    const activityFilter = filters.get("activity");
    if (activityFilter) result = result.filter((t) => activityFilter.has(t.activity));
    const categoryFilter = filters.get("category");
    if (categoryFilter) result = result.filter((t) => categoryFilter.has(t.category));

    // Sort
    const dir = sortDir === "asc" ? 1 : -1;
    result.sort((a, b) => {
      switch (sortKey) {
        case "name": return dir * a.name.localeCompare(b.name);
        case "chain": return dir * a.chain.localeCompare(b.chain);
        case "marketCap": return dir * (a.marketCap - b.marketCap);
        case "fdv": return dir * (a.fdv - b.fdv);
        case "athPrice": return dir * ((a.athPrice ?? 0) - (b.athPrice ?? 0));
        case "pctFromAth": return dir * ((a.pctFromAth ?? -100) - (b.pctFromAth ?? -100));
        case "finalScore": return dir * (getFinalScore(a) - getFinalScore(b));
        case "activity": return dir * a.activity.localeCompare(b.activity);
        case "category": return dir * a.category.localeCompare(b.category);
        default: return 0;
      }
    });

    return result;
  }, [sortKey, sortDir, filters]);

  const activeFilterCount = filters.size;

  return (
    <div className="space-y-6 min-w-0 overflow-hidden" data-testid="overview-page">
      {/* Scatter Plot */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">FDV vs Final Score</CardTitle>
          <p className="text-xs text-muted-foreground">
            Top-left quadrant = high conviction, low valuation. Size = market cap.
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]" data-testid="scatter-plot">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 85%)" />
                <XAxis
                  type="number"
                  dataKey="fdv"
                  name="FDV"
                  scale="log"
                  domain={[2000000, 3000000000]}
                  ticks={[3000000, 10000000, 30000000, 100000000, 300000000, 1000000000, 2500000000]}
                  tickFormatter={(v: number) => formatCurrency(v)}
                  tick={{ fill: "hsl(220 10% 40%)", fontSize: 11 }}
                  label={{ value: "FDV (log)", position: "bottom", offset: 10, fill: "hsl(220 10% 40%)", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="score"
                  name="Score"
                  domain={[0, 100]}
                  tick={{ fill: "hsl(220 10% 40%)", fontSize: 11 }}
                  label={{ value: "Final Score", angle: -90, position: "insideLeft", offset: -5, fill: "hsl(220 10% 40%)", fontSize: 11 }}
                />
                <ZAxis
                  type="number"
                  dataKey="marketCap"
                  range={[40, 400]}
                />
                <RechartsTooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded border border-border bg-popover p-2 text-xs shadow-lg">
                        <p className="font-semibold">{d.name} ({d.ticker})</p>
                        <p>FDV: {formatCurrency(d.fdv)}</p>
                        <p>Final Score: {d.score}</p>
                        <p>MCap: {formatCurrency(d.marketCap)}</p>
                        <p style={{ color: CHAIN_COLORS[d.chain] }}>{d.chain}</p>
                      </div>
                    );
                  }}
                />
                {(["Solana", "Base", "Ethereum"] as const).map((chain) => (
                  <Scatter
                    key={chain}
                    name={chain}
                    data={scatterData.filter((d) => d.chain === chain)}
                    fill={CHAIN_COLORS[chain]}
                    fillOpacity={0.8}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2">
            {(["Solana", "Base", "Ethereum"] as const).map((chain) => (
              <div key={chain} className="flex items-center gap-1.5 text-xs">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHAIN_COLORS[chain] }} />
                <span className="text-muted-foreground">{chain}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Table */}
      <div className="space-y-2" data-testid="tokens-section">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {processed.length} of {tokens.length} tokens
          </span>
          {activeFilterCount > 0 && (
            <button
              className="flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={() => setFilters(new Map())}
            >
              <X className="h-3 w-3" />
              Clear all filters
            </button>
          )}
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8"></TableHead>
                  <SortableHead
                    label="Name"
                    sortKey="name"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Chain"
                    sortKey="chain"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                    filterNode={
                      <FilterDropdown
                        column="chain"
                        allValues={chainValues}
                        activeFilter={filters.get("chain") ?? null}
                        onApply={handleFilterApply}
                        onClear={handleFilterClear}
                      />
                    }
                  />
                  <SortableHead
                    label="Market Cap"
                    sortKey="marketCap"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                    className="text-right"
                  />
                  <SortableHead
                    label="FDV"
                    sortKey="fdv"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                    className="text-right"
                  />
                  <SortableHead
                    label="ATH"
                    sortKey="athPrice"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                    className="text-right hidden md:table-cell"
                  />
                  <SortableHead
                    label="% ATH"
                    sortKey="pctFromAth"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                    className="text-right hidden md:table-cell"
                  />
                  <SortableHead
                    label="Score"
                    sortKey="finalScore"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Activity"
                    sortKey="activity"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                    filterNode={
                      <FilterDropdown
                        column="activity"
                        allValues={activityValues}
                        activeFilter={filters.get("activity") ?? null}
                        onApply={handleFilterApply}
                        onClear={handleFilterClear}
                      />
                    }
                  />
                  <SortableHead
                    label="Category"
                    sortKey="category"
                    currentSort={sortKey}
                    currentDir={sortDir}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                    filterNode={
                      <FilterDropdown
                        column="category"
                        allValues={categoryValues}
                        activeFilter={filters.get("category") ?? null}
                        onApply={handleFilterApply}
                        onClear={handleFilterClear}
                      />
                    }
                  />
                </TableRow>
              </TableHeader>
              <TableBody>
                {processed.map((token) => (
                  <TokenRow
                    key={token.id}
                    token={token}
                    expanded={expandedId === token.id}
                    onToggle={() => setExpandedId(expandedId === token.id ? null : token.id)}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
