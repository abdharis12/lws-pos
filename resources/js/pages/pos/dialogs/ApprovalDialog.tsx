import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BORDER, CREAM, INK, MUTED, PRIMARY } from '../constants';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    password: string;
    onPasswordChange: (password: string) => void;
    onSubmit: () => void;
    error: string;
    processing: boolean;
}

export default function ApprovalDialog({ open, onOpenChange, password, onPasswordChange, onSubmit, error, processing }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm" style={{ backgroundColor: CREAM }}>
                <DialogHeader>
                    <DialogTitle style={{ color: INK }}>Persetujuan Diskon</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: MUTED }}>
                        Diskon ini melebihi batas yang diizinkan. Masukkan password Admin/Owner untuk menyetujui.
                    </p>
                    <div>
                        <Label style={{ color: INK }}>Password Admin/Owner</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={e => onPasswordChange(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && onSubmit()}
                            placeholder="Masukkan password..."
                            className="mt-1"
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button onClick={onSubmit} className="w-full" disabled={processing || !password} style={{ backgroundColor: PRIMARY }}>
                        {processing ? 'Memverifikasi...' : 'Setujui Diskon'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
