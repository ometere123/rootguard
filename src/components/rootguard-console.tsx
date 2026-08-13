"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, Fingerprint, Gavel, LoaderCircle, RefreshCw, ShieldCheck, TriangleAlert, Upload } from "lucide-react";
import { generatePrivateKey } from "genlayer-js";
import { CONTRACT_ADDRESS, addressUrl, loadLedger, txUrl, type Proposal, type Summary, type Target, waitFinalized, writeRootGuard } from "@/lib/rootguard";

type Ledger = { summary?: Summary; targets: Target[]; proposals: Proposal[] };
type Tx = { hash: string; label: string; status: "PENDING" | "FINALIZED" | "FAILED"; error?: string };

const blank: Ledger = { targets: [], proposals: [] };
const charterExample = "Only approve upgrades that preserve storage layout, keep RootGuard as the sole upgrade authority, retain public reads, avoid value movement, and expose the stated version truthfully.";

export function RootGuardConsole() {
  const [ledger, setLedger] = useState<Ledger>(blank);
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<`0x${string}`>();
  const [generatedKey, setGeneratedKey] = useState<`0x${string}`>();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [message, setMessage] = useState<string>();

  const refresh = useCallback(async () => {
    setLoading(true);
    setLedger(await loadLedger());
    setLoading(false);
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const activeWallet = generatedKey ? "Browser wallet" : wallet ? "Injected wallet" : "Read-only";
  const address = useMemo(() => generatedKey ? undefined : wallet, [generatedKey, wallet]);

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error("No injected wallet was found in this browser.");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" }) as `0x${string}`[];
      if (!accounts[0]) throw new Error("No wallet account was returned.");
      setGeneratedKey(undefined);
      setWallet(accounts[0]);
      setMessage(undefined);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Wallet connection failed."); }
  }

  function useBrowserWallet() {
    const stored = window.localStorage.getItem("rootguard-browser-key") as `0x${string}` | null;
    if (stored) { setGeneratedKey(stored); setWallet(undefined); return; }
    const key = generatePrivateKey();
    window.localStorage.setItem("rootguard-browser-key", key);
    setGeneratedKey(key);
    setWallet(undefined);
    setMessage("A browser wallet was created on this device. Export or record its private key before relying on it.");
  }

  function importBrowserWallet() {
    const value = window.prompt("Paste a 0x-prefixed browser wallet private key");
    if (!value?.match(/^0x[0-9a-fA-F]{64}$/)) { setMessage("That is not a valid 0x-prefixed private key."); return; }
    window.localStorage.setItem("rootguard-browser-key", value);
    setGeneratedKey(value as `0x${string}`);
    setWallet(undefined);
  }

  async function submit(label: string, functionName: string, args: unknown[]) {
    try {
      setMessage(undefined);
      const hash = await writeRootGuard(generatedKey, address, functionName, args as never[]);
      setTxs((items) => [{ hash, label, status: "PENDING" }, ...items]);
      await waitFinalized(generatedKey, address, hash);
      setTxs((items) => items.map((item) => item.hash === hash ? { ...item, status: "FINALIZED" } : item));
      await refresh();
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Transaction failed.";
      setMessage(detail);
      setTxs((items) => items.map((item) => item.status === "PENDING" ? { ...item, status: "FAILED", error: detail } : item));
    }
  }

  return <main className="rg-shell">
    <header className="rg-header"><a className="rg-mark" href="#top"><ShieldCheck size={24} /><span>ROOTGUARD</span></a><nav><a href="#targets">Targets</a><a href="#proposals">Proposals</a><a href="#actions">Control room</a></nav><div className="rg-wallet"><span>{activeWallet}</span>{wallet || generatedKey ? <>{generatedKey && <button className="quiet" onClick={() => window.prompt("Copy and store this browser wallet private key", generatedKey)}>Export key</button>}<button onClick={() => { setWallet(undefined); setGeneratedKey(undefined); }}>Disconnect</button></> : <><button onClick={connectWallet}>Connect wallet</button><button className="quiet" onClick={useBrowserWallet}>Browser key</button><button className="quiet" onClick={importBrowserWallet}>Import</button></>}</div></header>
    <section id="top" className="rg-hero"><div><p className="eyebrow">GENLAYER UPGRADE CONTROL</p><h1>Change code only when consensus can defend it.</h1><p className="lede">RootGuard freezes the upgrade charter, compares immutable public source, opens a mandatory challenge period, and sends the final upgrade from a contract-controlled authority.</p><div className="rg-address">{CONTRACT_ADDRESS ? <a href={addressUrl(CONTRACT_ADDRESS)} target="_blank">{CONTRACT_ADDRESS}<ExternalLink size={14}/></a> : "Contract address not configured"}</div></div><section className="rg-grid stats"><Stat label="Protected targets" value={ledger.summary?.target_count ?? "0"}/><Stat label="Upgrade proposals" value={ledger.summary?.proposal_count ?? "0"}/><Stat label="Approved reviews" value={ledger.summary?.approved_count ?? "0"}/><Stat label="Executed upgrades" value={ledger.summary?.executed_count ?? "0"}/></section></section>
    {message && <div className="rg-alert"><TriangleAlert size={18}/>{message}</div>}
    <section id="targets" className="rg-section"><SectionTitle icon={<Fingerprint/>} kicker="AUTHORITY REGISTRY" title="Protected targets" action={<button className="icon-button" title="Refresh contract state" onClick={() => void refresh()}><RefreshCw size={17}/></button>}/>{loading ? <div className="rg-empty"><LoaderCircle className="spin"/> Reading RootGuard...</div> : ledger.targets.length ? <div className="rg-cards">{ledger.targets.map((target) => <article className="rg-card" key={String(target.id)}><div className="card-head"><strong>{String(target.name)}</strong><span className={target.active ? "badge green" : "badge"}>{target.active ? "ACTIVE" : "INACTIVE"}</span></div><code>{String(target.contract_address)}</code><p>{String(target.current_version)} · {String(target.proposal_count)} proposals</p><a href={String(target.current_source_url)} target="_blank">Reviewed source <ExternalLink size={13}/></a></article>)}</div> : <div className="rg-empty">No targets yet. Register a contract that already lists this RootGuard address as a native upgrader.</div>}<TargetForm onSend={submit}/></section>
    <section id="proposals" className="rg-section"><SectionTitle icon={<Gavel/>} kicker="CONSENSUS QUEUE" title="Upgrade proposals"/>{ledger.proposals.length ? <div className="rg-cards">{ledger.proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal}/>)}</div> : <div className="rg-empty">No proposals have been written to the contract.</div>}<ProposalForm targets={ledger.targets} onSend={submit}/></section>
    <section id="actions" className="rg-section control"><SectionTitle icon={<Upload/>} kicker="ON-CHAIN ACTIONS" title="Control room"/><p>Each action is a consensus write. The contract decides which transitions are valid; this panel only sends the transaction and follows it through finalization.</p><ActionForms onSend={submit}/><div className="rg-txs"><h3>Browser transaction ledger</h3>{txs.length ? txs.map((tx) => <a key={tx.hash} className="tx-row" href={txUrl(tx.hash)} target="_blank"><span>{tx.label}</span><code>{tx.hash.slice(0, 14)}...</code><span className={`badge ${tx.status === "FINALIZED" ? "green" : tx.status === "FAILED" ? "red" : "amber"}`}>{tx.status}</span><ExternalLink size={14}/></a>) : <p>Writes from this browser will appear here while the contract remains the source of truth.</p>}</div></section>
    <footer>RootGuard uses native GenVM upgradability, strict public-source equality, comparative consensus, and finalized contract-to-contract messages.</footer>
  </main>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><strong>{value}</strong></div>; }
