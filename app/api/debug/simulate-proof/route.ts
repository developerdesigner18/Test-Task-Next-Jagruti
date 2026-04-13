import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Database, OrderRow } from '@/lib/types/database'

type ProofInsert = Database['public']['Tables']['proofs']['Insert']

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const targetId = searchParams.get('id')
  const supabase = await createAdminClient()

  try {
    let order: OrderRow | null = null

    if (targetId) {
      const { data, error } = await supabase.from('orders').select('*').eq('id', targetId).single()
      if (error) throw error
      order = data as OrderRow
    } else {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (error) throw error
      order = data as OrderRow
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Force cast to any to bypass the 'never' inference issue
    await (supabase.from('orders') as any)
      .update({ status: 'proof_ready' })
      .eq('id', order.id)

    const proofData: ProofInsert = {
      order_id: order.id,
      product_id: '0178be40-f549-5578-b01c-6c3649ae7a61',
      proof_number: 1,
      color: 'Navy Blue',
      print_type: 'screen_print',
      est_ship_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      mockup_image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800&h=1000',
      price_tiers: [
        { min_qty: 12, price_per_unit: 18.50 },
        { min_qty: 36, price_per_unit: 14.20 },
        { min_qty: 72, price_per_unit: 11.80 }
      ] as any
    }

    // Clean up existing proofs for a fresh simulation
    await supabase.from('proofs').delete().eq('order_id', order.id)

    const { data: proof, error: proofError } = await (supabase.from('proofs') as any)
      .insert(proofData)
      .select()
      .single()

    if (proofError) throw proofError

    return NextResponse.json({
      success: true,
      message: `Simulated proof for order "${order.event_name}"`,
      order_id: order.id,
      proof_id: (proof as any)?.id
    })
  } catch (err) {
    console.error('[simulate-proof] error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ error: 'Simulation failed' }, { status: 500 })
  }
}
