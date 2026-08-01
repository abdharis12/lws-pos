import { ChefHat, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    orderCount: number;
    soundEnabled: boolean;
    onSoundToggle: () => void;
}

export default function KitchenHeader({
    orderCount,
    soundEnabled,
    onSoundToggle,
}: Props) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);

        return () => clearInterval(id);
    }, []);

    return (
        <div
            className="sticky top-0 z-20 -mx-4 -mt-4 mb-6 px-4 pt-4 pb-4"
            style={{
                backgroundColor: 'rgba(35,52,51,0.92)',
                backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgb(177, 163, 125)',
            }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="flex size-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: '#4F6B6A' }}
                >
                    <ChefHat className="size-5" style={{ color: '#CFC0A4' }} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white">
                        Kitchen Display
                    </h1>
                    <p className="text-xs text-white/40">
                        Update terakhir{' '}
                        {now.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <span
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                        </span>
                        <span className="text-white/60">
                            {orderCount} pesanan
                        </span>
                    </span>

                    <button
                        onClick={onSoundToggle}
                        className="flex size-8 items-center justify-center rounded-lg transition-all hover:bg-white/10"
                        title={
                            soundEnabled
                                ? 'Nonaktifkan suara'
                                : 'Aktifkan suara'
                        }
                    >
                        {soundEnabled ? (
                            <Volume2 className="size-4 text-white/60" />
                        ) : (
                            <VolumeX className="size-4 text-white/40" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
