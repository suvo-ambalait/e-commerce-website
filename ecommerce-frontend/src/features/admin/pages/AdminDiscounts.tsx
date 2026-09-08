import { useState, type FormEvent } from 'react'
import { PageHeader, DataTable, type Column } from '../components/primitives'
import { Badge, Button, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useDiscounts, type Discount } from '../context/DiscountsContext'

export function AdminDiscounts() {
  const { discounts, addDiscount, updateDiscount, deleteDiscount } = useDiscounts()
  const { notify } = useToast()
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState('10')

  const create = (e: FormEvent) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase()
    if (!clean) return
    addDiscount({ code: clean, discountPercent: Math.min(90, Number(percent) || 0) / 100, active: true })
    setCode('')
    notify('Discount created', 'success')
  }

  const columns: Column<Discount>[] = [
    { header: 'Code', cell: (d) => <span className="font-medium tracking-wide text-ink">{d.code}</span> },
    { header: 'Value', cell: (d) => `${Math.round(d.discountPercent * 100)}% off` },
    {
      header: 'Status',
      cell: (d) => (
        <button type="button" onClick={() => updateDiscount(d.code, { ...d, active: !d.active })}>
          <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Paused'}</Badge>
        </button>
      ),
    },
    {
      header: '',
      className: 'text-right',
      cell: (d) => (
        <button
          type="button"
          onClick={() => {
            deleteDiscount(d.code)
            notify('Discount removed')
          }}
          className="text-caption text-ink-mute hover:text-danger"
        >
          Delete
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Discounts" description="Codes apply across every vendor basket at checkout." />

      <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
        <Field label="Code" className="w-40">
          {(id) => <Input id={id} value={code} onChange={(e) => setCode(e.target.value)} placeholder="SPRING20" />}
        </Field>
        <Field label="Percent off" className="w-32">
          {(id) => <Input id={id} type="number" min="1" max="90" value={percent} onChange={(e) => setPercent(e.target.value)} />}
        </Field>
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>

      <DataTable rows={discounts} columns={columns} keyOf={(d) => d.code} />
    </div>
  )
}
