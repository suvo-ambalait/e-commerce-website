import { useState, type FormEvent } from 'react'
import { LuCopy, LuPause, LuPlay, LuPlus, LuTicketPercent, LuTrash2 } from 'react-icons/lu'
import { PageHeader, Panel, DataTable, BulkButton, type Column } from '../components/primitives'
import { Pill, TableSearch, TableTabs, TableToolbar, ExportButton, downloadCsv } from '../components/TableKit'
import { Button, Field, Input } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { useDiscounts, type Discount } from '../context/DiscountsContext'

type Tab = 'all' | 'active' | 'paused'

export function AdminDiscounts() {
  const { discounts, addDiscount, updateDiscount, deleteDiscount } = useDiscounts()
  const { notify } = useToast()
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState('10')
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<string[]>([])

  const create = (e: FormEvent) => {
    e.preventDefault()
    const clean = code.trim().toUpperCase().replace(/\s+/g, '')
    if (!clean) return
    if (discounts.some((d) => d.code === clean)) {
      notify(`${clean} already exists`)
      return
    }
    addDiscount({ code: clean, discountPercent: Math.min(90, Math.max(1, Number(percent) || 0)) / 100, active: true })
    setCode('')
    notify(`${clean} created`, 'success')
  }

  const setActive = (codes: string[], active: boolean) => {
    codes.forEach((c) => {
      const d = discounts.find((x) => x.code === c)
      if (d) updateDiscount(c, { ...d, active })
    })
    notify(`${active ? 'Activated' : 'Paused'} ${codes.length} code${codes.length > 1 ? 's' : ''}`, 'success')
  }

  const rows = discounts.filter((d) => {
    if (tab === 'active' && !d.active) return false
    if (tab === 'paused' && d.active) return false
    return !search.trim() || d.code.toLowerCase().includes(search.trim().toLowerCase())
  })
  const activeCount = discounts.filter((d) => d.active).length

  const columns: Column<Discount>[] = [
    {
      header: 'Code',
      id: 'code',
      sortValue: (d) => d.code,
      cell: (d) => (
        <span className="inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <LuTicketPercent className="h-4 w-4" />
          </span>
          <span className="rounded-lg border border-dashed border-accent/40! bg-accent-soft/40 px-2 py-0.5 font-mono text-sm font-bold tracking-wider text-ink">
            {d.code}
          </span>
        </span>
      ),
    },
    {
      header: 'Value',
      id: 'value',
      align: 'right',
      sortValue: (d) => d.discountPercent,
      cell: (d) => <span className="font-display text-base font-bold text-ink">{Math.round(d.discountPercent * 100)}% off</span>,
    },
    {
      header: 'Applies to',
      id: 'scope',
      hideBelow: 'md',
      cell: () => <span className="text-ink-soft">Every studio basket</span>,
    },
    {
      header: 'Status',
      id: 'status',
      sortValue: (d) => (d.active ? 1 : 0),
      cell: (d) =>
        d.active ? (
          <Pill tone="success" dot>
            Active
          </Pill>
        ) : (
          <Pill tone="muted" dot>
            Paused
          </Pill>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader
        title="Discounts"
        description={`${discounts.length} codes · ${activeCount} active · applied across every studio basket at checkout`}
        action={
          <ExportButton
            onClick={() =>
              downloadCsv('discounts.csv', ['code', 'percent_off', 'active'], rows.map((d) => [d.code, Math.round(d.discountPercent * 100), d.active ? 'yes' : 'no']))
            }
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_20rem] xl:items-start">
        <DataTable
          rows={rows}
          columns={columns}
          keyOf={(d) => d.code}
          empty="No codes match."
          toolbar={
            <TableToolbar>
              <TableSearch value={search} onChange={setSearch} placeholder="Search codes" />
              <TableTabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { value: 'all', label: 'All', count: discounts.length },
                  { value: 'active', label: 'Active', count: activeCount },
                  { value: 'paused', label: 'Paused', count: discounts.length - activeCount },
                ]}
              />
            </TableToolbar>
          }
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          defaultSort={{ id: 'code', dir: 'asc' }}
          rowActions={[
            {
              label: 'Copy code',
              icon: LuCopy,
              onClick: (d) => {
                navigator.clipboard?.writeText(d.code)
                notify(`${d.code} copied`)
              },
            },
            { label: 'Pause', icon: LuPause, onClick: (d) => setActive([d.code], false), hidden: (d) => !d.active },
            { label: 'Activate', icon: LuPlay, onClick: (d) => setActive([d.code], true), hidden: (d) => d.active },
            {
              label: 'Delete',
              icon: LuTrash2,
              danger: true,
              onClick: (d) => {
                if (confirm(`Delete ${d.code}?`)) {
                  deleteDiscount(d.code)
                  notify('Discount removed')
                }
              },
            },
          ]}
          bulkBar={(keys, clear) => (
            <>
              <BulkButton icon={LuPlay} onClick={() => { setActive(keys, true); clear() }}>
                Activate
              </BulkButton>
              <BulkButton icon={LuPause} onClick={() => { setActive(keys, false); clear() }}>
                Pause
              </BulkButton>
              <BulkButton
                icon={LuTrash2}
                danger
                onClick={() => {
                  if (confirm(`Delete ${keys.length} code${keys.length > 1 ? 's' : ''}?`)) {
                    keys.forEach(deleteDiscount)
                    notify('Discounts removed')
                    clear()
                  }
                }}
              >
                Delete
              </BulkButton>
            </>
          )}
        />

        <Panel title="New code" subtitle="Works on the whole cart, split across every studio.">
          <form onSubmit={create} className="space-y-4">
            <Field label="Code" required hint="Letters and numbers — saved in capitals">
              {(id) => (
                <Input
                  id={id}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="SPRING20"
                  className="font-mono tracking-wider"
                />
              )}
            </Field>
            <Field label="Percent off" required>
              {(id) => <Input id={id} type="number" min="1" max="90" required value={percent} onChange={(e) => setPercent(e.target.value)} />}
            </Field>
            <div className="flex flex-wrap gap-1.5">
              {[10, 15, 20, 25].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPercent(String(p))}
                  className={
                    'h-8 rounded-lg border px-3 text-caption font-semibold transition-colors ' +
                    (Number(percent) === p ? 'border-accent! bg-accent-soft text-accent' : 'border-border text-ink-soft hover:border-accent/50!')
                  }
                >
                  {p}%
                </button>
              ))}
            </div>
            <Button type="submit" fullWidth>
              <LuPlus className="h-4 w-4" />
              Create code
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  )
}
