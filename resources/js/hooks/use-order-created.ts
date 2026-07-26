import { router, usePage } from '@inertiajs/react'
import { useEcho } from '@laravel/echo-react'
import { toast } from 'sonner'

interface OrderCreatedPayload {
  order: {
    id: number
    table_code?: string | null
    customer_name?: string | null
  }
}

export function useOrderCreated(): void {
  const { auth } = usePage<{ auth: { outlet_id?: number } }>().props
  const outletId = auth?.outlet_id

  useEcho<OrderCreatedPayload>(
    outletId ? `outlet.${outletId}.pos` : '',
    '.OrderCreated',
    (e) => {
      const table = e.order.table_code ?? '—'
      const name = e.order.customer_name ? ` (${e.order.customer_name})` : ''
      toast.info(`Pesanan Baru #${e.order.id} — Meja ${table}${name}`, {
        description: 'Menunggu konfirmasi kasir',
        duration: 5000,
      })
      router.reload({ only: ['pendingOrders'], preserveScroll: true, preserveState: true })
    },
    [outletId],
  )
}
