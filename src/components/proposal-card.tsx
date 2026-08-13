import Link from "next/link";
import type { Proposal, Target } from "@/lib/rootguard";

export function ProposalCard({ proposal, targets }: { proposal: Proposal; targets?: Target[] }) {
  const target = targets?.find((item) => String(item.id) === String(proposal.target_id));
  return <article className="rg-card"><div className="card-head"><strong>{String(proposal.id)}</strong><span className="badge amber">{String(proposal.status)}</span></div><dl className="detail-list compact"><dt>Target</dt><dd>{target ? String(target.name) : String(proposal.target_id)}</dd><dt>Version</dt><dd>{String(proposal.base_version)} to {String(proposal.proposed_version)}</dd><dt>Verdict</dt><dd>{String(proposal.verdict)} / {String(proposal.confidence)}</dd><dt>Candidate SHA</dt><dd><code>{String(proposal.candidate_sha256 || "Pending review")}</code></dd></dl><p className="clamp-text">{String(proposal.rationale || "Awaiting consensus review.")}</p><Link className="text-link" href={`/proposals/${encodeURIComponent(String(proposal.id))}`}>Open lifecycle</Link></article>;
}
