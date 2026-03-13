import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { killedTokens, killedNfts, CHAIN_COLORS, formatCurrency } from "@/lib/data";
import { Skull } from "lucide-react";

export default function KilledPage() {
  const allKilled = [
    ...killedTokens.map((t) => ({
      id: t.id,
      name: t.name,
      ticker: t.ticker,
      type: "Token" as const,
      chain: t.chain,
      valuation: t.fdv ?? t.marketCap,
      reason: t.killGateReason,
      category: t.category,
    })),
    ...killedNfts.map((n) => ({
      id: n.id,
      name: n.name,
      ticker: null,
      type: "NFT" as const,
      chain: n.chain,
      valuation: n.marketCap,
      reason: n.killGateReason,
      category: n.category,
    })),
  ];

  return (
    <div className="space-y-4" data-testid="killed-page">
      <div className="flex items-center gap-2">
        <Skull className="h-4 w-4 text-red-600" />
        <span className="text-xs text-muted-foreground">
          {allKilled.length} assets failed the Kill Gate
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {allKilled.map((item) => (
          <Card
            key={item.id}
            className="border-border/50 bg-muted/20"
            data-testid={`killed-card-${item.id}`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{item.name}</span>
                    {item.ticker && (
                      <span className="text-xs text-muted-foreground">${item.ticker}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 font-mono"
                      style={{ borderColor: CHAIN_COLORS[item.chain], color: CHAIN_COLORS[item.chain] }}
                    >
                      {item.chain}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        item.type === "Token" ? "text-blue-400 border-blue-400/30" : "text-purple-400 border-purple-400/30"
                      }`}
                    >
                      {item.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-[10px] px-1.5">{item.category}</Badge>
                  <p className="text-xs font-mono text-muted-foreground mt-1">{formatCurrency(item.valuation)}</p>
                </div>
              </div>

              <div className="rounded bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-xs text-red-700">{item.reason}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
