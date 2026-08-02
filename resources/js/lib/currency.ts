let _fmt: Intl.NumberFormat

export function fmt(price: number) {
    _fmt ??= new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    })

    return _fmt.format(price)
}

export function ceilTo500(n: number): number {
    if (n <= 0) {
        return 0
    }

    return Math.ceil(n / 500) * 500
}

export function roundTo500(n: number): number {
    return Math.round(n / 500) * 500
}

export function roundingAmount(n: number): number {
    return Math.max(0, ceilTo500(n) - n)
}
