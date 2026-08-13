"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { NetworkStatus } from "@/components/network-status";
import { ProposalCard } from "@/components/proposal-card";
import { TargetCard } from "@/components/target-card";
import { useLiveLedger } from "@/components/live-ledger";

export default function Home() {
  const { ledger, loading, error } = useLiveLedger();
  return <main className="rg-shell"><AppHeader/><section className="rg-hero"><div><p className="eyebrow">GENLAYER UPGRADE AUTHORITY</p><h1>Code changes need proof, not just permission.</h1><p className="lede">A native upgrade authority with consensus-backed source review, a bounded challenge window, exact-byte binding, and target confirmation.</p><NetworkStatus/></div><div className="rg-grid stats">{Object.entries({ Targets: ledger.summary.target_count ?? "-", Proposals: ledger.summary.proposal_count ?? "-", Approved: ledger.summary.approved_count ?? "-", Executed: ledger.summary.executed_count ?? "-" }).map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div></section>{error ? <p className="rg-alert">{error}</p> : loading ? <p className="rg-section"><LoaderCircle className="spin"/> Reading live RootGuard state...</p> : <><section className="rg-section"><div className="section-row"><div><p className="eyebrow">LIVE REGISTRY</p><h2>Recent targets</h2></div><Link className="text-link" href="/targets">View targets</Link></div><div className="rg-cards">{ledger.targets.slice(0, 3).map((target) => <TargetCard key={String(target.id)} target={target}/>)}</div></section><section className="rg-section"><div className="section-row"><div><p className="eyebrow">LIVE REVIEW QUEUE</p><h2>Recent proposals</h2></div><Link className="text-link" href="/proposals">View proposals</Link></div><div className="rg-cards">{ledger.proposals.slice(0, 3).map((proposal) => <ProposalCard key={String(proposal.id)} proposal={proposal} targets={ledger.targets}/>)}</div></section></>}<section className="rg-section lifecycle-band"><p className="eyebrow">ROOTGUARD LIFECYCLE</p><p>Enroll target <b>→</b> Submit candidate <b>→</b> GenLayer review <b>→</b> Challenge window <b>→</b> SHA re-check <b>→</b> Queue upgrade <b>→</b> Confirm installation</p></section></main>;
}
