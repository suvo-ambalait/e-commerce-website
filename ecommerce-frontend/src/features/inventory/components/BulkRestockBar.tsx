import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Button, Input } from '@/shared/ui'
import { easeEditorial } from '@/shared/lib/motion'
import { useToast } from '@/shared/ui/Toast'
import { useInventory } from '../context/InventoryContext'

export function BulkRestockBar({
  selectedIds,
  onClear,
}: {
  selectedIds: string[]
  onClear: () => void
}) {
  const { bulkReceive } = useInventory()
  const { notify } = useToast()
  const [qty, setQty] = useState('10')

  return (
    <AnimatePresence>
      {selectedIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: easeEditorial }}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-ink bg-ink px-4 py-2.5 text-bg"
        >
          <span className="text-sm">
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2">
            <span className="text-caption text-bg/70">Receive</span>
            <Input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="h-8 w-20 bg-bg text-ink"
            />
            <span className="text-caption text-bg/70">each</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="border-transparent bg-bg"
            onClick={() => {
              const n = Number(qty)
              if (n <= 0) return
              bulkReceive(selectedIds.map((id) => ({ productId: id, qty: n })))
              notify(`Received ${n} units into ${selectedIds.length} products`, 'success')
              onClear()
            }}
          >
            Apply
          </Button>
          <button type="button" onClick={onClear} className="ml-auto text-caption text-bg/70 hover:text-bg">
            Clear
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
