"use client";
import { LoaderCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { EnrollTargetForm } from "@/components/enroll-target-form";
import { TargetCard } from "@/components/target-card";
import { useLiveLedger } from "@/components/live-ledger";
export default function TargetsPage() { const { ledger, loading, error, refresh } = useLiveLedger(); return <main className="rg-shell"><AppHeader/><section className="page-intro"><p className="eyebrow">AUTHORITY REGISTRY</p><h1>Protected targets</h1><p className="lede">Live targets enrolled through their owner-controlled protected contracts.</p></section><section className="rg-section">{error ? <p className="rg-alert">{error}</p> : loading ? <p><LoaderCircle className="spin"/> Reading live targets...</p> : ledger.targets.length ? <div className="rg-cards">{ledger.targets.map((target) => <TargetCard key={String(target.id)} target={target}/>)}</div> : <p className="rg-empty">No protected targets are enrolled.</p>}<EnrollTargetForm onFinalized={refresh}/></section></main>; }
