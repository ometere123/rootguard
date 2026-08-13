import { ExternalLink } from "lucide-react";
import { txUrl } from "@/lib/rootguard";

export type Tx = { hash: string; label: string; status: "SUBMITTED" | "FINALIZED" | "FAILED"; triggered: string[] };
export function TransactionList({ transactions }: { transactions: Tx[] }) {
  if (!transactions.length) return null;
  return <div className="rg-txs"><h3>Transaction activity</h3>{transactions.map((tx) => <div className="tx-row" key={tx.hash}><a href={txUrl(tx.hash)} target="_blank" rel="noreferrer">{tx.label} <ExternalLink size={13}/></a><span className={`badge ${tx.status === "FINALIZED" ? "green" : tx.status === "FAILED" ? "red" : "amber"}`}>{tx.status}</span>{tx.triggered.map((child) => <a key={child} href={txUrl(child)} target="_blank" rel="noreferrer">Triggered upgrade <ExternalLink size={13}/></a>)}</div>)}</div>;
}
