'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import Button from '@/components/ui/button'

export default function SimulateProofButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSimulate = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/debug/simulate-proof?id=${orderId}`)
      if (res.ok) {
        toast.success('Mock designs generated!')
        router.refresh()
      } else {
        toast.error('Simulation failed')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSimulate} 
      loading={loading}
      className="bg-slate-900 text-white hover:bg-slate-800 h-12 px-8 rounded-xl font-black text-xs shadow-lg shadow-slate-200"
    >
      Generate Mock Proofs →
    </Button>
  )
}
