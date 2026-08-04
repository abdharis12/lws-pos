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
                    <p className="text-xs text-white/80">
                        Update terakhir{' '}
                        {now.toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </p>
                </div>

                <div className="ml-auto flex items-center gap-3">
                    <span
                        className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs bg-primary"
                    >
                        <span className="relative flex size-2">
                            <span className="absolute inline-flex size-2 animate-ping rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                        </span>
                        <span className="text-secondary">
                            {orderCount} pesanan
                        </span>
                    </span>

                    <button
                        onClick={onSoundToggle}
                        className="flex text-secondary size-8 items-center justify-center rounded-lg transition-all bg-primary hover:bg-primary/80 cursor-pointer"
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
