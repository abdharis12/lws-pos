import { useEffect, useRef, useState } from 'react'
import { router, Head, usePoll, usePage } from '@inertiajs/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ChefHat, Clock, CookingPot } from 'lucide-react'

interface OrderItem {
  id: number
  menu: { name: string; station: string | null }
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

interface StationGroup {
  name: string
  orders: Order[]
}

interface Props {
  stations: StationGroup[]
  unassignedOrders: Order[]
}

const statusLabel: Record<string, string> = {
  pending: 'Menunggu',
  paid: 'Menunggu',
  processing: 'Dimasak',
  ready: 'Siap',
  served: 'Tersaji',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-600',
  paid: 'bg-yellow-600',
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

function OrderCard({ order, isNew }: { order: Order; isNew: boolean }) {
  return (
    <Card
      key={order.id}
      className={cn(
        'border-gray-800 bg-gray-900 text-white',
        isNew && 'new-order'
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
            {order.status === 'paid' && (
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
  )
}

function StationColumn({ station, stationOrders, newIds }: { station: StationGroup; stationOrders: Order[]; newIds: Set<number> }) {
  if (stationOrders.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 -mx-4 -mt-4 bg-gray-950 px-4 pb-2 pt-4">
        <div className="flex items-center gap-2">
          <CookingPot className="h-5 w-5 text-[#CFC0A4]" />
          <h2 className="text-base font-semibold">{station.name}</h2>
          <Badge variant="outline" className="ml-auto border-gray-700 text-xs text-gray-400">
            {stationOrders.length}
          </Badge>
        </div>
      </div>
      {stationOrders.map(order => (
        <OrderCard key={order.id} order={order} isNew={newIds.has(order.id)} />
      ))}
    </div>
  )
}

export default function KitchenIndex({ stations, unassignedOrders }: Props) {
  const [newIds, setNewIds] = useState<Set<number>>(new Set())
  const prevIds = useRef<Set<number>>(new Set())

  usePoll(10000)

  const allOrders = [...stations.flatMap(s => s.orders), ...unassignedOrders]

  useEffect(() => {
    const ids = new Set(allOrders.map(o => o.id))
    const fresh = new Set([...ids].filter(id => !prevIds.current.has(id)))
    if (fresh.size > 0) {
      setNewIds(fresh)
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 800
        osc.type = 'sine'
        gain.gain.value = 0.3
        osc.start()
        osc.stop(ctx.currentTime + 0.3)
      } catch {}
      const t = setTimeout(() => setNewIds(new Set()), 4000)
      prevIds.current = ids
      return () => clearTimeout(t)
    }
    prevIds.current = ids
  }, [allOrders])

  const hasOrders = allOrders.length > 0

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
          <span className="ml-auto text-sm text-gray-400">{allOrders.length} pesanan</span>
        </div>

        {!hasOrders ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <ChefHat className="mb-4 h-16 w-16 opacity-30" />
            <p className="text-lg">Belum ada pesanan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stations.map(station => (
              <StationColumn
                key={station.name}
                station={station}
                stationOrders={station.orders}
                newIds={newIds}
              />
            ))}
            {unassignedOrders.length > 0 && (
              <StationColumn
                station={{ name: 'Lainnya', orders: unassignedOrders }}
                stationOrders={unassignedOrders}
                newIds={newIds}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
