import { useRef, useState, type DragEvent } from 'react'
import { cn } from '@/shared/lib/cn'
import { CloseIcon, UploadIcon, ChevronLeftIcon, ChevronRightIcon } from './icons'

/** Downscale + re-encode a picked file to a compact data URL for localStorage. */
function fileToDataUrl(file: File, maxEdge = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no canvas'))
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function ImageUploader({
  value,
  onChange,
  max = 6,
  aspect = 'aspect-square',
}: {
  value: string[]
  onChange: (next: string[]) => void
  max?: number
  aspect?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const addFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, max - value.length)
    if (!list.length) return
    setBusy(true)
    try {
      const urls = await Promise.all(list.map((f) => fileToDataUrl(f)))
      onChange([...value, ...urls])
    } finally {
      setBusy(false)
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) void addFiles(e.dataTransfer.files)
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={src.slice(0, 32) + i} className={cn('group relative overflow-hidden rounded-md border border-border bg-surface-sunken', aspect)}>
            <img src={src} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-wide text-bg">
                Cover
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button type="button" onClick={() => move(i, i - 1)} className="rounded bg-surface/90 p-1 text-ink" aria-label="Move left">
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => move(i, i + 1)} className="rounded bg-surface/90 p-1 text-ink" aria-label="Move right">
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label="Remove image"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              'flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-caption transition-colors',
              aspect,
              dragOver ? 'border-accent bg-accent-soft text-accent' : 'border-border-strong text-ink-mute hover:border-ink hover:text-ink',
            )}
          >
            {busy ? (
              'Processing…'
            ) : (
              <>
                <UploadIcon className="h-5 w-5" />
                Upload
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) void addFiles(e.target.files)
          e.target.value = ''
        }}
      />

      <div className="mt-2 flex gap-2">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="…or paste an image URL"
          className="h-9 flex-1 rounded-sm border border-border-strong bg-surface px-3 text-caption text-ink outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={() => {
            if (urlDraft.trim() && value.length < max) {
              onChange([...value, urlDraft.trim()])
              setUrlDraft('')
            }
          }}
          className="h-9 shrink-0 rounded-sm border border-border-strong px-3 text-caption text-ink-soft hover:border-ink"
        >
          Add
        </button>
      </div>
      <p className="mt-1 text-caption text-ink-mute">
        {value.length}/{max} · first image is the cover · drag tiles to reorder
      </p>
    </div>
  )
}
