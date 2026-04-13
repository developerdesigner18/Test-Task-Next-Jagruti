import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import ProofActions from './proof-actions'
import { Database } from '@/lib/types/database'

type ProofWithProduct = Database['public']['Tables']['proofs']['Row'] & {
  products: { name: string } | null
}

interface ProofReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ProofReviewPage({ params }: ProofReviewPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: proofsData, error } = await supabase
    .from('proofs')
    .select('*, products(name)')
    .eq('order_id', id)
    .order('proof_number', { ascending: true })

  const proofs = proofsData as ProofWithProduct[] | null

  if (error || !proofs || proofs.length === 0) {
    notFound()
  }

  const targetDate = proofs[0].est_ship_date ? new Date(proofs[0].est_ship_date) : new Date()

  return (
    <div className="w-full space-y-12 p-8 md:p-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-10">
        <div className="space-y-1">
          <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
             <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
             <span>/</span>
             <span>Project Review</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Review Your Designs</h1>
        </div>

        <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="text-right">
              <p className="text-[10px] uppercase font-black text-slate-400">Order ID</p>
              <p className="font-bold text-slate-900 text-sm tracking-tight">{id.slice(0, 8)}</p>
           </div>
           <div className="h-8 w-px bg-slate-100" />
           <div className="text-right">
              <p className="text-[10px] uppercase font-black text-slate-400">Target Date</p>
              <p className="font-bold text-slate-900 text-sm">{format(targetDate, 'MMM d')}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-8 space-y-12">
           {proofs.map((proof) => (
             <div key={proof.id} className="bg-white rounded-[40px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden group">
                <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                   <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-slate-200">
                         {proof.proof_number}
                      </div>
                      <div>
                         <h3 className="font-black text-xl text-slate-900 leading-tight">{proof.products?.name}</h3>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {proof.color} • {proof.print_type.replace('_', ' ')}
                         </p>
                      </div>
                   </div>
                   <ProofBadge status={proof.status} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2">
                   <div className="p-8 bg-slate-50/50 border-r border-slate-100 flex items-center justify-center min-h-[400px]">
                      <img 
                        src={proof.mockup_image_url || 'https://placehold.co/600x800/f8fafc/cbd5e1?text=Mockup+Pending'}
                        alt="Product Mockup"
                        className="max-w-full max-h-full object-contain drop-shadow-2xl group-hover:scale-105 transition-transform duration-700 ease-out p-4"
                      />
                   </div>

                   <div className="p-10 flex flex-col justify-between bg-white">
                      <div className="space-y-6">
                        <div className="space-y-3">
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Pricing for this item</p>
                           <div className="grid grid-cols-2 gap-3">
                              {proof.price_tiers.map((tier) => (
                                <div key={tier.min_qty} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                   <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{tier.min_qty}+ units</p>
                                   <p className="text-lg font-black mt-1 text-slate-900">${tier.price_per_unit.toFixed(2)}</p>
                                </div>
                              ))}
                           </div>
                        </div>

                        <div className="h-px bg-slate-100 w-full" />
                        
                        <div className="space-y-4">
                           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Review Actions</p>
                           <ProofActions 
                             orderId={id} 
                             proofId={proof.id} 
                             currentStatus={proof.status} 
                           />
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-slate-50">
                         <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                           * Estimated shipping date: <span className="text-slate-900">{format(proof.est_ship_date ? new Date(proof.est_ship_date) : new Date(), 'MMMM d, yyyy')}</span>
                         </p>
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-10">
           <div className="bg-[#0f172a] rounded-[40px] p-10 text-white shadow-2xl shadow-blue-900/20">
              <h2 className="text-2xl font-black mb-4 tracking-tight">Production Approval</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Your project is currently in the **Review Phase**. We need you to approve every individual design mockup before our production team can start printing.
              </p>

              <div className="space-y-6">
                 <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">1</div>
                    Check colors & placement
                 </div>
                 <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">2</div>
                    Verify print method
                 </div>
                 <div className="flex items-center gap-4 text-sm font-bold text-slate-300">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">3</div>
                    Confirm ship-by date
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-200 p-8 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex-shrink-0 flex items-center justify-center text-2xl shadow-inner">💡</div>
              <div className="space-y-1">
                 <p className="text-sm font-black text-slate-900">Need specific changes?</p>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium">
                   Requesting a revision will alert our designers immediately. You will get an updated email when the next version is ready.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function ProofBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:            "bg-blue-50 text-blue-600 border-blue-100",
    approved:           "bg-emerald-50 text-emerald-600 border-emerald-100",
    revision_requested: "bg-amber-50 text-amber-600 border-amber-100",
  }

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter border-2 ${styles[status] || styles.pending}`}>
       {status.replace('_', ' ')}
    </span>
  )
}
