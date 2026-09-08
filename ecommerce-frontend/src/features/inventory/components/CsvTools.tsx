import { useRef, useState } from 'react'
import { Button, Modal, Textarea } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import type { Product } from '@/shared/types'
import { useVendors } from '@/features/vendor/context/VendorContext'
import { useInventory } from '../context/InventoryContext'
import { downloadCsv, toCsv } from '../lib/csv'

export function CsvTools({ products, allowImport }: { products: Product[]; allowImport: boolean }) {
  const { getVendor } = useVendors()
  const { importCsv } = useInventory()
  const { notify } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ updated: number; errors: string[] } | null>(null)

  const exportNow = () => {
    const csv = toCsv(products, (id) => getVendor(id)?.name ?? '')
    downloadCsv(`morerdokan-inventory-${new Date().toISOString().slice(0, 10)}.csv`, csv)
    notify('Inventory exported', 'success')
  }

  const runImport = () => {
    if (!text.trim()) return
    const res = importCsv(text)
    setResult(res)
    if (res.updated > 0) notify(`Updated ${res.updated} product${res.updated === 1 ? '' : 's'}`, 'success')
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="secondary" onClick={exportNow}>
        Export CSV
      </Button>
      {allowImport && (
        <Button size="sm" variant="secondary" onClick={() => { setOpen(true); setResult(null) }}>
          Import CSV
        </Button>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Import inventory">
        <div className="space-y-4">
          <p className="text-sm text-ink-soft">
            Paste rows, or choose a file. Products are matched by <strong>SKU</strong>; recognised
            columns are <code className="text-caption">On hand</code> and{' '}
            <code className="text-caption">Reorder point</code>. Changes are logged as corrections.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => setText(String(reader.result ?? ''))
              reader.readAsText(file)
              e.target.value = ''
            }}
          />
          <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
            Choose file…
          </Button>
          <Textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'SKU,On hand,Reorder point\nLUM-0001,40,10'}
            className="font-mono text-caption"
          />

          {result && (
            <div className="rounded-md bg-surface-sunken p-3 text-caption">
              <p className="text-ink">Updated {result.updated} product{result.updated === 1 ? '' : 's'}.</p>
              {result.errors.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-danger">
                  {result.errors.slice(0, 8).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {result.errors.length > 8 && <li>+ {result.errors.length - 8} more</li>}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={runImport}>Apply import</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
