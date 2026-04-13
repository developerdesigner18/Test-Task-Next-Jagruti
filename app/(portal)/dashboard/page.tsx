import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'
import Button from '@/components/ui/button'
import AIRecommendation from '@/components/dashboard/ai-recommendation'
import StatusBadge from '@/components/dashboard/status-badge'
import { Database, UserRow, OrderRow } from '@/lib/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [profileRes, ordersRes] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('orders').select('*, proofs(status)').eq('customer_id', user.id).order('created_at', { ascending: false }).limit(5)
  ])

  const profile = profileRes.data as UserRow | null
  const rawOrders = (ordersRes.data || []) as any[]

  // Derive if any proofs have a revision requested so the parent order can accurately mirror it
  const orders = rawOrders.map(order => {
    const hasRevision = order.proofs?.some((p: any) => p.status === 'revision_requested')
    return {
      ...order,
      status: hasRevision ? 'revision_requested' : order.status
    }
  })

  return (
    <div className="w-full space-y-10 p-8 md:p-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                Customer Portal
             </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
             Hi, {profile?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-slate-500 font-medium">
             Managed by <span className="text-slate-900 font-bold">{profile?.organization || 'Personal Account'}</span>
          </p>
        </div>

        <Link href="/orders/new">
          <Button size="lg" className="h-14 px-8 rounded-2xl font-black shadow-xl shadow-blue-200">
             + Start New Order
          </Button>
        </Link>
      </header>

      {orders.length > 0 && (
        <AIRecommendation order={orders[0] as any} />
      )}

      <section className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <h2 className="text-xl font-black text-slate-900">Your Recent Projects</h2>
           <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Found: {orders.length}
           </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Project Name</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-center text-slate-400 border-b border-slate-50">Status</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">Target Date</th>
                <th className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-right text-slate-400 border-b border-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-10 py-24 text-center">
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-2xl">📦</div>
                        <div>
                           <p className="font-bold text-slate-900">No projects yet</p>
                           <p className="text-sm text-slate-400">Your custom apparel projects will appear here.</p>
                        </div>
                     </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-7">
                      <p className="font-black text-slate-900 leading-tight group-hover:text-blue-600 transition-colors cursor-pointer">
                        {order.event_name}
                      </p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">
                        REF: {order.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-10 py-7 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-10 py-7">
                      <p className="text-sm font-bold text-slate-700">
                        {order.due_date ? format(new Date(order.due_date), 'MMM d, yyyy') : 'TBD'}
                      </p>
                    </td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/orders/${order.id}`} className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors">
                           Details
                        </Link>
                        {order.status === 'proof_ready' && (
                          <Link href={`/orders/${order.id}/proofs`}>
                            <Button variant="ghost" size="sm" className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 font-bold border-2 whitespace-nowrap">
                               Review Proofs →
                            </Button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