function SectionTitle({ icon, kicker, title, action }: { icon: React.ReactNode; kicker: string; title: string; action?: React.ReactNode }) { return <div className="section-title"><span className="section-icon">{icon}</span><div><p className="eyebrow">{kicker}</p><h2>{title}</h2></div>{action}</div>; }
function ProposalCard({ proposal }: { proposal: Proposal }) { return <article className="rg-card"><div className="card-head"><strong>{proposal.id}</strong><span className="badge amber">{proposal.status}</span></div><p>{proposal.proposed_version} · {proposal.verdict} / {proposal.confidence}</p><p className="muted">{proposal.rationale || "Awaiting contract review."}</p><a href={proposal.candidate_source_url} target="_blank">Candidate source <ExternalLink size={13}/></a></article>; }

function TargetForm({ onSend }: { onSend: (label: string, fn: string, args: unknown[]) => Promise<void> }) { const [form, setForm] = useState({ id: "", name: "", address: "", charter: charterExample, source: "" }); return <form className="rg-form" onSubmit={(event) => { event.preventDefault(); void onSend("register_target", "register_target", [form.id, form.name, form.address, form.charter, form.source]); }}><h3>Register target</h3><input required placeholder="target-id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })}/><input required placeholder="Target name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/><input required placeholder="0x protected contract address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}/><input required type="url" placeholder="Immutable current-source URL" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}/><textarea required value={form.charter} onChange={(e) => setForm({ ...form, charter: e.target.value })}/><button>Register target</button></form>; }
function ProposalForm({ targets, onSend }: { targets: Target[]; onSend: (label: string, fn: string, args: unknown[]) => Promise<void> }) { const [form, setForm] = useState({ id: "", target: String(targets[0]?.id ?? ""), source: "", version: "", summary: "" }); useEffect(() => { if (!form.target && targets[0]) setForm((old) => ({ ...old, target: String(targets[0].id) })); }, [form.target, targets]); return <form className="rg-form" onSubmit={(event) => { event.preventDefault(); void onSend("submit_upgrade", "submit_upgrade", [form.id, form.target, form.source, form.version, form.summary]); }}><h3>Submit upgrade</h3><input required placeholder="proposal-id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })}/><select required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}><option value="">Select a target</option>{targets.map((target) => <option key={String(target.id)} value={String(target.id)}>{String(target.name)}</option>)}</select><input required type="url" placeholder="Immutable candidate-source URL" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}/><input required placeholder="Proposed version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })}/><textarea required placeholder="Change summary (80+ characters)" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })}/><button>Submit for consensus</button></form>; }
function ActionForms({ onSend }: { onSend: (label: string, fn: string, args: unknown[]) => Promise<void> }) { const [id, setId] = useState(""); const [url, setUrl] = useState(""); const [summary, setSummary] = useState(""); return <div className="actions"><form className="inline-form" onSubmit={(e) => { e.preventDefault(); void onSend("review_upgrade", "review_upgrade", [id]); }}><h3>Review proposal</h3><input required placeholder="proposal-id" value={id} onChange={(e) => setId(e.target.value)}/><button>Start review</button></form><form className="inline-form" onSubmit={(e) => { e.preventDefault(); void onSend("open_challenge", "open_challenge", [id, url, summary]); }}><h3>Open challenge</h3><input required placeholder="proposal-id" value={id} onChange={(e) => setId(e.target.value)}/><input required type="url" placeholder="Public challenge evidence URL" value={url} onChange={(e) => setUrl(e.target.value)}/><textarea required placeholder="Specific challenge summary (80+ characters)" value={summary} onChange={(e) => setSummary(e.target.value)}/><button>Open challenge</button></form><form className="inline-form" onSubmit={(e) => { e.preventDefault(); void onSend("review_challenge", "review_challenge", [id]); }}><h3>Re-review challenge</h3><input required placeholder="proposal-id" value={id} onChange={(e) => setId(e.target.value)}/><button>Re-review</button></form><form className="inline-form" onSubmit={(e) => { e.preventDefault(); void onSend("execute_upgrade", "execute_upgrade", [id]); }}><h3>Execute after window</h3><input required placeholder="proposal-id" value={id} onChange={(e) => setId(e.target.value)}/><button>Queue upgrade</button></form><form className="inline-form" onSubmit={(e) => { e.preventDefault(); void onSend("confirm_execution", "confirm_execution", [id]); }}><h3>Confirm target</h3><input required placeholder="proposal-id" value={id} onChange={(e) => setId(e.target.value)}/><button>Confirm execution</button></form></div>; }
