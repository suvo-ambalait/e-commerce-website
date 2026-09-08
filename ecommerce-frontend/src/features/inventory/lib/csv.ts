import type { Product } from '@/shared/types'

const HEADER = ['SKU', 'Product', 'Vendor', 'On hand', 'Reorder point']

function escape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function toCsv(products: Product[], vendorName: (vendorId: string) => string): string {
  const lines = [HEADER.join(',')]
  for (const p of products) {
    lines.push(
      [
        p.sku,
        escape(p.name),
        escape(vendorName(p.vendorId)),
        String(p.stock),
        String(p.reorderPoint ?? ''),
      ].join(','),
    )
  }
  return lines.join('\n')
}

export interface CsvRow {
  sku: string
  onHand?: number
  reorderPoint?: number
}

export interface CsvParseResult {
  rows: CsvRow[]
  errors: string[]
}

/** Tolerant parser — splits on commas (respecting quotes), matches columns by header name. */
export function parseCsv(text: string): CsvParseResult {
  const errors: string[] = []
  const rows: CsvRow[] = []
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '')
  if (lines.length < 2) {
    return { rows, errors: ['File has no data rows.'] }
  }

  const header = splitLine(lines[0]).map((h) => h.trim().toLowerCase())
  const skuIdx = header.findIndex((h) => h === 'sku')
  const onHandIdx = header.findIndex((h) => h === 'on hand' || h === 'onhand' || h === 'stock')
  const reorderIdx = header.findIndex((h) => h.startsWith('reorder'))
  if (skuIdx === -1) return { rows, errors: ['No "SKU" column found in the header row.'] }

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i])
    const sku = (cells[skuIdx] ?? '').trim()
    if (!sku) {
      errors.push(`Row ${i + 1}: missing SKU — skipped.`)
      continue
    }
    const row: CsvRow = { sku }
    if (onHandIdx !== -1 && cells[onHandIdx]?.trim()) {
      const n = Number(cells[onHandIdx])
      if (Number.isFinite(n) && n >= 0) row.onHand = Math.round(n)
      else errors.push(`Row ${i + 1} (${sku}): invalid "On hand" value.`)
    }
    if (reorderIdx !== -1 && cells[reorderIdx]?.trim()) {
      const n = Number(cells[reorderIdx])
      if (Number.isFinite(n) && n >= 0) row.reorderPoint = Math.round(n)
      else errors.push(`Row ${i + 1} (${sku}): invalid "Reorder point" value.`)
    }
    rows.push(row)
  }
  return { rows, errors }
}

function splitLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        cur += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
