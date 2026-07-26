import { Head, router } from '@inertiajs/react'
import { useEchoPublic } from '@laravel/echo-react'
import { Clock, ChefHat, CheckCircle2, CookingPot, UtensilsCrossed, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

let _fmt: Intl.NumberFormat

function fmt(price: number) {
    _fmt ??= new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })

    return _fmt.format(price)
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

            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    50% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); }
                }
                @keyframes progress-glow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse-dot { animation: pulse-dot 2s infinite; }
                .animate-progress-glow { animation: progress-glow 2s ease-in-out infinite; }
            `}</style>

            <div className="bg-white/80 px-6 pb-8 pt-safe backdrop-blur-xl">
                <div className="mx-auto max-w-lg pt-8 text-center">
                    <div className="mb-5 flex justify-center">
                        {currentStatus === 'ready' || currentStatus === 'completed' ? (
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#4F6B6A] to-[#33504F] shadow-lg shadow-[#4F6B6A]/25">
                                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#4F6B6A]/20" />
                                <CheckCircle2 className="h-12 w-12 text-white" />
                            </div>
                        ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50 animate-pulse-dot">
                                <ChefHat className="h-12 w-12 text-white" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {currentStatus === 'ready' || currentStatus === 'completed'
                            ? 'Pesanan Siap!'
                            : 'Pesanan Diproses'}
                    </h1>

                    <div className="mt-3 flex items-center justify-center gap-3 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#CFC0A4]/25 px-3 py-1 font-medium text-[#4F6B6A]">
                            <Store className="h-3.5 w-3.5" />
                            Meja {table.code}
                        </span>
                        {order.customer_name && (
                            <span className="text-gray-400">— {order.customer_name}</span>
                        )}
                    </div>

                    <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {elapsed}
                        </span>
                        <span className="rounded-md bg-[#F6F2E9] px-2 py-0.5 font-mono text-gray-500 ring-1 ring-[#CFC0A4]/40">
                            #{order.id}
                        </span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-lg px-6 py-8">
                <div className="space-y-0">
                    {steps.map((step, i) => {
                        const done = i < current
                        const active = i === current
                        const Icon = step.icon

                        return (
                            <div key={step.key} className="flex items-start gap-4">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={cn(
                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500',
                                            done
                                                ? 'border-[#4F6B6A] bg-[#4F6B6A] text-white'
                                                : active
                                                    ? 'border-amber-500 bg-white text-amber-500 animate-pulse-dot'
                                                    : 'border-[#CFC0A4]/50 bg-white text-[#CFC0A4]',
                                        )}
                                    >
                                        {done ? (
                                            <CheckCircle2 className="h-5 w-5 text-white" />
                                        ) : (
                                            <Icon className="h-5 w-5" />
                                        )}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div
                                            className={cn(
                                                'mt-1.5 h-10 w-0.5 rounded-full transition-colors duration-500',
                                                i < current
                                                    ? 'bg-[#4F6B6A]/60'
                                                    : i === current
                                                        ? 'bg-gradient-to-b from-amber-400 to-[#CFC0A4]/40 animate-progress-glow'
                                                        : 'bg-[#CFC0A4]/40',
                                            )}
                                        />
                                    )}
                                </div>
                                <div className="flex flex-col justify-center pb-10 pt-1.5">
                                    <p
                                        className={cn(
                                            'text-sm font-semibold transition-colors',
                                            done || active ? 'text-gray-900' : 'text-gray-400',
                                        )}
                                    >
                                        {step.label}
                                    </p>
                                    {active && currentStatus === 'processing' && (
                                        <p className="mt-0.5 text-xs text-amber-600">
                                            Chef sedang menyiapkan pesanan Anda
                                        </p>
                                    )}
                                    {active && currentStatus === 'ready' && (
                                        <p className="mt-0.5 text-xs font-medium text-[#4F6B6A]">
                                            Pesanan siap diantar!
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="mx-auto max-w-lg px-6 pb-8">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#CFC0A4]/30">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">Pesanan Anda</h3>
                        <span className="rounded-full bg-[#4F6B6A]/10 px-2.5 py-0.5 text-xs font-semibold text-[#4F6B6A]">{order.items.length} item</span>
                    </div>
                    <div className="divide-y divide-[#F6F2E9]">
                        {order.items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-[#4F6B6A]/10 px-2 py-0.5 text-xs font-semibold text-[#4F6B6A]">
                                        {item.qty}x
                                    </span>
                                    <span className="text-sm text-gray-700">{item.menu.name}</span>
                                </div>
                                {item.notes && (
                                    <span className="ml-2 max-w-[120px] truncate text-xs text-gray-400">
                                        {item.notes}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-[#F6F2E9] pt-4">
                        <span className="text-sm font-semibold text-gray-800">Total</span>
                        <span className="text-lg font-bold text-[#4F6B6A]">{fmt(order.total)}</span>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-lg px-6 pb-12">
                <Button
                    className="h-12 w-full rounded-2xl border-2 border-[#CFC0A4]/60 bg-white text-sm font-semibold text-[#4F6B6A] shadow-sm transition-all hover:bg-[#F6F2E9] active:scale-[0.98]"
                    onClick={() => router.visit(`/t/${tableToken}`)}
                >
                    Pesan Lagi
                </Button>
            </div>
        </div>
    )
}
