"use client";

import { useState } from "react";
import type { Target } from "@/lib/rootguard";
import { useWalletAction } from "@/components/wallet-action";
import { TransactionList } from "@/components/transaction-list";

export function SubmitProposalForm({ targets, onFinalized }: { targets: Target[]; onFinalized: () => Promise<void> }) {
  const [form, setForm] = useState({ id: "", target: "", source: "", version: "", summary: "" });
  const { error, transactions, send } = useWalletAction(onFinalized);
  return <section className="form-shell"><div><p className="eyebrow">CANDIDATE SUBMISSION</p><h2>Submit candidate</h2><p>RootGuard accepts only commit-pinned public source. The contract snapshots the target baseline before consensus review.</p></div>{error && <p className="form-error">{error}</p>}<form className="rg-form" onSubmit={(event) => { event.preventDefault(); void send("Submit candidate", "submit_upgrade", [form.id, form.target, form.source, form.version, form.summary]); }}><label>Proposal ID<input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="counter-v3"/></label><label>Target<select required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}><option value="">Select protected target</option>{targets.map((target) => <option key={String(target.id)} value={String(target.id)}>{String(target.name)} ({String(target.id)})</option>)}</select></label><label className="wide">Commit-pinned candidate source URL<input required type="url" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="https://raw.githubusercontent.com/.../commit/..."/></label><label>Proposed version<input required value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v3"/></label><label className="wide">Change summary<textarea required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Describe the storage-safe, authority-safe change in at least 80 characters."/></label><button disabled={!targets.length}>Submit for GenLayer review</button></form><TransactionList transactions={transactions}/></section>;
}
