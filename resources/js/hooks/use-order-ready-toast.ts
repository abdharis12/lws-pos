import { usePage } from '@inertiajs/react'
import { useEcho } from '@laravel/echo-react'
import { toast } from 'sonner'

interface ReadyPayload {
  order: {
    id: number
    status: string
    table_code: string | null
    customer_name: string | null
    item_count: number
  }
}

export function useOrderReadyToast(): void {
  const { auth } = usePage<{ auth: { outlet_id?: number } }>().props

  const outletId = auth?.outlet_id

  useEcho<ReadyPayload>(
    outletId ? `outlet.${outletId}.pos` : '',
    '.OrderStatusUpdated',
    (e) => {
      if (e.order.status === 'ready') {
        const table = e.order.table_code ?? '—'
        const name = e.order.customer_name
          ? ` (${e.order.customer_name})`
          : ''
        toast.success(
          `Pesanan #${e.order.id} Siap — Meja ${table}${name}`,
          {
            description: `${e.order.item_count} item siap diantar`,
            duration: 6000,
          },
        )
      }
    },
    [outletId],
  )
}