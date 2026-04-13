'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'react-toastify'
import { signUp } from '@/lib/auth/actions'
import Input  from '@/components/ui/input'
import Button from '@/components/ui/button'
import type { AuthResult } from '@/lib/auth/actions'

const initialState: AuthResult = { error: null }

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState)

  useEffect(() => {
    if (state.error?.field === 'general') {
      toast.error(state.error.message)
    }
  }, [state.error])

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-black text-slate-900 tracking-tightest leading-tight mb-2">
          Join the Industry.
        </h1>
        <p className="text-slate-500 font-bold text-base leading-relaxed">
          Create an account to start managing projects.
        </p>
      </div>

      <form action={formAction} className="space-y-5" noValidate>
        <div className="grid grid-cols-1 gap-5">
          <Input
            label="Full Name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="e.g. Alex Rivera"
            error={state.error?.field === 'name' ? state.error.message : undefined}
            required
            className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 transition-all font-bold"
          />

          <Input
            label="Corporate Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.edu"
            error={state.error?.field === 'email' ? state.error.message : undefined}
            required
            className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 transition-all font-bold"
          />

          <Input
            label="Create Secure Password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            hint="Min. 8 characters with a mix of letters and numbers"
            error={state.error?.field === 'password' ? state.error.message : undefined}
            required
            className="h-14 rounded-2xl border-slate-200 focus:border-blue-500 transition-all font-bold"
          />
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            fullWidth 
            loading={isPending} 
            className="h-16 rounded-[24px] bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-2xl shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            {isPending ? 'Building your portal...' : 'Create Account →'}
          </Button>
        </div>
      </form>

      <div className="pt-10 border-t border-slate-100 flex flex-col items-center">
        <p className="text-sm font-bold text-slate-400">
          Already a member?{' '}
          <Link href="/login" className="text-slate-900 font-black hover:text-blue-600 transition-colors border-b-2 border-slate-100 hover:border-blue-600 pb-1">
            Sign In to Portal
          </Link>
        </p>
      </div>

      <p className="text-center text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest opacity-50">
        Secure authentication powered by TCL Cloud. <br />
        By joining, you accept our <span className="underline cursor-pointer">Service Terms</span>.
      </p>
    </div>
  )
}
