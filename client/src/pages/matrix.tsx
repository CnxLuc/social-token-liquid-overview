import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  tokens,
  nfts,
  CHAIN_COLORS,
  formatCurrency,
  formatPrice,
  computeTokenScore,
  computeNFTScore,
  computePenalty,
  computeFinalScore,
  TOKEN_DIMENSIONS,
  NFT_DIMENSIONS,
} from "@/lib/data";
import type { TokenScores, NFTScores, Penalties } from "@/lib/data";
import { ArrowUpDown } from "lucide-react";

type SortKey = "name" | "type" | "chain" | "valuation" | "finalScore" | "athPrice" | "pctFromAth" | "penalty" | "activity" | "risks" | "catalysts";
type SortDir = "asc" | "desc";

interface MatrixRow {
  id: string;
  name: string;
  type: "Token" | "NFT";
  chain: string;
  valuation: number | null;
  rawScore: number;
  penalty: number;
  finalScore: number;
  dimValues: number[];
  dimLabels: string[];
  athPrice: number | null;
  pctFromAth: number | null;
  activity: string;
  riskCount: number;
  catalystCount: number;
}

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

export default function Matrix() {
  const [sortKey, setSortKey] = useState<SortKey>("finalScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo<MatrixRow[]>(() => {
    const tokenRows: MatrixRow[] = tokens.map((t) => {
      const raw = computeTokenScore(t.scores);
      const pen = computePenalty(t.penalties);
      return {
        id: t.id,
        name: `${t.name} (${t.ticker})`,
        type: "Token",
        chain: t.chain,
        valuation: t.fdv,
        rawScore: raw,
        penalty: pen,
        finalScore: Math.max(0, raw + pen),
        dimValues: TOKEN_DIMENSIONS.map((d) => t.scores[d.key]),
        dimLabels: TOKEN_DIMENSIONS.map((d) => d.shortLabel),
        athPrice: t.athPrice,
        pctFromAth: t.pctFromAth,
        activity: t.activity,
        riskCount: t.risks.length,
        catalystCount: t.catalysts.length,
      };
    });
    const nftRows: MatrixRow[] = nfts.map((n) => {
      const raw = computeNFTScore(n.scores);
      const pen = computePenalty(n.penalties);
      return {
        id: n.id,
        name: n.name,
        type: "NFT",
        chain: n.chain,
        valuation: n.marketCap,
        rawScore: raw,
        penalty: pen,
        finalScore: Math.max(0, raw + pen),
        dimValues: NFT_DIMENSIONS.map((d) => n.scores[d.key]),
        dimLabels: NFT_DIMENSIONS.map((d) => d.shortLabel),
        athPrice: n.athFloorEth ?? n.athFloorSol ?? null,
        pctFromAth: n.pctFromAthFloor,
        activity: n.activity,
        riskCount: n.risks.length,
        catalystCount: n.catalysts.length,
      };
    });
    return [...tokenRows, ...nftRows];
  }, []);

  const sorted = useMemo(() => {
    const result = [...rows];
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "type": cmp = a.type.localeCompare(b.type); break;
        case "chain": cmp = a.chain.localeCompare(b.chain); break;
        case "valuation": cmp = (a.valuation ?? 0) - (b.valuation ?? 0); break;
        case "finalScore": cmp = a.finalScore - b.finalScore; break;
        case "athPrice": cmp = (a.athPrice ?? 0) - (b.athPrice ?? 0); break;
        case "pctFromAth": cmp = (a.pctFromAth ?? 0) - (b.pctFromAth ?? 0); break;
        case "penalty": cmp = a.penalty - b.penalty; break;
        case "activity": cmp = a.activity.localeCompare(b.activity); break;
        case "risks": cmp = a.riskCount - b.riskCount; break;
        case "catalysts": cmp = a.catalystCount - b.catalystCount; break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortHeader({ label, keyName, className }: { label: string; keyName: SortKey; className?: string }) {
    return (
      <TableHead
        className={`cursor-pointer select-none hover:text-foreground transition-colors ${className ?? ""}`}
        onClick={() => handleSort(keyName)}
        data-testid={`sort-${keyName}`}
      >
        <div className="flex items-center gap-1">
          {label}
          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
        </div>
      </TableHead>
    );
  }

  // Use token dimension labels for column headers (NFTs show their own labels per-row)
  const dimHeaders = TOKEN_DIMENSIONS.map((d) => d.shortLabel);

  return (
    <div className="space-y-4" data-testid="matrix-page">
      <p className="text-xs text-muted-foreground">{sorted.length} candidates</p>

      <Card className="border-border/50 overflow-x-auto">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortHeader label="Name" keyName="name" />
                <SortHeader label="Type" keyName="type" />
                <SortHeader label="Chain" keyName="chain" />
                <SortHeader label="Valuation" keyName="valuation" />
                <SortHeader label="ATH" keyName="athPrice" />
                <SortHeader label="% ATH" keyName="pctFromAth" />
                <SortHeader label="Final" keyName="finalScore" />
                {dimHeaders.map((label) => (
                  <TableHead key={label} className="text-center px-1.5 text-[10px]">
                    {label}
                  </TableHead>
                ))}
                <SortHeader label="Pen." keyName="penalty" />
                <SortHeader label="Activity" keyName="activity" />
                <SortHeader label="Risks" keyName="risks" />
                <SortHeader label="Cat." keyName="catalysts" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((row) => (
                <TableRow key={`${row.type}-${row.id}`} data-testid={`matrix-row-${row.id}`}>
                  <TableCell className="font-medium text-sm max-w-[160px] truncate">
                    {row.name}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        row.type === "Token" ? "text-blue-400 border-blue-400/30" : "text-purple-400 border-purple-400/30"
                      }`}
                    >
                      {row.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-mono" style={{ color: CHAIN_COLORS[row.chain] }}>
                      {row.chain}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.valuation)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm" data-testid={`matrix-ath-${row.id}`}>
                    {row.type === "Token"
                      ? formatPrice(row.athPrice)
                      : row.athPrice != null
                        ? `${row.athPrice} ${row.chain === "Solana" ? "SOL" : "ETH"}`
                        : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm" data-testid={`matrix-pct-ath-${row.id}`}>
                    {row.pctFromAth != null ? (
                      <span className="text-red-600">{row.pctFromAth}%</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${row.finalScore}%`,
                            backgroundColor: scoreColor(row.finalScore),
                          }}
                        />
                      </div>
                      <span className="text-xs font-mono" style={{ color: scoreColor(row.finalScore) }}>
                        {row.finalScore}
                      </span>
                    </div>
                  </TableCell>
                  {row.dimValues.map((val, idx) => (
                    <TableCell key={idx} className="text-center px-1.5">
                      <span
                        className="text-xs font-mono font-bold"
                        style={{ color: dimColor(val) }}
                        data-testid={`matrix-dim-${row.id}-${row.dimLabels[idx]}`}
                      >
                        {val}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-mono text-xs text-red-600">
                    {row.penalty}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium ${
                        row.activity === "Active"
                          ? "text-emerald-600"
                          : row.activity === "Declining"
                            ? "text-red-600"
                            : "text-muted-foreground"
                      }`}
                    >
                      {row.activity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-red-600">
                    {row.riskCount}
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs text-emerald-600">
                    {row.catalystCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
