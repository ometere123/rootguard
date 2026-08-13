"use client";

import { useEffect, useState } from "react";
import type { Proposal } from "@/lib/rootguard";
import { useWallet } from "@/components/wallet-provider";
import { useWalletAction } from "@/components/wallet-action";
import { TransactionList } from "@/components/transaction-list";

export function ProposalActions({ proposal, onFinalized }: { proposal: Proposal; onFinalized: () => Promise<void> }) {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [now, setNow] = useState(Date.now());
  const { profile } = useWallet();
  const { error, transactions, send } = useWalletAction(onFinalized);
  const id = String(proposal.id);
  const status = String(proposal.status);
  const targetId = String(proposal.target_id);
  const isSteward = profile?.stewarded_targets?.includes(targetId) ?? false;
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  const deadline = proposal.challenge_deadline ? Date.parse(String(proposal.challenge_deadline)) : 0;
  const challengeOpen = deadline ? now < deadline : true;
  const remaining = Math.max(0, deadline - now);
  const countdown = `${String(Math.floor(remaining / 3_600_000)).padStart(2, "0")}:${String(Math.floor((remaining % 3_600_000) / 60_000)).padStart(2, "0")}:${String(Math.floor((remaining % 60_000) / 1000)).padStart(2, "0")}`;
  const retryAt = proposal.execution_requested_at ? Date.parse(String(proposal.execution_requested_at)) + Number(proposal.retry_delay_seconds ?? 120) * 1000 : 0;
  const retryReady = retryAt > 0 && now >= retryAt;
  const button = (label: string, fn: string, note: string) => <div className="action-card"><h3>{label}</h3><p>{note}</p><button onClick={() => void send(label, fn, [id])}>{label}</button></div>;
  const cancellation = isSteward && ["AWAITING_REVIEW", "APPROVED_CHALLENGE_WINDOW", "CHALLENGED"].includes(status) ? <div className="action-card danger-action"><h3>Cancel proposal</h3><p>Cancellation prevents this proposal from executing and releases the target for a new proposal. Historical evidence remains on-chain.</p><button onClick={() => void send("Cancel proposal", "cancel_proposal", [id])}>Cancel proposal</button></div> : null;

  return <section className="proposal-actions"><p className="eyebrow">STATE-AWARE ACTIONS</p><h2>Proposal controls</h2>{error && <p className="form-error">{error}</p>}{status === "AWAITING_REVIEW" && <>{button("Start GenLayer review", "review_upgrade", "Validators independently fetch and assess the current and candidate source.")}{cancellation}</>}{status === "APPROVED_CHALLENGE_WINDOW" && <><div className="countdown"><span>Challenge window</span><strong>{challengeOpen ? `${countdown} remaining` : "Closed"}</strong></div><form className="action-card" onSubmit={(event) => { event.preventDefault(); void send("Open challenge", "open_challenge", [id, url, summary]); }}><h3>Open challenge</h3><p>{proposal.challenge_used ? "This proposal has already used its one challenge." : "Available once, before the on-chain deadline. RootGuard snapshots verified evidence before it changes state."}</p><label>Evidence URL<input required disabled={Boolean(proposal.challenge_used) || !challengeOpen} type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label><label>Evidence summary<textarea required disabled={Boolean(proposal.challenge_used) || !challengeOpen} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Specific evidence-backed concern" /></label><button disabled={Boolean(proposal.challenge_used) || !challengeOpen}>Open challenge</button></form>{challengeOpen ? <div className="action-card disabled-action"><h3>Queue upgrade</h3><p>Available after the challenge window closes. RootGuard enforces the deadline.</p><button disabled>Queue upgrade</button></div> : button("Queue upgrade", "execute_upgrade", "RootGuard will re-fetch and SHA-check the immutable candidate before queueing.")}{cancellation}</>}{status === "CHALLENGED" && <>{button("Review challenge", "review_challenge", "Validators reassess the candidate against the verified evidence snapshot.")}{cancellation}</>}{status === "EXECUTION_QUEUED" && <><div className="action-card"><h3>Confirm installation</h3><p>Available after the protected target installs the queued upgrade.</p><button onClick={() => void send("Confirm installation", "confirm_execution", [id])}>Confirm installation</button></div>{retryReady ? button("Retry upgrade", "retry_execution", "The prior finalized child has not produced the proposed version. RootGuard re-checks the exact candidate digest before emitting the same upgrade again.") : <div className="action-card disabled-action"><h3>Retry upgrade</h3><p>Available after the bounded retry delay. RootGuard never cancels queued execution while an earlier child could still install.</p><button disabled>Retry upgrade</button></div>}</>}{status === "EXECUTED" && <div className="action-card complete-action"><h3>Installation confirmed</h3><p>RootGuard read the protected target and only then recorded the upgrade as executed.</p></div>}{["REJECTED", "ABSTAINED", "STALE", "CANCELLED"].includes(status) && <div className="action-card disabled-action"><h3>No executable action</h3><p>This proposal is terminal: {status}.</p></div>}<TransactionList transactions={transactions} /></section>;
}
