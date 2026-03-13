import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ChevronDown, ChevronRight } from "lucide-react";

type SortKey = "finalScore" | "fdv" | "marketCap";

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

function ScoreBreakdown({ scores, penalties }: { scores: TokenScores; penalties: Penalties }) {
  const raw = computeTokenScore(scores);
  const pen = computePenalty(penalties);
  const final = Math.max(0, raw + pen);

  return (
    <div className="space-y-3" data-testid="score-breakdown">
      {/* Dimension bars */}
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

      {/* Penalties */}
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

      {/* Final score summary */}
      <p className="text-xs font-mono text-muted-foreground">
        Raw {raw} | Penalties {pen} | Final{" "}
        <span className="font-bold" style={{ color: scoreColor(final) }}>{final}</span>
      </p>
    </div>
  );
}

export default function Tokens() {
  const [chainFilter, setChainFilter] = useState<string>("All");
  const [activityFilter, setActivityFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortKey>("finalScore");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = [...tokens];
    if (chainFilter !== "All") result = result.filter((t) => t.chain === chainFilter);
    if (activityFilter === "Active") result = result.filter((t) => t.activity === "Active");
    if (activityFilter === "Declining") result = result.filter((t) => t.activity === "Declining");
    result.sort((a, b) => {
      if (sortBy === "finalScore")
        return computeFinalScore(computeTokenScore(b.scores), b.penalties) - computeFinalScore(computeTokenScore(a.scores), a.penalties);
      if (sortBy === "fdv") return a.fdv - b.fdv;
      return b.marketCap - a.marketCap;
    });
    return result;
  }, [chainFilter, activityFilter, sortBy]);

  return (
    <div className="space-y-4" data-testid="tokens-page">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={chainFilter} onValueChange={setChainFilter}>
          <SelectTrigger className="w-[140px]" data-testid="chain-filter">
            <SelectValue placeholder="Chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Chains</SelectItem>
            <SelectItem value="Solana">Solana</SelectItem>
            <SelectItem value="Base">Base</SelectItem>
            <SelectItem value="Ethereum">Ethereum</SelectItem>
          </SelectContent>
        </Select>

        <Select value={activityFilter} onValueChange={setActivityFilter}>
          <SelectTrigger className="w-[140px]" data-testid="activity-filter">
            <SelectValue placeholder="Activity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Activity</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Declining">Declining</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[160px]" data-testid="sort-by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="finalScore">Final Score</SelectItem>
            <SelectItem value="fdv">FDV (Low→High)</SelectItem>
            <SelectItem value="marketCap">Market Cap</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} tokens
        </span>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-8"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Chain</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">FDV</TableHead>
                <TableHead className="text-right hidden md:table-cell">ATH</TableHead>
                <TableHead className="text-right hidden md:table-cell">% ATH</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="hidden lg:table-cell">Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((token) => (
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
  );
}

function TokenRow({
  token,
  expanded,
  onToggle,
}: {
  token: Token;
  expanded: boolean;
  onToggle: () => void;
}) {
  const raw = computeTokenScore(token.scores);
  const final = computeFinalScore(raw, token.penalties);
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
