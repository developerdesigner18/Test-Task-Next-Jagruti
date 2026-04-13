'use client'

import { useState, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-toastify'
import type { ProductRow, ProductPrintTypeRow, PrintType, DesignDirection, OrderType, OrderRow } from '@/lib/types/database'

interface ProductWithPrints extends ProductRow {
  product_print_types: ProductPrintTypeRow[]
}

interface NewOrderWizardProps {
  products: ProductWithPrints[]
}

export default function NewOrderWizard({ products }: NewOrderWizardProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [orderType, setOrderType] = useState<OrderType>('group_order')
  const [eventName, setEventName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const [frontDesc, setFrontDesc] = useState('')
  const [backDesc, setBackDesc] = useState('')
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)
  const [designDirection, setDesignDirection] = useState<DesignDirection>('use_as_inspiration')
  const [selectedPrint, setSelectedPrint] = useState<PrintType | null>(null)

  const selectedProduct = products.find(p => p.id === selectedProductId)

  const handleNext = () => setStep(s => s + 1)
  const handleBack = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authorization required')

      let frontPath: string | null = null
      let backPath: string | null = null

      if (frontFile) {
        const fileName = `${user.id}/${Date.now()}_front_${frontFile.name}`
        const { data, error } = await supabase.storage.from('design-files').upload(fileName, frontFile)
        if (error) throw error
        frontPath = data?.path ?? null
      }

      if (backFile) {
        const fileName = `${user.id}/${Date.now()}_back_${backFile.name}`
        const { data, error } = await supabase.storage.from('design-files').upload(fileName, backFile)
        if (error) throw error
        backPath = data?.path ?? null
      }

      if (!selectedProductId) throw new Error('Product selection required')

      const orderData = {
        customer_id: user.id,
        event_name: eventName,
        due_date: dueDate,
        order_type: orderType,
        status: 'new',
        front_design_description: frontDesc,
        back_design_description: backDesc,
        front_design_file_path: frontPath,
        back_design_file_path: backPath,
        design_direction: designDirection,
        selected_print_type: selectedPrint
      }

      const { data: orderResponse, error: orderError } = await supabase
        .from('orders')
        .insert(orderData as any)
        .select()
        .single()

      const order = orderResponse as OrderRow | null

      if (orderError || !order) throw orderError || new Error('Failed to create order')

      const { error: productError } = await supabase.from('order_products').insert({
        order_id: order.id,
        product_id: selectedProductId,
        quantity: 24,
        unit_price: selectedProduct?.starting_price || 0
      } as any)

      if (productError) throw productError

      toast.success('🎉 Order placed successfully!')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
      <div className="bg-white border-b border-slate-100 px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm z-10 sticky top-0 relative overflow-hidden">
         {/* Top Progress Bar */}
         <div 
           className="absolute top-0 left-0 h-1 transition-all duration-700 ease-in-out bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" 
           style={{ width: `${(step / 3) * 100}%` }} 
         />
         
         <div className="flex items-center gap-4">
            <StepIndicator step={1} label="Product" active={step >= 1} current={step === 1} />
            <div className={`hidden md:block w-10 h-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-slate-100'}`} />
            <StepIndicator step={2} label="Design" active={step >= 2} current={step === 2} />
            <div className={`hidden md:block w-10 h-1 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-slate-100'}`} />
            <StepIndicator step={3} label="Details" active={step >= 3} current={step === 3} />
         </div>
         <div className="flex items-center justify-center bg-slate-50/80 backdrop-blur-sm px-5 py-2.5 rounded-2xl border border-slate-200/60 shadow-inner">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
               Step {step} <span className="text-slate-300">/</span> 3
            </span>
         </div>
      </div>

      <div className="p-10 min-h-[500px] animate-fade-in">
        {step === 1 && (
          <div className="space-y-10 animate-fade-in">
             <div className="text-center space-y-3 mb-10">
               <h3 className="font-black text-3xl text-slate-900 tracking-tight">Project Foundation</h3>
               <p className="text-slate-500 font-medium">Start by selecting your event specifics and your favorite base apparel.</p>
             </div>

             <div className="space-y-5">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2">Payment Type</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <SelectionCard 
                    active={orderType === 'group_order'} 
                    onClick={() => setOrderType('group_order')} 
                    label="Group Order" 
                    desc="One person pays for the entire bulk order" 
                  />
                  <SelectionCard 
                    active={orderType === 'get_a_link'} 
                    onClick={() => setOrderType('get_a_link')} 
                    label="Get a Link" 
                    desc="We'll generate a link for everyone to pay individually" 
                  />
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                <Input 
                  label="Event Name" 
                  value={eventName} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEventName(e.target.value)} 
                  placeholder="e.g. Summer Rush 2025" 
                />
                <Input 
                  label="Target Date" 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={dueDate} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)} 
                />
             </div>
             <div className="space-y-5">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2">Choose your base product</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                   {products.map(p => (
                     <ProductCard 
                        key={p.id} 
                        product={p} 
                        active={selectedProductId === p.id} 
                        onClick={() => setSelectedProductId(p.id)} 
                      />
                   ))}
                </div>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-fade-in">
             <div className="text-center space-y-3 mb-10">
               <h3 className="font-black text-3xl text-slate-900 tracking-tight">Design Details</h3>
               <p className="text-slate-500 font-medium">Upload references and let our designers know what you'd like to see.</p>
             </div>

             <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-3xl space-y-8">
               <div className="space-y-3">
                 <label className="text-sm font-black text-slate-800 tracking-tight px-1 flex items-center gap-1">
                    Front Description <span className="text-red-500 text-lg leading-none">*</span>
                 </label>
                 <textarea 
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl p-5 text-sm text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all min-h-[160px] resize-y hover:border-slate-300 shadow-sm"
                  placeholder="Describe your vision in detail. E.g., 'Make the logo bold across the chest with a vintage fade effect...'"
                  value={frontDesc}
                  onChange={(e) => setFrontDesc(e.target.value)}
                 />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FileUpload label="Front Mockup / Reference *" onFile={setFrontFile} fileName={frontFile?.name} />
                  <FileUpload label="Back Mockup (Optional)" onFile={setBackFile} fileName={backFile?.name} />
               </div>
             </div>

             <div className="space-y-5">
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest px-2">Design Direction</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   <SelectionCard 
                    active={designDirection === 'copy_exactly'} 
                    onClick={() => setDesignDirection('copy_exactly')} 
                    label="Copy Exactly" 
                    desc="Stick strictly to the reference provided" 
                   />
                   <SelectionCard 
                    active={designDirection === 'use_as_inspiration'} 
                    onClick={() => setDesignDirection('use_as_inspiration')} 
                    label="Inspiration" 
                    desc="Capture the vibe, but allow artistic freedom" 
                   />
                   <SelectionCard 
                    active={designDirection === 'designers_choice'} 
                    onClick={() => setDesignDirection('designers_choice')} 
                    label="Designer's Choice" 
                    desc="Let us get fully creative with it" 
                   />
                </div>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-fade-in">
             <div className="text-center space-y-3">
               <h3 className="font-black text-3xl text-slate-900 tracking-tight">Select Print Method</h3>
               <p className="text-slate-500 font-medium max-w-lg mx-auto">Choose the perfect decoration style for your project. Our production team will review to ensure the best outcome.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedProduct?.product_print_types.map(pt => (
                   <PrintTypeCard 
                    key={pt.print_type} 
                    type={pt.print_type} 
                    active={selectedPrint === pt.print_type} 
                    onClick={() => setSelectedPrint(pt.print_type)} 
                    min={pt.min_quantity} 
                  />
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 p-8 border-t border-slate-100 flex items-center justify-between">
         <Button variant="ghost" onClick={handleBack} disabled={step === 1 || isSubmitting}>← Back</Button>
         {step === 1 && (
           <Button onClick={handleNext} disabled={!selectedProductId || !eventName || !dueDate}>Continue to Design →</Button>
         )}
         {step === 2 && (
           <Button onClick={handleNext} disabled={!frontDesc || !frontFile || !designDirection}>Continue to Details →</Button>
         )}
         {step === 3 && (
           <Button onClick={handleSubmit} loading={isSubmitting} disabled={!selectedPrint}>Submit My Order</Button>
         )}
      </div>
    </div>
  )
}

