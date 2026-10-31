import { Head, router, useForm } from '@inertiajs/react';
import { CheckCircle2, ImageUp, QrCode as QrCodeIcon, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface QrCodeItem {
    id: number;
    label: string | null;
    image_url: string | null;
    is_active: boolean;
    created_at: string | null;
}

interface Props {
    qrCodes: QrCodeItem[];
}

export default function QrCodeIndex({ qrCodes }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, processing, errors, reset } = useForm<{
        label: string;
        image: File | null;
    }>({
        label: '',
        image: null,
    });

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        post('/admin/qr-codes', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();

                if (fileRef.current) {
                    fileRef.current.value = '';
                }
            },
        });
    }

    function handleActivate(qrCode: QrCodeItem) {
        router.post(`/admin/qr-codes/${qrCode.id}/activate`, {}, { preserveScroll: true });
    }

    function handleDelete(qrCode: QrCodeItem) {
        if (!confirm('Hapus QR code ini?')) {
            return;
        }

        router.delete(`/admin/qr-codes/${qrCode.id}`, { preserveScroll: true });
    }

    return (
        <>
            <Head title="QR Pembayaran" />

            <div className="space-y-6 p-4">
                <div>
                    <h1 className="text-xl font-semibold">QR Pembayaran</h1>
                    <p className="text-sm text-muted-foreground">
                        Unggah QR code milik Anda. QR yang aktif akan dipakai untuk setiap transaksi QRIS.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ImageUp className="size-4" /> Unggah QR Code
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="label">Label (opsional)</Label>
                                <Input
                                    id="label"
                                    value={data.label}
                                    onChange={(event) => setData('label', event.target.value)}
                                    placeholder="Contoh: QRIS Utama"
                                />
                                <InputError message={errors.label} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="image">Gambar QR Code</Label>
                                <Input
                                    id="image"
                                    ref={fileRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(event) => setData('image', event.target.files?.[0] ?? null)}
                                />
                                <p className="text-xs text-muted-foreground">PNG, JPG, atau WEBP. Maksimal 2 MB.</p>
                                <InputError message={errors.image} />
                            </div>

                            <Button type="submit" disabled={processing || !data.image}>
                                Simpan QR Code
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {qrCodes.length === 0 && (
                        <Card className="sm:col-span-2 lg:col-span-3">
                            <CardContent className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                                <QrCodeIcon className="size-10" />
                                <p>Belum ada QR code. Unggah QR code Anda di atas.</p>
                            </CardContent>
                        </Card>
                    )}

                    {qrCodes.map((qrCode) => (
                        <Card key={qrCode.id} className={qrCode.is_active ? 'ring-2 ring-primary' : undefined}>
                            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
                                <CardTitle className="text-sm">
                                    {qrCode.label ?? `QR #${qrCode.id}`}
                                </CardTitle>
                                {qrCode.is_active ? (
                                    <Badge className="gap-1">
                                        <CheckCircle2 className="size-3" /> Aktif
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">Nonaktif</Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {qrCode.image_url && (
                                    <div className="flex justify-center rounded-lg border bg-white p-3">
                                        <img
                                            src={qrCode.image_url}
                                            alt={qrCode.label ?? 'QR Code'}
                                            className="size-40 object-contain"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!qrCode.is_active && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => handleActivate(qrCode)}
                                        >
                                            Jadikan Aktif
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleDelete(qrCode)}
                                    >
                                        <Trash2 className="mr-1 size-3" /> Hapus
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </>
    );
}
