import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  nfts,
  CHAIN_COLORS,
  formatCurrency,
  computeNFTScore,
  computePenalty,
  computeFinalScore,
  NFT_DIMENSIONS,
  PENALTY_KEYS,
} from "@/lib/data";
import { TrendingUp, TrendingDown } from "lucide-react";

type SortKey = "finalScore" | "change30d" | "floorUsd" | "marketCap";

function scoreColor(score: number) {
  if (score >= 70) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

function dimColor(val: number): string {
  if (val >= 7) return "#059669";
  if (val >= 4) return "#D97706";
  return "#DC2626";
}

export default function NFTs() {
  const [sortBy, setSortBy] = useState<SortKey>("finalScore");

  const sorted = useMemo(() => {
    const result = [...nfts];
    result.sort((a, b) => {
      if (sortBy === "finalScore")
        return computeFinalScore(computeNFTScore(b.scores), b.penalties) - computeFinalScore(computeNFTScore(a.scores), a.penalties);
      if (sortBy === "change30d") return (b.change30d ?? -999) - (a.change30d ?? -999);
      if (sortBy === "floorUsd") return (b.floorUsd ?? 0) - (a.floorUsd ?? 0);
      return (b.marketCap ?? 0) - (a.marketCap ?? 0);
    });
    return result;
  }, [sortBy]);

  return (
    <div className="space-y-4" data-testid="nfts-page">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{nfts.length} collections</span>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
          <SelectTrigger className="w-[180px]" data-testid="nft-sort">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="finalScore">By Final Score</SelectItem>
            <SelectItem value="change30d">By 30d Change</SelectItem>
            <SelectItem value="floorUsd">By Floor Price</SelectItem>
            <SelectItem value="marketCap">By Market Cap</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((nft) => {
          const raw = computeNFTScore(nft.scores);
          const pen = computePenalty(nft.penalties);
          const final = computeFinalScore(raw, nft.penalties);
          return (
            <Card
              key={nft.id}
              className="border-border/50 transition-colors hover:border-primary/30"
              data-testid={`nft-card-${nft.id}`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-sm">{nft.name}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 font-mono mt-1 ml-2"
                      style={{ borderColor: CHAIN_COLORS[nft.chain], color: CHAIN_COLORS[nft.chain] }}
                    >
                      {nft.chain}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {nft.category}
                  </Badge>
                </div>

                {/* Price row */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Floor</p>
                    <p className="text-lg font-bold font-mono">
                      {nft.floorEth != null
                        ? `${nft.floorEth} ETH`
                        : nft.floorSol != null
                          ? `${nft.floorSol} SOL`
                          : "N/A"}
                    </p>
                    {nft.floorUsd != null && (
                      <p className="text-xs text-muted-foreground font-mono">
                        ${new Intl.NumberFormat("en-US").format(nft.floorUsd)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase">MCap</p>
                    <p className="text-sm font-mono">{formatCurrency(nft.marketCap)}</p>
                  </div>
                </div>

                {/* ATH row */}
                <div className="flex items-center gap-3 text-xs" data-testid={`nft-ath-${nft.id}`}>
                  {(nft.athFloorEth != null || nft.athFloorSol != null) && (
                    <div>
                      <span className="text-muted-foreground">ATH Floor: </span>
                      <span className="font-mono">
                        {nft.athFloorEth != null
                          ? `${nft.athFloorEth} ETH`
                          : `${nft.athFloorSol} SOL`}
                      </span>
                    </div>
                  )}
                  {nft.pctFromAthFloor != null && (
                    <div>
                      <span className="text-muted-foreground">% ATH: </span>
                      <span className="font-mono text-red-600">{nft.pctFromAthFloor}%</span>
                    </div>
                  )}
                </div>

                {/* 30d change */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {nft.change30d != null ? (
                      <>
                        {nft.change30d > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                        )}
                        <span
                          className={`text-sm font-bold font-mono ${
                            nft.change30d > 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {nft.change30d > 0 ? "+" : ""}
                          {nft.change30d}%
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-1">30d</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">No 30d data</span>
                    )}
                  </div>
                </div>

                {/* Dimension breakdown */}
                <div className="space-y-1">
                  {NFT_DIMENSIONS.map((dim) => {
                    const val = nft.scores[dim.key];
                    return (
                      <div key={dim.key} className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-muted-foreground w-20 shrink-0 truncate">{dim.label}</span>
                        <div className="flex gap-px flex-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                            <div
                              key={i}
                              className="h-1.5 flex-1 rounded-sm"
                              style={{
                                backgroundColor: i <= val ? dimColor(val) : "hsl(220 14% 90%)",
                              }}
                            />
                          ))}
                        </div>
                        <span className="font-mono w-6 text-right" style={{ color: dimColor(val) }}>
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Penalties */}
                {pen < 0 && (
                  <div className="flex flex-wrap gap-1">
                    {PENALTY_KEYS.map((p) => {
                      const val = nft.penalties[p.key];
                      if (val === 0) return null;
                      return (
                        <Badge key={p.key} className="bg-red-50 text-red-700 border-red-200 text-[9px] px-1 py-0">
                          {p.label}: {val}
                        </Badge>
                      );
                    })}
                  </div>
                )}

                {/* Score bar */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Final Score</span>
                    <span className="text-xs font-mono text-muted-foreground">
                      Raw {raw} | Pen {pen} |{" "}
                      <span className="font-bold" style={{ color: scoreColor(final) }}>{final}</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${final}%`,
                        backgroundColor: scoreColor(final),
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
