'use client'

import { useState, useEffect } from 'react'

export default function AIRecommendation({ order }: { order: any }) {
  const [advice, setAdvice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const controller = new AbortController()

    async function fetchAI() {
      if (!order || !order.id) return
      if (advice && !loading) return 

      try {
        setLoading(true)
        const res = await fetch('/api/ai/next-action', {
          method: 'POST',
          body: JSON.stringify({ order }),
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal
        })
        
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        
        const data = await res.json()
        if (isMounted) setAdvice(data.advice)
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError' && isMounted) {
          console.error('AI Recommendation Error:', err)
          setAdvice("Check your project details for next steps.")
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAI()

    return () => {
      isMounted = false
      controller.abort()
    }
  }, [order.id, order.status])

  return (
    <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-1 text-white shadow-2xl shadow-blue-900/20 overflow-hidden animate-fade-in group">
       <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[38px] flex items-start gap-6 relative">
          
          {/* Animated AI Icon */}
          <div className={`w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl ${loading ? 'animate-pulse scale-90' : 'animate-bounce'}`}>
             {loading ? '🧠' : '🤖'}
          </div>

          <div className="space-y-2 flex-1">
             <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">AI Project Assistant</p>
             <h3 className="text-xl font-bold tracking-tight">Your Next Best Step:</h3>
             
             {loading ? (
               <div className="space-y-2 py-2">
                 <div className="h-2 w-3/4 bg-white/10 rounded-full animate-pulse" />
                 <div className="h-2 w-1/2 bg-white/10 rounded-full animate-pulse" />
               </div>
             ) : (
               <p className="text-sm text-slate-200 max-w-2xl leading-relaxed font-medium transition-all animate-in fade-in slide-in-from-left-4 duration-700">
                  "{advice}"
               </p>
             )}
          </div>

          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
       </div>
    </section>
  )
}
