import { useEffect, useRef, useState } from 'react'
import { router, Head, usePoll } from '@inertiajs/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ChefHat, Clock } from 'lucide-react'

interface OrderItem {
  id: number
  menu: { name: string }
  qty: number
  notes: string | null
}

interface Order {
  id: number
  order_type: string
  status: string
  created_at: string
  items: OrderItem[]
  table_session: { table: { code: string } } | null
}

interface Props {
  orders: Order[]
}

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Dimasak',
  ready: 'Siap',
  served: 'Tersaji',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-600',
  processing: 'bg-blue-600',
  ready: 'bg-green-600',
  served: 'bg-gray-600',
}

function calcElapsed(createdAt: string) {
  const diff = Date.now() - new Date(createdAt).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return { text: `${mins}m`, mins }
  return { text: `${Math.floor(mins / 60)}j ${mins % 60}m`, mins }
}

function ElapsedBadge({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(() => calcElapsed(createdAt))

  useEffect(() => {
    const id = setInterval(() => setElapsed(calcElapsed(createdAt)), 30000)
    return () => clearInterval(id)
  }, [createdAt])

  const color =
    elapsed.mins < 5
      ? 'bg-green-900 text-green-300'
      : elapsed.mins < 10
        ? 'bg-amber-900 text-amber-300'
        : 'bg-red-900 text-red-300'

  return (
    <Badge className={cn('text-xs', color)}>
      <Clock className="mr-1 h-3 w-3" />
      {elapsed.text}
    </Badge>
  )
}

export default function KitchenIndex({ orders }: Props) {
  const [newIds, setNewIds] = useState<Set<number>>(new Set())
  const prevIds = useRef<Set<number>>(new Set())

  usePoll(10000)

  useEffect(() => {
    const ids = new Set(orders.map(o => o.id))
    const fresh = new Set([...ids].filter(id => !prevIds.current.has(id)))
    if (fresh.size > 0) {
      setNewIds(fresh)
      const t = setTimeout(() => setNewIds(new Set()), 4000)
      prevIds.current = ids
      return () => clearTimeout(t)
    }
    prevIds.current = ids
  }, [orders])

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white">
      <Head title="Kitchen Display" />

      <style>{`
        @keyframes new-order-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
          50% { box-shadow: 0 0 25px 6px rgba(34,197,94,0.25); }
        }
        .new-order { animation: new-order-glow 4s ease-in-out; }
      `}</style>

      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-[#4F6B6A]" />
          <h1 className="text-2xl font-bold">Kitchen Display System</h1>
          <span className="flex h-3 w-3">
            <span className="absolute inline-flex h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </span>
          <span className="ml-auto text-sm text-gray-400">{orders.length} pesanan</span>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <ChefHat className="mb-4 h-16 w-16 opacity-30" />
            <p className="text-lg">Belum ada pesanan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map(order => (
              <Card
                key={order.id}
                className={cn(
                  'border-gray-800 bg-gray-900 text-white',
                  newIds.has(order.id) && 'new-order'
                )}
              >
                <CardHeader className="border-b border-gray-800 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">#{order.id}</CardTitle>
                      <p className="text-sm text-gray-400">
                        {order.table_session?.table?.code ?? order.order_type}
                      </p>
                    </div>
                    <ElapsedBadge createdAt={order.created_at} />
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  <ul className="mb-3 space-y-1">
                    {order.items.map(item => (
                      <li key={item.id} className="flex text-sm">
                        <span className="mr-2 text-[#CFC0A4]">{item.qty}x</span>
                        <span>{item.menu.name}</span>
                      </li>
                    ))}
                  </ul>

                  {order.items.some(i => i.notes) && (
                    <div className="mb-3 space-y-1 rounded bg-gray-800 p-2 text-xs text-gray-300">
                      {order.items.filter(i => i.notes).map(i => (
                        <p key={i.id}>
                          <strong>{i.menu.name}:</strong> {i.notes}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-800 pt-3">
                    <Badge
                      className={cn('text-white', statusColor[order.status] ?? 'bg-gray-500')}
                    >
                      {statusLabel[order.status] ?? order.status}
                    </Badge>

                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-[#4F6B6A] hover:bg-[#3d5554]"
                          onClick={() =>
                            router.patch(
                              `/orders/${order.id}/status`,
                              { status: 'processing' },
                              { preserveState: true },
                            )
                          }
                        >
                          Mulai Masak
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            router.patch(
                              `/orders/${order.id}/status`,
                              { status: 'ready' },
                              { preserveState: true },
                            )
                          }
                        >
                          Selesai
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
