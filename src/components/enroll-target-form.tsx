"use client";

import { useState } from "react";
import { useWalletAction } from "@/components/wallet-action";
import { TransactionList } from "@/components/transaction-list";

const charter = "Only approve upgrades that preserve the declared storage layout, keep RootGuard as the sole upgrade authority, retain public reads, avoid value movement, and expose the stated version truthfully.";
export function EnrollTargetForm({ onFinalized }: { onFinalized: () => Promise<void> }) {
  const [form, setForm] = useState({ id: "", name: "", target: "", source: "", charter });
  const { error, transactions, send } = useWalletAction(onFinalized);
  return <section className="form-shell"><div><p className="eyebrow">SECURE ENROLLMENT</p><h2>Enroll protected target</h2><p>Enrollment is sent to the protected target contract first. Only the target owner can initiate it. RootGuard rejects direct wallet registration.</p></div>{error && <p className="form-error">{error}</p>}<form className="rg-form" onSubmit={(event) => { event.preventDefault(); void send("Target enrollment", "enroll_with_rootguard", [form.id, form.name, form.charter, form.source], form.target as `0x${string}`); }}><label>Target ID<input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="counter-main"/></label><label>Target name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="RootGuard Counter"/></label><label>Protected target address<input required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} placeholder="0x..."/></label><label>Commit-pinned current source URL<input required type="url" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="https://raw.githubusercontent.com/.../commit/..."/></label><label className="wide">Safety charter<textarea required value={form.charter} onChange={(e) => setForm({ ...form, charter: e.target.value })}/></label><button>Request secure enrollment</button></form><TransactionList transactions={transactions}/></section>;
}
