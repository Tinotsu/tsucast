"use client";

import { Ticket, Clock } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import Link from "next/link";

interface CreditBalanceProps {
  showBuyButton?: boolean;
  compact?: boolean;
}

/**
 * Displays user's credit balance
 * Can be used in headers, sidebars, or inline
 */
export function CreditBalance({ showBuyButton = true, compact = false }: CreditBalanceProps) {
  const { credits, timeBank, isLoading } = useCredits();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <div className="h-5 w-20 rounded bg-zinc-800" />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Ticket className="h-4 w-4 text-amber-500" />
        <span className="font-medium text-white">{credits}</span>
        {showBuyButton && credits === 0 && (
          <Link
            href="/upgrade"
            className="text-xs text-amber-500 hover:text-amber-400"
          >
            Buy
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Ticket className="h-5 w-5 text-amber-500" />
        <span className="font-semibold text-white">{credits} credits</span>
      </div>

      {timeBank > 0 && (
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <Clock className="h-4 w-4" />
          <span>+{timeBank} min banked</span>
        </div>
      )}

      {showBuyButton && (
        <Link
          href="/upgrade"
          className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-sm font-medium text-amber-500 hover:bg-amber-500/20"
        >
          {credits === 0 ? "Buy Credits" : "Get More"}
        </Link>
      )}
    </div>
  );
}
