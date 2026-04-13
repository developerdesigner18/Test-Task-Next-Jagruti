import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import Button from '@/components/ui/button'
import StatusBadge from '@/components/dashboard/status-badge'
import { Database } from '@/lib/types/database'
import SimulateProofButton from '@/components/debug/simulate-proof-button'

type OrderWithProducts = Database['public']['Tables']['orders']['Row'] & {
  order_products: (Database['public']['Tables']['order_products']['Row'] & {
    products: { name: string } | null
  })[]
}

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: orderData, error } = await supabase
    .from('orders')
    .select('*, order_products(*, products(name))')
    .eq('id', id)
    .single()

  const order = orderData as OrderWithProducts | null

  if (error || !order) {
    notFound()
  }

  const getImageUrl = (path: string | null) => {
    if (!path) return null
    const { data } = supabase.storage.from('design-files').getPublicUrl(path)
    return data?.publicUrl
  }

  const frontUrl = getImageUrl(order.front_design_file_path)
  const backUrl = getImageUrl(order.back_design_file_path)

  return (
    <div className="container mx-auto space-y-12 p-8 md:p-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Link href="/dashboard" className="transition-colors hover:text-blue-600">Dashboard</Link>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-slate-900">Project {order.id.slice(0, 8)}</span>
           </div>
           <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
              {order.event_name}
           </h1>
        </div>

        {order.status === 'proof_ready' && (
          <Link href={`/orders/${id}/proofs`}>
            <Button size="lg" className="h-16 px-10 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02]">
               Review Design Proofs →
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatItem label="Target Date" value={format(order.due_date ? new Date(order.due_date) : new Date(), 'MMM d, yyyy')} icon="📅" />
              <StatItem label="Status" value={order.status.replace(/_/g, ' ')} icon="⚡" isStatus />
              <StatItem label="Order Type" value={order.order_type.replace(/_/g, ' ')} icon="📦" />
              <StatItem label="Print Tech" value={order.selected_print_type?.replace(/_/g, ' ') || 'TBD'} icon="🎨" />
           </div>

           <section className="space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Initial Design Concepts</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <MockupCard 
                   title="Front View" 
                   url={frontUrl} 
                   description={order.front_design_description} 
                 />
                 <MockupCard 
                   title="Back View" 
                   url={backUrl} 
                   description={order.back_design_description} 
                 />
              </div>
           </section>

           <div className="bg-white rounded-[40px] border border-slate-200 p-12 space-y-8 shadow-sm">
              <div className="space-y-4">
                 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    Special Instructions
                 </h3>
                 <p className="text-slate-500 font-medium leading-relaxed italic text-lg">
                    "{order.design_direction === 'copy_exactly' ? 'Strictly follow the provided mockup.' : 'Use the mockups as creative inspiration.'} {order.notes || ''}"
                 </p>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-[40px] border border-slate-200 p-10 space-y-6 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Selected Items</h3>
              <div className="space-y-4">
                 {order.order_products?.map((item) => (
                   <div key={item.id} className="flex flex-col gap-1 p-5 bg-slate-50/50 border border-slate-100 rounded-3xl group hover:bg-white transition-all hover:border-blue-100 hover:shadow-lg hover:shadow-blue-900/5">
                      <span className="font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase text-xs">{item.products?.name}</span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                         <span>{item.quantity} UNITS</span>
                         <span className="w-1 h-1 rounded-full bg-slate-300" />
                         <span>{item.color || 'TBD'}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-slate-900/20">
              <div className="relative z-10 space-y-6">
                 <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-xl">👤</div>
                 <div className="space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-400">Direct Support</p>
                    <h4 className="text-lg font-bold">Project Manager</h4>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                       Have a question about sizing or print colors? Your manager is ready to help.
                    </p>
                 </div>
                 <Button variant="ghost" className="w-full h-14 rounded-2xl border-white/20 text-white hover:bg-white hover:text-slate-900 font-black transition-all">
                    Message Center
                 </Button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[80px] rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
           </div>
         </div>
      </div>

      {/* ── Debug: Simulator Tools (Development Only) ─────────── */}
      {order.status === 'new' && (
        <div className="mt-20 pt-10 border-t border-dashed border-slate-200">
           <div className="bg-amber-50 rounded-[32px] p-8 border border-amber-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                 <p className="text-xs font-black uppercase tracking-widest text-amber-600">Developer Tools</p>
                 <h4 className="text-lg font-bold text-slate-900">Simulate Designer Workflow</h4>
                 <p className="text-sm text-slate-500 font-medium">Want to see the proofing flow? Click the button to mock a design upload from our team.</p>
              </div>
              <SimulateProofButton orderId={order.id} />
           </div>
        </div>
      )}
    </div>
  )
}

function StatItem({ label, value, icon, isStatus }: { label: string; value: string; icon: string; isStatus?: boolean }) {
  return (
    <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-2 shadow-sm">
       <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
       </div>
       <div className="font-black text-slate-900 capitalize text-sm truncate">
          {isStatus ? <StatusBadge status={value.replace(/ /g, '_')} /> : value}
       </div>
    </div>
  )
}

function MockupCard({ title, url, description }: { title: string; url: string | null; description: string | null }) {
  return (
    <div className="space-y-4">
       <div className="aspect-[4/5] bg-slate-100 rounded-[40px] overflow-hidden border border-slate-200 relative group flex items-center justify-center">
          {url ? (
            <img 
              src={url} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400 p-8 text-center">
               <div className="text-4xl">🎨</div>
               <p className="text-xs font-black uppercase tracking-widest">Mockup Uploaded</p>
               <p className="text-[10px] font-medium leading-relaxed italic">No visual uploaded for this side.</p>
            </div>
          )}
          <div className="absolute top-6 left-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-xl">
             {title}
          </div>
       </div>
       {description && (
          <p className="text-xs font-medium text-slate-500 italic px-4">
             Note: {description}
          </p>
       )}
    </div>
  )
}
