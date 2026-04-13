// app/(auth)/layout.tsx — Premium two-column auth layout
'use client'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white font-outfit">

      {/* ── Left brand panel (hidden on mobile) ─────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)' }}>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 filter blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 filter blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Logo */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <span className="text-white font-black text-2xl leading-none italic">T</span>
          </div>
          <div>
            <p className="text-white font-black text-xl tracking-tighter leading-none">TCL PORTAL</p>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Enterprise Solution</p>
          </div>
        </div>

        {/* Center copy */}
        <div className="relative z-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-sm">
               <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
               <span className="text-white/60 text-[10px] font-black uppercase tracking-widest">Industry Standard v4.0</span>
            </div>
            <h2 className="text-white text-7xl font-black leading-[0.85] tracking-tightest">
              Built for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Performance.
              </span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm font-medium">
              The professional ecosystem for high-volume apparel production, logistics, and visual approval.
            </p>
          </div>

          {/* Trust stats */}
          <div className="grid grid-cols-2 gap-8 mt-16 pt-12 border-t border-white/5">
            {[
              { label: 'Active Projects', value: '12.4k+' },
              { label: 'Reliability', value: '99.9%' },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-white text-4xl font-black tracking-tighter tabular-nums">{stat.value}</p>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
            © {new Date().getFullYear()} TCL GLOBAL · LONDON
          </p>
          <div className="flex gap-4 items-center">
             <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 bg-white relative overflow-y-auto">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#0f172a 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="w-full max-w-sm relative z-10 py-8">
          {children}
        </div>
      </div>
    </div>
  )
}
