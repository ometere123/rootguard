"use client";

import { useCallback, useEffect, useState } from "react";
import { loadLedger, type Ledger } from "@/lib/rootguard";

const blank: Ledger = { summary: {}, targets: [], proposals: [] };

export function useLiveLedger() {
  const [ledger, setLedger] = useState<Ledger>(blank);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setError(undefined); setLedger(await loadLedger()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to read RootGuard."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { ledger, loading, error, refresh };
}
