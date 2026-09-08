import { StatCard, StatGrid, FadeItem } from '@/features/admin/components/primitives'
import { BoxIcon, AlertIcon, CoinIcon, ReceiptIcon } from '@/features/admin/components/icons'
import { formatPriceWhole } from '@/shared/lib/format'
import type { Product } from '@/shared/types'
import { useInventory } from '../context/InventoryContext'

export function InventoryStats({ products }: { products: Product[] }) {
  const { statusFor, committedUnits } = useInventory()

  const onHand = products.reduce((s, p) => s + Math.max(0, p.stock), 0)
  const value = products.reduce((s, p) => s + Math.max(0, p.stock) * p.price, 0)
  const committed = products.reduce((s, p) => s + committedUnits(p.id), 0)
  const low = products.filter((p) => statusFor(p) === 'low').length
  const out = products.filter((p) => statusFor(p) === 'out').length

  return (
    <StatGrid>
      <FadeItem>
        <StatCard label="Units on hand" value={onHand.toLocaleString()} hint={`${products.length} SKUs`} icon={BoxIcon} />
      </FadeItem>
      <FadeItem>
        <StatCard label="Retail value" value={formatPriceWhole(value)} icon={CoinIcon} />
      </FadeItem>
      <FadeItem>
        <StatCard label="Awaiting fulfilment" value={String(committed)} hint="units in open orders" icon={ReceiptIcon} />
      </FadeItem>
      <FadeItem>
        <StatCard label="Low / out" value={`${low} / ${out}`} hint="need attention" icon={AlertIcon} />
      </FadeItem>
    </StatGrid>
  )
}
