"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet-provider";
import { CONTRACT_ADDRESS, waitFinalized, writeContract, writeRootGuard } from "@/lib/rootguard";
import type { CalldataEncodable } from "genlayer-js/types";
import type { Tx } from "@/components/transaction-list";

export function useWalletAction(onFinalized?: () => Promise<void> | void) {
  const [error, setError] = useState<string>();
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const { address: wallet, connect } = useWallet();
  async function send(label: string, functionName: string, args: CalldataEncodable[], address?: `0x${string}`) {
    try {
      setError(undefined);
      const account = wallet ?? await connect();
      const destination = address ?? CONTRACT_ADDRESS;
      if (!destination) throw new Error("RootGuard contract not configured.");
      const hash = address ? await writeContract(address, account, functionName, args) : await writeRootGuard(account, functionName, args);
      setTransactions((items) => [{ hash, label, status: "SUBMITTED", triggered: [] }, ...items]);
      const result = await waitFinalized(account, hash);
      setTransactions((items) => items.map((item) => item.hash === hash ? { ...item, status: "FINALIZED", triggered: result.triggered } : item));
      await onFinalized?.();
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "Transaction failed.";
      setError(detail);
      setTransactions((items) => items.map((item) => item.status === "SUBMITTED" ? { ...item, status: "FAILED" } : item));
    }
  }
  return { wallet, error, transactions, send };
}
