import type { OrderStatus } from '@/lib/types/database'

export default function StatusBadge({ status }: { status: OrderStatus | string }) {
  const styles: Record<string, string> = {
    new:            "bg-slate-100 text-slate-500",
    proof_pending:  "bg-amber-100 text-amber-700",
    proof_ready:    "bg-sky-100 text-sky-700 border-sky-200 animate-pulse",
    approved:       "bg-emerald-100 text-emerald-800",
    in_production:  "bg-indigo-100 text-indigo-700",
    shipped:        "bg-purple-100 text-purple-700",
    complete:       "bg-slate-900 text-white",
  }

  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${styles[status] || styles.new}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
