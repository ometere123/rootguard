import { AppHeader } from "@/components/app-header";
import { TargetDetail } from "@/components/target-detail";
export default async function TargetPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <main className="rg-shell"><AppHeader/><TargetDetail id={decodeURIComponent(id)}/></main>; }
