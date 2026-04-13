import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { logOut } from '@/lib/auth/actions'
import { UserRow } from '@/lib/types/database'

interface PortalLayoutProps {
  children: React.ReactNode
}

export default async function PortalLayout({ children }: PortalLayoutProps) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const { data: profileData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as UserRow | null

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#0f172a] text-white hidden md:flex flex-col z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <span className="font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-lg tracking-tight">TCL Portal</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavLink href="/dashboard" icon="📊">Dashboard</NavLink>
          <NavLink href="/orders" icon="📦">My Orders</NavLink>
          <NavLink href="#" icon="🎨" disabled>Proofs</NavLink>
          <div className="pt-4 pb-2 px-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
            Account
          </div>
          <NavLink href="#" icon="👤" disabled>Settings</NavLink>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold relative group">
              {profile?.name?.[0]?.toUpperCase() ?? 'U'}
              <div className="absolute inset-0 rounded-full border border-white/20"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate leading-tight">
                {profile?.name ?? 'User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {profile?.organization ?? 'No Organization'}
              </p>
            </div>
          </div>
          
          <form action={logOut}>
            <button className="mt-2 w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group cursor-pointer">
              <span className="group-hover:rotate-12 transition-transform">🚪</span> Logout
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
        <header className="md:hidden bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-xs">T</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">TCL Portal</span>
          </div>
          <button className="p-2 -mr-2 text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </header>

        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  )
}

interface NavLinkProps {
  href: string
  icon: string
  children: React.ReactNode
  disabled?: boolean
}

function NavLink({ href, icon, children, disabled }: NavLinkProps) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-slate-600 cursor-not-allowed opacity-50">
        <span className="text-lg opacity-60">{icon}</span>
        {children}
      </div>
    )
  }

  return (
    <Link 
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
    >
      <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">
        {icon}
      </span>
      {children}
    </Link>
  )
}
