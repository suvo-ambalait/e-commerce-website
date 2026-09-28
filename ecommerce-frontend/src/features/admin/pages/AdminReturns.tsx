import { LuCircleCheck, LuClock, LuRotateCcw, LuWallet } from 'react-icons/lu'
import { PageHeader, StatCard, StatGrid, FadeItem } from '../components/primitives'
import { formatPriceWhole } from '@/shared/lib/format'
import { ReturnsTable } from '@/features/marketplace/components/ReturnsTable'
import { returnsStore } from '@/features/marketplace/stores'

export function AdminReturns() {
  const [all] = returnsStore.useStore()
  const by = (s: string) => all.filter((r) => r.status === s)
  const refunded = by('Refunded').reduce((n, r) => n + r.amount, 0)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Returns & refunds"
        description="Every return and cancellation request across all shops. Shops can answer their own, and you can step in on any."
      />
      <StatGrid>
        <FadeItem>
          <StatCard label="To review" value={String(by('Requested').length)} icon={LuClock} hint="waiting for a decision" />
        </FadeItem>
        <FadeItem>
          <StatCard label="Approved" value={String(by('Approved').length)} icon={LuRotateCcw} hint="waiting for refund" />
        </FadeItem>
        <FadeItem>
          <StatCard label="Refunded" value={formatPriceWhole(refunded)} icon={LuWallet} hint={`${by('Refunded').length} requests`} />
        </FadeItem>
        <FadeItem>
          <StatCard label="Declined" value={String(by('Rejected').length)} icon={LuCircleCheck} hint="closed" />
        </FadeItem>
      </StatGrid>
      <ReturnsTable orderPath={(n) => `/admin/orders/${n}`} />
    </div>
  )
}
