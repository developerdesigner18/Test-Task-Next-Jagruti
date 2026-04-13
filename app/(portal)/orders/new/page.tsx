// app/(portal)/orders/new/page.tsx
// Order creation wizard page

import { createClient } from '@/lib/supabase/server'
import NewOrderWizard from '@/components/orders/new-order-wizard'

export default async function NewOrderPage() {
  const supabase = await createClient()

  // Fetch product catalog for selection
  const { data: products } = await supabase
    .from('products')
    .select('*, product_print_types(*)')
    .order('is_featured', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-8 md:p-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Create New Order</h1>
        <p className="text-slate-500 text-lg">Follow the steps to get your custom apparel project started.</p>
      </div>

      <NewOrderWizard products={products ?? []} />
    </div>
  )
}
