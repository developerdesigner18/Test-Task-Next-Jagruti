'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/lib/types/database'

type RevisionInsert = Database['public']['Tables']['revision_requests']['Insert']

export async function approveProof(proofId: string, orderId: string) {
  const supabase = await createClient()

  const { error: proofError } = await (supabase.from('proofs') as any)
    .update({ status: 'approved' })
    .eq('id', proofId)

  if (proofError) {
    throw new Error(proofError.message)
  }

  // Fetch all proofs for this order to check if ALL are approved
  const { data: allProofs, error: checkError } = await (supabase.from('proofs') as any)
    .select('status')
    .eq('order_id', orderId)

  if (!checkError && allProofs) {
    const allApproved = allProofs.every((p: any) => p.status === 'approved')
    
    // Automatically update the parent order status ONLY when the customer approves ALL proofs
    if (allApproved) {
      await (supabase.from('orders') as any)
        .update({ status: 'approved' })
        .eq('id', orderId)
    }
  }

  revalidatePath(`/orders/${orderId}/proofs`)
  revalidatePath(`/dashboard`)
}

export async function submitRevision(proofId: string, orderId: string, notes: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const revisionData: RevisionInsert = {
    proof_id: proofId,
    customer_id: user.id,
    notes
  }

  const { error: revError } = await supabase
    .from('revision_requests')
    .insert(revisionData as any)

  if (revError) throw new Error(revError.message)

  const { error: proofError } = await (supabase
    .from('proofs') as any)
    .update({ status: 'revision_requested' })
    .eq('id', proofId)

  if (proofError) throw new Error(proofError.message)

  revalidatePath(`/orders/${orderId}/proofs`)
}
