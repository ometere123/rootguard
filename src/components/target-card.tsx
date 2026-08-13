import { ExternalLink } from "lucide-react";
import type { Target } from "@/lib/rootguard";
import Link from "next/link";

export function TargetCard({ target }: { target: Target }) {
  return <article className="rg-card"><div className="card-head"><strong>{String(target.name)}</strong><span className={`badge ${target.active ? "green" : "red"}`}>{target.active ? "ACTIVE" : "INACTIVE"}</span></div><dl className="detail-list"><dt>Target ID</dt><dd>{String(target.id)}</dd><dt>Contract</dt><dd><code>{String(target.contract_address)}</code></dd><dt>Current version</dt><dd>{String(target.current_version)}</dd><dt>Steward</dt><dd><code>{String(target.steward)}</code></dd><dt>Source SHA</dt><dd><code>{String(target.current_source_sha256)}</code></dd></dl><div className="card-links"><Link className="text-link" href={`/targets/${encodeURIComponent(String(target.id))}`}>Open target</Link><a href={String(target.current_source_url)} target="_blank" rel="noreferrer">Pinned source <ExternalLink size={13}/></a></div></article>;
}
