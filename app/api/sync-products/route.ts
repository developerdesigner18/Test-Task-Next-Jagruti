import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Database } from '@/lib/types/database'

type ProductInsert = Database['public']['Tables']['products']['Insert']

const MOCK_EXTERNAL_PRODUCTS: ProductInsert[] = [
  {
    sku: 'TEE-GILDAN-64000',
    name: 'Gildan Softstyle Tee',
    category: 'T-Shirts',
    turnaround_days: 10,
    starting_price: 8.50,
    is_featured: true
  },
  {
    sku: 'HOOD-GILDAN-18500',
    name: 'Gildan Heavy Blend Hoodie',
    category: 'Sweatshirts',
    turnaround_days: 12,
    starting_price: 24.00,
    is_featured: true
  },
  {
    sku: 'HAT-RICHARDSON-112',
    name: 'Richardson 112 Trucker Hat',
    category: 'Headwear',
    turnaround_days: 14,
    starting_price: 18.00,
    is_featured: false
  }
]

export async function GET() {
  const supabase = await createAdminClient()

  try {
    const productsToUpsert = MOCK_EXTERNAL_PRODUCTS.map(p => ({
      ...p,
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('products')
      .upsert(productsToUpsert as any, { onConflict: 'sku' })
      .select()

    if (error) throw error

    return NextResponse.json({ 
      success: true, 
      synced_count: data?.length || 0,
      message: 'Catalog synchronized successfully.'
    })
  } catch (err) {
    console.error('[api/sync-products] error:', err instanceof Error ? err.message : 'Unknown error')
    return NextResponse.json({ 
      success: false, 
      error: 'Synchronization failed' 
    }, { status: 500 })
  }
}
