'use client'

import { useState, useRef } from 'react'

interface Props {
  currentUrl?: string | null
  displayName?: string
  locale?: string
  onUploadComplete?: (url: string) => void
}

export function AvatarUpload({ currentUrl, displayName, locale = 'es', onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isEs = locale === 'es'

  const initials = displayName
    ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return
    setUploading(true)

    try {
      // Immediate local preview
      const reader = new FileReader()
      reader.onload = e => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)

      const signedRes = await fetch('/api/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type })
      })
      if (!signedRes.ok) throw new Error('Failed to get upload URL')
      const { signedUrl, publicUrl } = await signedRes.json()

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      await fetch('/api/profile/avatar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: publicUrl })
      })

      onUploadComplete?.(publicUrl)
    } catch (err) {
      console.error('Avatar upload error:', err)
      setPreview(currentUrl || null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: '76px', height: '76px', borderRadius: '50%', overflow: 'hidden', background: preview ? 'transparent' : 'rgba(200,255,0,0.15)', border: '2px solid rgba(200,255,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {preview ? (
            <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: '26px', fontWeight: '700', color: '#C8FF00', fontFamily: 'Syne, sans-serif' }}>{initials}</span>
          )}
        </div>
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#C8FF00', borderRadius: '50%', animation: '_spin 0.8s linear infinite' }} />
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', fontFamily: 'Syne, sans-serif', marginBottom: '6px' }}>
          {displayName || (isEs ? 'Atleta' : 'Athlete')}
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{ padding: '7px 14px', background: 'rgba(200,255,0,0.1)', border: '1px solid rgba(200,255,0,0.25)', borderRadius: '8px', color: '#C8FF00', fontSize: '12px', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'DM Mono, monospace', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? (isEs ? 'Subiendo...' : 'Uploading...') : (isEs ? 'Cambiar foto' : 'Change photo')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
        <div style={{ fontSize: '10px', color: '#444', fontFamily: 'DM Mono, monospace', marginTop: '4px' }}>
          JPG, PNG, WEBP · max 5MB
        </div>
      </div>
    </div>
  )
}
