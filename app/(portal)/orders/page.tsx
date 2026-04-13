import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import StatusBadge from '@/components/dashboard/status-badge'
import Button from '@/components/ui/button'
import { redirect } from 'next/navigation'
import { OrderRow } from '@/lib/types/database'

interface OrdersPageProps {
  searchParams: Promise<{ page?: string }>
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const pageParams = await searchParams
  const page = parseInt(pageParams.page ?? '1')
  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data: ordersData, count } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const orders = (ordersData || []) as OrderRow[]
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="w-full space-y-10 pb-20 p-8 md:p-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tightest leading-none">
            Project Archive
          </h1>
          <p className="text-slate-500 font-bold mt-3 text-sm uppercase tracking-wider opacity-60">
            Total Projects Found: <span className="text-blue-600">{count ?? 0}</span>
          </p>
        </div>
        <Link href="/orders/new">
          <Button className="h-14 px-8 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white font-black shadow-xl shadow-slate-200 transition-all active:scale-95">
            + Start New Project
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest">Project Details</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Target Date</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Order Type</th>
                <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-blue-50/20 transition-all group">
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                         📦
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0f172a] text-lg leading-tight group-hover:translate-x-1 transition-transform">{order.event_name}</p>
                        <p className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-1 tracking-tighter">REF_{order.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-10 py-8 text-center">
                    <p className="text-sm font-black text-slate-600">
                      {order.due_date ? new Date(order.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </p>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-tight">
                      {order.order_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {order.status === 'proof_ready' ? (
                        <Link href={`/orders/${order.id}/proofs`}>
                          <Button className="rounded-xl h-10 px-5 text-xs bg-blue-600 text-white font-black hover:bg-blue-700 shadow-lg shadow-blue-500/20">
                            Review Proofs →
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="secondary" className="rounded-xl h-10 px-5 text-xs font-black text-slate-400 border-none bg-slate-100 cursor-not-allowed">
                          In Progress
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {orders.length === 0 && (
          <div className="py-32 text-center bg-slate-50/20">
             <div className="text-5xl mb-4 opacity-20">📭</div>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No project history found</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <Link key={i} href={`/orders?page=${i + 1}`}>
              <div 
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all cursor-pointer ${
                  page === i + 1 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110' 
                    : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-100 hover:border-slate-300'
                }`}
              >
                {i + 1}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
