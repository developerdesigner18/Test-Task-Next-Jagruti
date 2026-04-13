// lib/auth/actions.ts
// Server Actions for signup and login.
// Runs on the server — safe to use Supabase service operations here.

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ── Types ────────────────────────────────────────────────────

export type AuthError = {
  message: string
  field?: 'email' | 'password' | 'name' | 'general'
}

export type AuthResult = {
  error: AuthError | null
}

// ── Signup ───────────────────────────────────────────────────

export async function signUp(state: AuthResult, formData: FormData): Promise<AuthResult> {
  const email    = (formData.get('email')    as string)?.trim()
  const password = (formData.get('password') as string)?.trim()
  const name     = (formData.get('name')     as string)?.trim()

  // Basic validation
  if (!name || name.length < 2) {
    return { error: { message: 'Please enter your full name.', field: 'name' } }
  }
  if (!email || !email.includes('@')) {
    return { error: { message: 'Please enter a valid email address.', field: 'email' } }
  }
  if (!password || password.length < 8) {
    return { error: { message: 'Password must be at least 8 characters.', field: 'password' } }
  }

  const supabase = await createClient()

  // Step 1: Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Pass name in metadata so it's available before DB write
      data: { name },
    },
  })

  if (authError) {
    console.error('[signUp] auth error:', authError.message)
    let message = 'Could not create account. Please try again.'
    let field: AuthError['field'] = 'general'

    if (authError.message.toLowerCase().includes('already registered')) {
      message = 'An account with this email already exists.'
      field = 'email'
    } else if (authError.message.toLowerCase().includes('rate limit')) {
      message = 'Too many signup attempts. Please wait a few minutes before trying again.'
    }

    return {
      error: { message, field },
    }
  }

  // Clear session to prevent auto-login after signup
  // This ensures the user must manually log in.
  await supabase.auth.signOut()

  redirect('/login?signup=success')
}

// ── Login ────────────────────────────────────────────────────

export async function logIn(state: AuthResult, formData: FormData): Promise<AuthResult> {
  const email    = (formData.get('email')    as string)?.trim()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !email.includes('@')) {
    return { error: { message: 'Please enter a valid email address.', field: 'email' } }
  }
  if (!password) {
    return { error: { message: 'Please enter your password.', field: 'password' } }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    console.error('[logIn] auth error:', error.message)
    
    let message = 'Login failed. Please try again.'
    if (error.message.toLowerCase().includes('invalid')) {
      message = 'Incorrect email or password.'
    } else if (error.message.toLowerCase().includes('email not confirmed')) {
      message = 'Please confirm your email before logging in. Check your inbox for the verification link.'
    }

    return {
      error: {
        message,
        field: 'general',
      },
    }
  }

  redirect('/dashboard')
}

// ── Logout ───────────────────────────────────────────────────

export async function logOut(formData: FormData): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
