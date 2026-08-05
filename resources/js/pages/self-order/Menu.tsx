import { Head } from '@inertiajs/react'
import { Clock } from 'lucide-react'
import { useState, useCallback } from 'react'
import { useSelfOrderCart } from '@/hooks/useSelfOrderCart'
import { useSelfOrderPayment } from '@/hooks/useSelfOrderPayment'
import { CartModal } from '@/pages/self-order/components/CartModal'
import { Header } from '@/pages/self-order/components/Header'
import { MenuCard } from '@/pages/self-order/components/MenuCard'
import { MenuDetailModal } from '@/pages/self-order/components/MenuDetailModal'
import { PaymentSelectModal } from '@/pages/self-order/components/PaymentSelectModal'
import { PaymentStatusModal } from '@/pages/self-order/components/PaymentStatusModal'
import type { Category } from '@/types/self-order'

interface Props {
    table: { code: string }
    tableToken: string
    categories: Category[]
    outlet: { name: string }
}

export default function SelfOrderMenu({ table, tableToken, categories, outlet }: Props) {
    const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? 0)
    const [customerName, setCustomerName] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const cart = useSelfOrderCart()
    const payment = useSelfOrderPayment(tableToken)

    const activeMenus = categories.find(c => c.id === activeCategory)?.menus ?? []

    const handleCashCheckout = useCallback(() => {
        setSubmitting(true)
        payment.handleCashPay(cart.cart, customerName)
    }, [payment, cart.cart, customerName])

    const handleOnlineSelect = useCallback(
        (type: string) => {
            setSubmitting(true)
            payment.handleOnlinePay(cart.cart, customerName, type)
        },
        [payment, cart.cart, customerName],
    )

    const handleCancelPayment = useCallback(async () => {
        const orderId = payment.midtransOrderId

        if (!orderId) {
            return
        }

        if (!window.confirm('Batalkan pembayaran ini?')) {
            return
        }

        try {
            const res = await fetch(`/t/${tableToken}/orders/${orderId}/cancel`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            })

            if (res.ok) {
                payment.resetPayment()
            }
        } catch {
            // silent
        }
    }, [tableToken, payment])

    return (
        <div className="min-h-screen bg-[#F6F2E9]">
            <Head title={`Menu - ${outlet.name}`} />

            <style>{`
                @keyframes slide-up {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
                }
                @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
                }
                .animate-slide-up { animation: slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-fade-in { animation: fade-in 0.2s ease-out; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <Header
                outletName={outlet.name}
                tableCode={table.code}
                customerName={customerName}
                onCustomerNameChange={setCustomerName}
                categories={categories}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
                cartCount={cart.cartCount}
                onCartOpen={() => cart.setIsCartOpen(true)}
            />

            <div className="mx-auto max-w-2xl px-4 pb-28 pt-5 md:pt-8 lg:pt-10">
                {activeMenus.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-[#8C8577]">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#CFC0A4]/25">
                            <Clock className="h-7 w-7 text-[#4F6B6A]" />
                        </div>
                        <p className="text-sm">Tidak ada menu di kategori ini</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {activeMenus.map(menu => (
                            <MenuCard key={menu.id} menu={menu} onSelect={cart.openMenu} />
                        ))}
                    </div>
                )}
            </div>

            {cart.selectedMenu && (
                <MenuDetailModal
                    menu={cart.selectedMenu}
                    qty={cart.qty}
                    notes={cart.notes}
                    selOptions={cart.selOptions}
                    onQtyChange={cart.setQty}
                    onNotesChange={cart.setNotes}
                    onToggleOption={cart.toggleOption}
                    onChangeOptionQty={cart.changeOptionQty}
                    onAddToCart={cart.addToCart}
                    onClose={cart.closeMenu}
                    modalTotal={cart.calcModalTotal()}
                />
            )}

            {cart.isCartOpen && (
                <CartModal
                    cart={cart.cart}
                    cartCount={cart.cartCount}
                    cartSubtotal={cart.cartSubtotal}
                    cartTax={cart.cartTax}
                    cartRoundingAmount={cart.cartRoundingAmount}
                    cartTotal={cart.cartTotal}
                    onlineServiceCharge={cart.onlineServiceCharge}
                    midtransCharge={cart.midtransCharge}
                    onlineRoundingAmount={cart.onlineRoundingAmount}
                    onlineTotal={cart.onlineTotal}
                    paymentMethod={payment.paymentMethod}
                    submitting={submitting}
                    customerName={customerName}
                    onSetPaymentMethod={payment.setPaymentMethod}
                    onCheckout={() => {
                        if (payment.paymentMethod === 'online') {
                            cart.setIsCartOpen(false)
                        } else {
                            handleCashCheckout()
                        }
                    }}
                    onRemoveItem={cart.removeFromCart}
                    onClose={() => {
                        cart.setIsCartOpen(false)
                        payment.setPaymentMethod(null)
                    }}
                    calcItemTotal={cart.calcItemTotal}
                />
            )}

            {payment.paymentMethod === 'online' && payment.midtransStep === 'select' && (
                <PaymentSelectModal
                    onSelect={handleOnlineSelect}
                    onClose={() => {
                        payment.setPaymentMethod(null)
                        payment.setMidtransStep('select')
                    }}
                />
            )}

            {payment.paymentMethod === 'online' && payment.midtransStep === 'pay' && (
                <PaymentStatusModal
                    payStatus={payment.payStatus}
                    payProcessing={payment.payProcessing}
                    payError={payment.payError}
                    midtransResponse={payment.midtransResponse}
                    copied={payment.copied}
                    onCopy={payment.setCopied}
                    onBack={() => {
                        payment.setMidtransStep('select')
                        payment.setMidtransResponse(null)
                        payment.setPayError(null)
                    }}
                    onRetry={() => {
                        payment.setPaymentMethod(null)
                        payment.setMidtransStep('select')
                        payment.resetPayment()
                    }}
                    onCancel={handleCancelPayment}
                />
            )}
        </div>
    )
}
