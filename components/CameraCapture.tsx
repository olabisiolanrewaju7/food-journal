'use client'

import { useRef, useState } from 'react'
import { Camera, ImagePlus, X, Loader2, Zap } from 'lucide-react'
import { FoodAnalysis } from '@/types'

export default function CameraCapture({ onAnalysis, onPreviewChange }: { onAnalysis: (a: FoodAnalysis, img: string) => void; onPreviewChange?: (hasPreview: boolean) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    setError(null)
    const reader = new FileReader()
    reader.onload = e => { setPreview(e.target?.result as string); onPreviewChange?.(true) }
    reader.readAsDataURL(file)
  }

  async function analyze() {
    if (!preview) return
    setAnalyzing(true); setError(null)
    try {
      const [header, base64] = preview.split(',')
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      })
      if (!res.ok) throw new Error()
      onAnalysis(await res.json(), preview)
      setPreview(null); onPreviewChange?.(false)
    } catch { setError('Could not analyze image. Please try again.') }
    finally { setAnalyzing(false) }
  }

  function reset() {
    setPreview(null); setError(null); onPreviewChange?.(false)
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(26,61,43,0.12)' }}>
        <img src={preview} alt="Food" className="w-full max-h-72 object-cover" />
        {analyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
            style={{ background: 'rgba(26,61,43,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
            <p className="text-white font-semibold text-sm">Analyzing your food...</p>
          </div>
        )}
        {!analyzing && (
          <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2"
            style={{ background: 'linear-gradient(to top, rgba(26,61,43,0.85), transparent)' }}>
            <button onClick={reset}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              <X className="w-4 h-4" /> Retake
            </button>
            <button onClick={analyze}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #004d1a, #00c853)' }}>
              <Zap className="w-4 h-4" /> Analyze Food
            </button>
          </div>
        )}
        {error && (
          <div className="absolute top-3 left-3 right-3 text-white text-xs p-3 rounded-xl font-medium"
            style={{ background: '#e11d48' }}>{error}</div>
        )}
      </div>
    )
  }

  return (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      <div className="space-y-2.5">
        <button onClick={() => cameraRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-white font-bold text-base active:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #004d1a 0%, #00c853 100%)', boxShadow: '0 4px 20px rgba(26,61,43,0.3)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <Camera className="w-5 h-5" />
          </div>
          Take Photo of Food
        </button>
        <button onClick={() => galleryRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold active:opacity-80 transition-opacity"
          style={{ background: 'white', color: '#9c8e7e', border: '1.5px dashed #d8cfc4', boxShadow: '0 2px 8px rgba(26,61,43,0.06)' }}>
          <ImagePlus className="w-4 h-4" />
          Upload from Gallery
        </button>
      </div>
    </>
  )
}
