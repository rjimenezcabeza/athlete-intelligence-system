'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ImportCard from '@/components/import/ImportCard'

interface ImportRecord {
  id: string
  original_filename: string
  file_type: string
  import_status: string
  extraction_confidence: number | null
  uploaded_at: string
}

const STATUS: Record<string, { es: string; en: string; color: string }> = {
  pending:         { es: 'Pendiente',   en: 'Pending',    color: '#666' },
  processing:      { es: 'Procesando',  en: 'Processing', color: '#FBBF24' },
  review_required: { es: 'En revision', en: 'In review',  color: '#60A5FA' },
  approved:        { es: 'Importado',   en: 'Imported',   color: '#C8FF00' },
  error:           { es: 'Error',       en: 'Error',      color: '#FF6B6B' },
}

export default function ImportPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'es'
  const isEs = locale === 'es'
  const [imports, setImports] = useState<ImportRecord[]>([])

  const load = async () => {
    const res = await fetch('/api/import/list')
    const data = await res.json()
    setImports(data.imports || [])
  }

  useEffect(() => { load() }, [])

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0A0A0F' }}>
      <div className="px-4 pt-8 pb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#fff', fontFamily: 'Syne, sans-serif' }}>
          {isEs ? 'Importador IA' : 'AI Importer'}
        </h1>
        <p className="text-sm" style={{ color: '#666' }}>
          {isEs
            ? 'Pasa cualquier registro y la IA lo estructura automaticamente'
            : 'Pass any record and AI structures it automatically'}
        </p>
      </div>

      <div className="px-4 space-y-6">
        <ImportCard locale={locale} onImportComplete={load} />

        {imports.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#555' }}>
              {isEs ? 'Importaciones recientes' : 'Recent imports'}
            </p>
            <div className="space-y-2">
              {imports.map(imp => {
                const cfg = STATUS[imp.import_status] ?? STATUS.pending
                const conf = imp.extraction_confidence ? `${Math.round(imp.extraction_confidence * 100)}%` : ''
                return (
                  <div key={imp.id} className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: '#111118', border: '1px solid #1a1a2e' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
                      style={{ background: '#1a1a2e', color: '#888' }}>
                      {imp.file_type === 'image' ? 'IMG' : imp.file_type.toUpperCase().slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: '#ddd' }}>{imp.original_filename}</p>
                      <p className="text-xs" style={{ color: '#555' }}>
                        {new Date(imp.uploaded_at).toLocaleDateString()}{conf ? ` · ${conf}` : ''}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: cfg.color, background: cfg.color + '15' }}>
                      {isEs ? cfg.es : cfg.en}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
