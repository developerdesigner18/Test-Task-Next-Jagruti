'use client'

import { useState } from 'react'
import { toast } from 'react-toastify'
import Button from '@/components/ui/button'
import { approveProof, submitRevision } from '@/lib/orders/actions'

export default function ProofActions({ orderId, proofId, currentStatus }: any) {
  const [loading, setLoading] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [notes, setNotes] = useState('')

  if (currentStatus === 'approved') {
    return (
      <div className="bg-emerald-50 bg-emerald-100/50 border border-emerald-200 rounded-2xl p-6 text-center animate-fade-in shadow-sm shadow-emerald-500/5">
         <p className="text-emerald-600 font-black text-sm tracking-tight flex items-center justify-center gap-2 uppercase">
           <span className="text-xl">✨</span> APPROVED & READY FOR PRODUCTION
         </p>
      </div>
    )
  }

  if (currentStatus === 'revision_requested') {
    return (
      <div className="bg-amber-50 bg-amber-100/50 border border-amber-200 rounded-2xl p-6 text-center animate-fade-in shadow-sm">
         <p className="text-amber-700 font-black text-sm tracking-tight flex items-center justify-center gap-2 uppercase">
           <span className="text-xl">🔄</span> REVISION REQUESTED
         </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
       {!showNotes ? (
         <>
           {!showConfirm ? (
             <Button 
               className="w-full h-16 rounded-2xl font-black text-base shadow-xl shadow-blue-500/10 bg-blue-600 hover:bg-blue-700 transition-all text-white"
               onClick={() => setShowConfirm(true)}
             >
               Approve & Start Printing ✅
             </Button>
           ) : (
             <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center space-y-4 animate-fade-in">
               <p className="text-sm font-bold text-blue-900">Ready to start production? This will finalize the design.</p>
               <div className="flex gap-3">
                 <Button 
                   className="flex-1 rounded-xl h-12 font-black bg-blue-600 hover:bg-blue-700 text-white"
                   onClick={async () => {
                     setLoading(true)
                     try {
                       await approveProof(proofId, orderId)
                       toast.success('Design approved for production!')
                     } catch (e) {
                       toast.error('Submission failed. Please try again.')
                     } finally {
                       setLoading(false)
                     }
                   }}
                   loading={loading}
                 >
                   Yes, Finalize
                 </Button>
                 <Button 
                   variant="secondary" 
                   className="flex-1 rounded-xl h-12 font-bold bg-white text-slate-500 hover:text-slate-900 border border-slate-200"
                   onClick={() => setShowConfirm(false)}
                   disabled={loading}
                 >
                   Cancel
                 </Button>
               </div>
             </div>
           )}
           
           <Button 
             variant="secondary" 
             className="w-full h-16 rounded-2xl font-black text-slate-700 border-2 border-slate-100 bg-white hover:bg-slate-50 transition-all shadow-sm"
             onClick={() => setShowNotes(true)}
             disabled={loading || showConfirm}
           >
             Request Design Revision 🎨
           </Button>
         </>
       ) : (
         <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <textarea 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 text-slate-900 text-sm focus:border-blue-500 focus:ring-0 outline-none min-h-[140px] leading-relaxed transition-all"
                placeholder="What would you like to change? (e.g., Make the font bolder, change ink color to Navy...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="absolute right-4 bottom-4 text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
                Designer Notes
              </div>
            </div>

            <div className="flex gap-3">
               <Button 
                  className="flex-1 rounded-2xl h-14 font-black bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={notes.length < 5 || loading}
                  onClick={async () => {
                    setLoading(true)
                    try {
                      await submitRevision(proofId, orderId, notes)
                      setShowNotes(false)
                    } catch (e) {
                       toast.error('Failed to submit revision. Please try again.')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  loading={loading}
               >
                 Submit Instructions
               </Button>
               <Button 
                  variant="secondary" 
                  className="rounded-2xl h-14 font-bold text-slate-500 hover:text-slate-900 bg-slate-100 border-none"
                  onClick={() => setShowNotes(false)}
               >
                 Cancel
               </Button>
            </div>
         </div>
       )}
    </div>
  )
}
