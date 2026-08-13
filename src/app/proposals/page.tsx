"use client";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { ProposalCard } from "@/components/proposal-card";
import { SubmitProposalForm } from "@/components/submit-proposal-form";
import { useLiveLedger } from "@/components/live-ledger";
export default function ProposalsPage() { const { ledger, loading, error, refresh } = useLiveLedger(); return <main className="rg-shell"><AppHeader/><section className="page-intro"><p className="eyebrow">CONSENSUS REVIEW QUEUE</p><h1>Upgrade proposals</h1><p className="lede">Every proposal is source-bound, status-driven, and linked to its own lifecycle page.</p></section><section className="rg-section">{error ? <p className="rg-alert">{error}</p> : loading ? <p><LoaderCircle className="spin"/> Reading live proposals...</p> : ledger.proposals.length ? <div className="rg-cards">{ledger.proposals.map((proposal) => <ProposalCard key={String(proposal.id)} proposal={proposal} targets={ledger.targets}/>)}</div> : <p className="rg-empty">No proposals are on-chain.</p>}<SubmitProposalForm targets={ledger.targets} onFinalized={refresh}/></section></main>; }
