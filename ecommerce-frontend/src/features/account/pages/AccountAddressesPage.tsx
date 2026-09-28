import { useState, type FormEvent } from 'react'
import { LuMapPin, LuPencil, LuPlus, LuStar, LuTrash2 } from 'react-icons/lu'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { Badge, Button, Checkbox, EmptyState, Field, Input, Modal } from '@/shared/ui'
import { useToast } from '@/shared/ui/Toast'
import { makeId } from '@/shared/lib/createStore'
import { addressesStore, type SavedAddress } from '@/features/marketplace/stores'
import { AccountCard } from '../components/AccountLayout'

const blank: Omit<SavedAddress, 'id'> = {
  label: 'Home',
  fullName: '',
  phone: '',
  address: '',
  area: '',
  city: '',
  zip: '',
  country: 'Bangladesh',
  isDefault: false,
}

export function AccountAddressesPage() {
  useDocumentTitle('Addresses · AmbalaEshop')
  const [addresses, setAddresses] = addressesStore.useStore()
  const { notify } = useToast()
  const [editing, setEditing] = useState<SavedAddress | Omit<SavedAddress, 'id'> | null>(null)

  const setDefault = (id: string) => setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))

  const remove = (a: SavedAddress) => {
    if (!confirm(`Delete the “${a.label}” address?`)) return
    setAddresses((prev) => {
      const next = prev.filter((x) => x.id !== a.id)
      // keep one default if any addresses remain
      if (a.isDefault && next.length) next[0] = { ...next[0], isDefault: true }
      return next
    })
    notify('Address deleted', 'success')
  }

  return (
    <AccountCard
      title="Saved addresses"
      subtitle="Pick one at checkout. Your default is filled in automatically."
      aside={
        addresses.length > 0 && (
          <Button size="sm" onClick={() => setEditing({ ...blank, isDefault: false })}>
            <LuPlus className="h-4 w-4" />
            Add address
          </Button>
        )
      }
    >
      {addresses.length === 0 ? (
        <EmptyState
          icon={<LuMapPin />}
          title="No saved addresses"
          description="Save home, office or a family member’s address to check out faster."
          action={
            <Button onClick={() => setEditing({ ...blank, isDefault: true })}>
              <LuPlus className="h-4 w-4" />
              Add an address
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className={`flex flex-col rounded-2xl border p-4 ${a.isDefault ? 'border-accent/60! bg-accent-soft/30' : 'border-border'}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-display font-bold text-ink">
                  <LuMapPin className="h-4 w-4 text-accent" />
                  {a.label}
                </p>
                {a.isDefault && <Badge tone="accent">Default</Badge>}
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">{a.fullName}</p>
              <p className="text-sm text-ink-soft">
                {[a.address, a.area, a.city, a.zip, a.country].filter(Boolean).join(', ')}
              </p>
              <p className="mt-0.5 text-caption text-ink-mute">{a.phone}</p>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-3">
                <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                  <LuPencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {!a.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => setDefault(a.id)}>
                    <LuStar className="h-3.5 w-3.5" />
                    Make default
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="ml-auto text-danger!" onClick={() => remove(a)}>
                  <LuTrash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <AddressModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(saved) => {
            setAddresses((prev) => {
              const exists = prev.some((a) => a.id === saved.id)
              let next = exists ? prev.map((a) => (a.id === saved.id ? saved : a)) : [...prev, saved]
              // first address is always the default; a new default clears the old one
              if (next.length === 1) next = [{ ...next[0], isDefault: true }]
              else if (saved.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === saved.id }))
              return next
            })
            notify('Address saved', 'success')
            setEditing(null)
          }}
        />
      )}
    </AccountCard>
  )
}

function AddressModal({
  initial,
  onClose,
  onSave,
}: {
  initial: SavedAddress | Omit<SavedAddress, 'id'>
  onClose: () => void
  onSave: (a: SavedAddress) => void
}) {
  const [form, setForm] = useState(initial)
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSave({ ...form, id: 'id' in form ? form.id : makeId('adr') } as SavedAddress)
  }

  return (
    <Modal open onClose={onClose} title={'id' in initial ? 'Edit address' : 'New address'}>
      <form onSubmit={submit} className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {['Home', 'Office', 'Family'].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setForm((f) => ({ ...f, label: l }))}
              className={`h-8 rounded-full px-3.5 text-caption font-semibold transition-colors ${form.label === l ? 'bg-ink text-bg' : 'bg-surface-sunken text-ink-soft hover:text-ink'}`}
            >
              {l}
            </button>
          ))}
        </div>
        <Field label="Label" required>
          {(id) => <Input id={id} required value={form.label} onChange={set('label')} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            {(id) => <Input id={id} required value={form.fullName} onChange={set('fullName')} />}
          </Field>
          <Field label="Phone" required>
            {(id) => <Input id={id} required type="tel" value={form.phone} onChange={set('phone')} placeholder="+880 1712 345678" />}
          </Field>
        </div>
        <Field label="Address" required hint="House, road, block">
          {(id) => <Input id={id} required value={form.address} onChange={set('address')} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Area / Thana" required>
            {(id) => <Input id={id} required value={form.area} onChange={set('area')} />}
          </Field>
          <Field label="City / District" required>
            {(id) => <Input id={id} required value={form.city} onChange={set('city')} />}
          </Field>
          <Field label="Postcode">
            {(id) => <Input id={id} value={form.zip} onChange={set('zip')} inputMode="numeric" />}
          </Field>
        </div>
        <Checkbox label="Use as my default address" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Save address</Button>
        </div>
      </form>
    </Modal>
  )
}
