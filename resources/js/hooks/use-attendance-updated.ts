import { router, usePage } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';

interface AttendanceUpdatedPayload {
    attendance: {
        id: number;
        employee_id: number;
        clock_in_at: string | null;
        clock_out_at: string | null;
        status: string;
    };
}

export function useAttendanceUpdated(): void {
    const { auth } = usePage<{ auth: { outlet_id?: number } }>().props;
    const outletId = auth?.outlet_id;

    useEcho<AttendanceUpdatedPayload>(
        outletId ? `outlet.${outletId}.attendance` : '',
        '.AttendanceUpdated',
        () => {
            router.reload({
                only: ['attendances', 'todayAttendance', 'stats'],
            });
        },
        [outletId],
    );
}
