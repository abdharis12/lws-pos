import { useEffect, useState } from 'react'
import { Head, router } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, ChefHat, CheckCircle2, CookingPot, UtensilsCrossed } from 'lucide-react'
import { useEchoPublic } from '@laravel/echo-react'

interface OrderItem {
    id: number
    menu: { name: string }
    qty: number
    notes: string | null
}

interface Order {
    id: number
    status: string
    created_at: string
    items: OrderItem[]
    total: number
    customer_name: string | null
}

interface Props {
    table: { code: string }
    tableToken: string
    order: Order
}

function fmt(price: number) {
    return `Rp${price.toLocaleString('id-ID')}`
}

const steps = [
    { key: 'pending', label: 'Pesanan Diterima', icon: CheckCircle2 },
    { key: 'paid', label: 'Pembayaran Dikonfirmasi', icon: CheckCircle2 },
    { key: 'processing', label: 'Sedang Dimasak', icon: CookingPot },
    { key: 'ready', label: 'Siap Disajikan', icon: UtensilsCrossed },
]

const stepIndex: Record<string, number> = {
    pending: 0,
    paid: 1,
    processing: 2,
    ready: 3,
    completed: 4,
}

export default function OrderStatus({ table, tableToken, order }: Props) {
    const [currentStatus, setCurrentStatus] = useState(order.status)
    const [elapsed, setElapsed] = useState('0m')

    useEffect(() => {
        const update = () => {
            const diff = Date.now() - new Date(order.created_at).getTime()
            const mins = Math.floor(diff / 60000)
            setElapsed(mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}j ${mins % 60}m`)
        }
        update()
        const id = setInterval(update, 30000)
        return () => clearInterval(id)
    }, [order.created_at])

    useEchoPublic<{ order: { id: number; status: string } }>(
        `table.${tableToken}`,
        '.OrderStatusUpdated',
        (e) => {
            if (e.order.id === order.id) {
                setCurrentStatus(e.order.status)
            }
        },
    )

    const current = stepIndex[currentStatus] ?? 0

    return (
        <div className="min-h-screen bg-[#F6F2E9]">
            <Head title="Status Pesanan" />

            <div className="mx-auto max-w-lg px-4 py-12">
                <div className="text-center">
                    <div className="mb-4 flex justify-center">
                        {currentStatus === 'ready' || currentStatus === 'completed' ? (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                                <ChefHat className="h-10 w-10 text-amber-600" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-800">
                        {currentStatus === 'ready' || currentStatus === 'completed'
                            ? 'Pesanan Siap!'
                            : 'Pesanan Diproses'}
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Meja {table.code} {order.customer_name ? `- ${order.customer_name}` : ''}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" /> {elapsed}
                        </span>
                        <span>#{order.id}</span>
                    </div>
                </div>

                <div className="mt-10 space-y-1">
                    {steps.map((step, i) => {
                        const done = i <= current
                        const active = i === current
                        const Icon = step.icon
                        return (
                            <div key={step.key} className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                            done
                                                ? 'border-green-500 bg-green-500 text-white'
                                                : 'border-gray-300 bg-white text-gray-300'
                                        } ${active && !done ? 'animate-pulse border-amber-500' : ''}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div
                                            className={`mt-1 h-8 w-0.5 ${done ? 'bg-green-500' : 'bg-gray-300'}`}
                                        />
                                    )}
                                </div>
                                <div className={`pt-1 ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                                    <p className="text-sm font-medium">{step.label}</p>
                                    {active && currentStatus === 'processing' && (
                                        <p className="mt-0.5 text-xs text-amber-600">
                                            Chef sedang menyiapkan pesanan Anda
                                        </p>
                                    )}
                                    {active && currentStatus === 'ready' && (
                                        <p className="mt-0.5 text-xs text-green-600">
                                            Pesanan siap diantar!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-8 rounded-xl bg-white p-4 shadow-sm">
                    <h3 className="mb-3 text-sm font-semibold text-gray-800">Pesanan Anda</h3>
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                    {item.qty}x {item.menu.name}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 text-sm font-semibold">
                        <span>Total</span>
                        <span className="text-[#4F6B6A]">{fmt(order.total)}</span>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Button
                        variant="outline"
                        className="text-gray-600"
                        onClick={() => router.visit(`/t/${tableToken}`)}
                    >
                        Pesan Lagi
                    </Button>
                </div>
            </div>
        </div>
    )
}
