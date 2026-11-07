import { router } from '@inertiajs/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { thankYou } from '@/actions/App/Http/Controllers/SelfOrderController'
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
    const payRequestInFlightRef = useRef(false)
    const cashRequestInFlightRef = useRef(false)
    const activeIdempotencyStorageKeyRef = useRef<string | null>(null)
    const idempotencyStoragePrefix = `self-order:${tableToken}:checkout`

    const checkoutFingerprint = useCallback(async (cart: CartItem[], customerName: string, paymentMethod: string, paymentType?: string) => {
        const payload = JSON.stringify({
            customerName: customerName.trim(),
            paymentMethod,
            paymentType: paymentType ?? null,
            items: cart.map(item => ({
                menuId: item.menuId,
                quantity: item.quantity,
                notes: item.notes,
                optionIds: item.options.flatMap(option => Array.from({ length: option.quantity }, () => option.id)),
            })),
        })
        const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload))

        return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
    }, [])

    const getIdempotencyKey = useCallback((fingerprint: string) => {
        const storageKey = `${idempotencyStoragePrefix}:${fingerprint}`
        const existingKey = window.sessionStorage.getItem(storageKey)
        const key = existingKey ?? window.crypto.randomUUID()

        if (!existingKey) {
            window.sessionStorage.setItem(storageKey, key)
        }

        activeIdempotencyStorageKeyRef.current = storageKey

        return key
    }, [idempotencyStoragePrefix])

    const clearActiveIdempotencyKey = useCallback(() => {
        if (activeIdempotencyStorageKeyRef.current) {
            window.sessionStorage.removeItem(activeIdempotencyStorageKeyRef.current)
            activeIdempotencyStorageKeyRef.current = null
        }
    }, [])

    const clearPoll = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current)
            pollRef.current = null
        }
    }, [])

    const resetPayment = useCallback(() => {
        clearPoll()
        payRequestInFlightRef.current = false
        clearActiveIdempotencyKey()
        setPaymentMethod(null)
        setMidtransStep('select')
        setMidtransResponse(null)
        setMidtransOrderId(null)
        setMidtransAccessToken(null)
        setPayStatus('idle')
        setPayProcessing(false)
        setPayError(null)
        setCopied(false)
    }, [clearActiveIdempotencyKey, clearPoll])

    const commonHeaders = (): Record<string, string> => ({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
    })

    const handleCashPay = useCallback(
        async (cart: CartItem[], customerName: string, onComplete: (error: string | null) => void) => {
            if (cashRequestInFlightRef.current) {
                return
            }

            cashRequestInFlightRef.current = true

            try {
                const fingerprint = await checkoutFingerprint(cart, customerName, 'cash')
                const storageKey = `${idempotencyStoragePrefix}:${fingerprint}`
                const response = await fetch(`/t/${tableToken}/pay`, {
                    method: 'POST',
                    headers: commonHeaders(),
                    body: JSON.stringify({
                        customer_name: customerName,
                        payment_method: 'cash',
                        idempotency_key: getIdempotencyKey(fingerprint),
                        items: cart.map(i => ({
                            menu_id: i.menuId,
                            qty: i.quantity,
                            notes: i.notes,
                            option_ids: i.options.flatMap(o => Array.from({ length: o.quantity }, () => o.id)),
                        })),
                    }),
                })
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.message ?? 'Pesanan gagal dikirim. Silakan coba lagi.')
                }

                onComplete(null)
                router.visit(`/t/${tableToken}/orders/${data.order_id}/status`, {
                    onSuccess: () => window.sessionStorage.removeItem(storageKey),
                })
            } catch (error) {
                onComplete(error instanceof Error ? error.message : 'Jaringan bermasalah. Silakan coba lagi.')
            } finally {
                cashRequestInFlightRef.current = false
            }
        },
        [checkoutFingerprint, getIdempotencyKey, idempotencyStoragePrefix, tableToken],
    )

    const handleOnlinePay = useCallback(
        async (cart: CartItem[], customerName: string, paymentType: string) => {
            if (payRequestInFlightRef.current) {
                return
            }

            if (midtransOrderId && midtransResponse) {
                setPayError(null)
                setMidtransStep('pay')

                return
            }

            payRequestInFlightRef.current = true
            setPayProcessing(true)
            setPayError(null)
            setMidtransStep('pay')

            try {
                const fingerprint = await checkoutFingerprint(cart, customerName, 'online', paymentType)
                const storageKey = `${idempotencyStoragePrefix}:${fingerprint}`
                const response = await fetch(`/t/${tableToken}/pay`, {
                    method: 'POST',
                    headers: commonHeaders(),
                    body: JSON.stringify({
                        customer_name: customerName,
                        payment_method: 'online',
                        payment_type: paymentType,
                        idempotency_key: getIdempotencyKey(fingerprint),
                        items: cart.map(i => ({
                            menu_id: i.menuId,
                            qty: i.quantity,
                            notes: i.notes,
                            option_ids: i.options.flatMap(o => Array.from({ length: o.quantity }, () => o.id)),
                        })),
                    }),
                })
                const data = await response.json()

                if (!response.ok) {
                    if (['payment_expired', 'order_cancelled'].includes(data.code)) {
                        window.sessionStorage.removeItem(storageKey)
                        activeIdempotencyStorageKeyRef.current = null
                        setPayStatus('failed')
                    }

                    setPayError(data.message ?? 'Gagal memproses pembayaran')

                    return
                }

                setMidtransResponse(data as MidtransResponse)
                setMidtransOrderId(data.order_id)
                setMidtransAccessToken(data.access_token ?? null)
                setPayStatus(data.status === 'settlement' ? 'settlement' : 'pending')

                if (data.status === 'settlement') {
                    router.visit(thankYou.url([tableToken, data.order_id]), {
                        onSuccess: () => window.sessionStorage.removeItem(storageKey),
                    })
                }
            } catch {
                setPayError('Koneksi bermasalah. QRIS belum dapat diproses. Silakan coba lagi.')
            } finally {
                setPayProcessing(false)
                payRequestInFlightRef.current = false
            }
        },
        [checkoutFingerprint, getIdempotencyKey, idempotencyStoragePrefix, midtransOrderId, midtransResponse, tableToken],
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
                            const storageKey = activeIdempotencyStorageKeyRef.current
                            router.visit(thankYou.url([tableToken, midtransOrderId]), {
                                onSuccess: () => {
                                    if (storageKey) {
                                        window.sessionStorage.removeItem(storageKey)
                                    }
                                },
                            })
                        }, 1500)
                    } else if (data.status === 'failed') {
                        setPayStatus('failed')
                        clearActiveIdempotencyKey()
                        clearPoll()
                    }
                })
                .catch(() => { })
        }, 3000)

        return clearPoll
    }, [midtransOrderId, payStatus, tableToken, clearActiveIdempotencyKey, clearPoll, midtransResponse])

    return {
        paymentMethod,
        setPaymentMethod,
        midtransStep,
        setMidtransStep,
        midtransResponse,
        setMidtransResponse,
        midtransOrderId,
        midtransAccessToken,
        payStatus,
        payProcessing,
        payError,
        setPayError,
        copied,
        setCopied,
        resetPayment,
        handleCashPay,
        handleOnlinePay,
    }
}
