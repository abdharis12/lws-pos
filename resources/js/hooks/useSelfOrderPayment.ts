import { router } from '@inertiajs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CartItem, MidtransResponse, PaymentStatus } from '@/types/self-order'

export function useSelfOrderPayment(tableToken: string) {
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online' | null>(null)
    const [midtransStep, setMidtransStep] = useState<'select' | 'pay'>('select')
    const [midtransResponse, setMidtransResponse] = useState<MidtransResponse | null>(null)
    const [midtransOrderId, setMidtransOrderId] = useState<number | null>(null)
    const [midtransAccessToken, setMidtransAccessToken] = useState<string | null>(null)
    const [payStatus, setPayStatus] = useState<PaymentStatus>('idle')
    const [payProcessing, setPayProcessing] = useState(false)
    const [payError, setPayError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const clearPoll = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }, [])

    const resetPayment = useCallback(() => {
        clearPoll()
        setPaymentMethod(null)
        setMidtransStep('select')
        setMidtransResponse(null)
        setMidtransOrderId(null)
        setMidtransAccessToken(null)
        setPayStatus('idle')
        setPayProcessing(false)
        setPayError(null)
        setCopied(false)
    }, [clearPoll])

    const commonHeaders = (): Record<string, string> => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
    })

    const handleCashPay = useCallback(
        (cart: CartItem[], customerName: string) => {
            fetch(`/t/${tableToken}/pay`, {
                method: 'POST',
                headers: commonHeaders(),
                body: JSON.stringify({
                    customer_name: customerName,
                    payment_method: 'cash',
                    items: cart.map(i => ({
                        menu_id: i.menuId,
                        qty: i.quantity,
                        notes: i.notes,
                        option_ids: i.options.flatMap(o => Array.from({ length: o.quantity }, () => o.id)),
                    })),
                }),
            })
                .then(res => res.json().then(data => ({ ok: res.ok, data })))
                .then(({ ok, data }) => {
                    if (!ok) {
                        return
                    }

                    router.visit(`/t/${tableToken}/orders/${data.order_id}/status`)
                })
                .catch(() => { })
        },
        [tableToken],
    )

    const handleOnlinePay = useCallback(
        (cart: CartItem[], customerName: string, paymentType: string) => {
            setPayProcessing(true)
            setPayError(null)
            setMidtransStep('pay')

            fetch(`/t/${tableToken}/pay`, {
                method: 'POST',
                headers: commonHeaders(),
                body: JSON.stringify({
                    customer_name: customerName,
                    payment_method: 'online',
                    payment_type: paymentType,
                    items: cart.map(i => ({
                        menu_id: i.menuId,
                        qty: i.quantity,
                        notes: i.notes,
                        option_ids: i.options.flatMap(o => Array.from({ length: o.quantity }, () => o.id)),
                    })),
                }),
            })
                .then(res => res.json().then(data => ({ ok: res.ok, data })))
                .then(({ ok, data }) => {
                    setPayProcessing(false)

                    if (!ok) {
                        setPayError(data.message ?? 'Gagal memproses pembayaran')

                        return
                    }

                    setMidtransResponse(data as MidtransResponse)
                    setMidtransOrderId(data.order_id)
                    setMidtransAccessToken(data.access_token ?? null)
                    setPayStatus('pending')
                })
                .catch(() => {
                    setPayProcessing(false)
                    setPayError('Terjadi kesalahan jaringan')
                })
        },
        [tableToken],
    )

    useEffect(() => {
        if (!midtransOrderId || payStatus !== 'pending') {
            return
        }

        pollRef.current = setInterval(() => {
            fetch(`/t/${tableToken}/orders/${midtransOrderId}/payment-status`, {
                headers: { 'Accept': 'application/json' },
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'settlement') {
                        setPayStatus('settlement')
                        clearPoll()

                        setTimeout(() => {
                            router.visit(`/t/${tableToken}/orders/${midtransOrderId}/status`)
                        }, 1500)
                    } else if (data.status === 'failed') {
                        setPayStatus('failed')
                        clearPoll()
                    }
                })
                .catch(() => { })
        }, 3000)

        return clearPoll
    }, [midtransOrderId, payStatus, tableToken, clearPoll])

    return {
        paymentMethod,
        setPaymentMethod,
        midtransStep,
        setMidtransStep,
        midtransResponse,
        midtransOrderId,
        midtransAccessToken,
        payStatus,
        payProcessing,
        payError,
        copied,
        setCopied,
        resetPayment,
        handleCashPay,
        handleOnlinePay,
    }
}
