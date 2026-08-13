import { AppHeader } from "@/components/app-header";
import { ProposalDetail } from "@/components/proposal-detail";
export default async function ProposalPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <main className="rg-shell"><AppHeader/><ProposalDetail id={decodeURIComponent(id)}/></main>; }