interface StepIndicatorProps {
  step: number
  label: string
  active: boolean
  current: boolean
}

function StepIndicator({ step, label, active, current }: StepIndicatorProps) {
  const completed = active && !current
  
  const stepConfigs = {
    1: { active: 'bg-blue-600 ring-blue-100 text-white', text: 'text-blue-600', completed: 'bg-blue-500' },
    2: { active: 'bg-indigo-600 ring-indigo-100 text-white', text: 'text-indigo-600', completed: 'bg-indigo-500' },
    3: { active: 'bg-violet-600 ring-violet-100 text-white', text: 'text-violet-600', completed: 'bg-violet-500' }
  }[step as 1|2|3]
  
  return (
    <div className={`flex items-center gap-3 transition-all duration-300 ${active ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-0 grayscale'}`}>
      <div 
        className={`w-9 h-9 rounded-2xl flex items-center justify-center text-[12px] font-black transition-all duration-500 transform
        ${current ? `${stepConfigs.active} shadow-xl shadow-blue-500/20 scale-110 ring-4` : 
          completed ? `${stepConfigs.completed} text-white shadow-md` : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
      >
        {completed ? '✓' : step}
      </div>
      <div className="flex flex-col">
        <span 
          className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 
          ${current ? stepConfigs.text : completed ? 'text-slate-600' : 'text-slate-400'}`}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

interface SelectionCardProps {
  label: string
  desc: string
  active: boolean
  onClick: () => void
}

function SelectionCard({ label, desc, active, onClick }: SelectionCardProps) {
  return (
    <div 
      onClick={onClick} 
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
        active 
          ? 'border-blue-600 bg-blue-50/40 shadow-lg shadow-blue-500/10 ring-4 ring-blue-50 scale-[1.02]' 
          : 'border-slate-200 bg-slate-50/50 hover:border-blue-300 hover:bg-white hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
         <p className={`font-black text-base tracking-tight ${active ? 'text-blue-600' : 'text-slate-900 group-hover:text-blue-600'}`}>{label}</p>
         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${active ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
            {active && <span className="text-[10px] font-bold">✓</span>}
         </div>
      </div>
      <p className={`text-xs font-medium leading-relaxed pr-6 ${active ? 'text-blue-800/70' : 'text-slate-500'}`}>{desc}</p>
    </div>
  )
}

interface ProductCardProps {
  product: ProductRow
  active: boolean
  onClick: () => void
}

function ProductCard({ product, active, onClick }: ProductCardProps) {
  return (
    <div onClick={onClick} className={`p-5 rounded-[32px] border-2 text-center transition-all duration-300 cursor-pointer group ${active ? 'border-blue-600 bg-blue-50/30 shadow-lg shadow-blue-500/10 ring-4 ring-blue-50 scale-[1.02]' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}`}>
      <div className="aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-105 transition-transform duration-500">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl filter drop-shadow-sm">👕</span>
        )}
      </div>
      <p className={`text-[11px] font-black uppercase tracking-tight ${active ? 'text-blue-700' : 'text-slate-800'}`}>{product.name}</p>
      <p className={`text-[10px] font-bold mt-1 ${active ? 'text-blue-500' : 'text-slate-400'}`}>From ${product.starting_price}</p>
    </div>
  )
}

interface FileUploadProps {
  label: string
  onFile: (file: File | null) => void
  fileName?: string
}

function FileUpload({ label, onFile, fileName }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB')
      e.target.value = ''
      return
    }
    onFile(file || null)
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-black text-slate-800 tracking-tight px-1 flex items-center gap-1">
        {label}
      </label>
      <div 
        className={`relative h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center group transition-all duration-300 overflow-hidden ${
          dragActive ? 'border-blue-500 bg-blue-50/50 scale-[1.02] shadow-md shadow-blue-500/10' : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/80 hover:shadow-sm'
        }`}
        onDragEnter={() => setDragActive(true)}
        onDragLeave={() => setDragActive(false)}
        onDrop={() => setDragActive(false)}
      >
        <input 
          type="file" 
          accept="image/*,.pdf,.ai,.psd"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={handleFileChange} 
        />
        <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center mb-4 transition-all duration-300 ${fileName ? 'bg-emerald-100 text-emerald-600 shadow-inner' : 'bg-slate-50 shadow-sm border border-slate-100 text-blue-500 group-hover:scale-110 group-hover:bg-white group-hover:rotate-3'}`}>
           {fileName ? '📄' : '📁'}
        </div>
        <p className={`text-xs font-black z-0 transition-colors uppercase tracking-widest ${fileName ? 'text-emerald-700' : 'text-slate-500 group-hover:text-blue-700'}`}>
          {fileName || 'Click to Upload'}
        </p>
        {!fileName && <p className="text-[10px] text-slate-400 font-medium mt-1">Max 5MB (PNG, JPG, PDF)</p>}
      </div>
    </div>
  )
}

interface PrintTypeCardProps {
  type: PrintType
  active: boolean
  onClick: () => void
  min: number
}

function PrintTypeCard({ type, active, onClick, min }: PrintTypeCardProps) {
  const details = getPrintTypeDetails(type)
  return (
    <div 
      onClick={onClick} 
      className={`relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 group overflow-hidden ${
        active 
          ? 'border-blue-600 shadow-xl shadow-blue-500/20 bg-white ring-4 ring-blue-50 scale-[1.02]' 
          : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-lg'
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full blur-3xl opacity-20 transition-all duration-700 ${active ? 'bg-blue-600 scale-150' : 'bg-slate-400 group-hover:bg-slate-500'}`} />
      
      <div className="relative z-10 flex flex-col h-full">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner transition-colors duration-500 ${active ? 'bg-blue-50' : 'bg-white'}`}>
           {details.icon}
        </div>
        <h4 className={`font-black text-lg mb-2 capitalize tracking-tight ${active ? 'text-blue-600' : 'text-slate-900'}`}>
          {details.title}
        </h4>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8 flex-1">
          {details.desc}
        </p>
        
        <div className={`mt-auto inline-flex items-center self-start px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/60 text-slate-500'}`}>
          Min: {min} units
        </div>
      </div>
      
      {active && (
        <div className="absolute top-6 right-6 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md animate-in zoom-in spin-in-12 duration-300">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
        </div>
      )}
    </div>
  )
}

function getPrintTypeDetails(type: string) {
  switch (type) {
    case 'screen_print': return { icon: '👕', title: 'Screen Print', desc: 'Classic, durable ink pressed through a mesh screen. Best for vibrant, long-lasting bulk orders.' }
    case 'embroidery': return { icon: '🪡', title: 'Embroidery', desc: 'Premium stitched threading for a professional 3D look. Perfect for hats, polos, and jackets.' }
    case 'puff_print': return { icon: '☁️', title: 'Puff Print', desc: 'Specialty raised ink that creates a unique, tactile 3D effect on the fabric.' }
    case 'foil': return { icon: '✨', title: 'Metallic Foil', desc: 'Shiny, reflective finish pressed onto the fabric. Great for high-impact, flashy designs.' }
    case 'dye_sublimation': return { icon: '🌈', title: 'Dye Sublimation', desc: 'Full-color, all-over printing that fuses directly with poly-blend fabrics.' }
    default: return { icon: '🎨', title: type.replace('_', ' '), desc: 'Custom high-quality printing tailored for your specific apparel.' }
  }
}
