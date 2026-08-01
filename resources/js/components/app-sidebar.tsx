import { Link, usePage } from '@inertiajs/react';
import { AwardIcon, BarChart3, Calendar, ChartArea, ChartCandlestick, ChefHat, ClipboardList, Clock, FileUserIcon, Grid3x3, HandCoinsIcon, HandPlatter, LayoutGrid, ListTodo, MapPin, ScissorsLineDashedIcon, Settings2, ShoppingCart, Tag, Users, Utensils, Wallet, Receipt } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import attendance from '@/routes/attendance';
import kitchen from '@/routes/kitchen';
import owner from '@/routes/owner';
import pos from '@/routes/pos';
import sessions from '@/routes/pos/sessions';
import waiter from '@/routes/waiter';
import type { NavItem } from '@/types';

type NavGroup = {
    label: string;
    roles: string[] | null;
    items: NavItem[];
};

export function AppSidebar() {
    const { auth } = usePage().props;
    const userRoles: string[] = (auth as { roles: string[] }).roles ?? [];
    const hasEmployee: boolean = (auth as { has_employee: boolean }).has_employee ?? false;
    const { setOpenMobile } = useSidebar();

    const hasAnyRole = (roles: string[] | null): boolean => {
        if (roles === null) {
return true;
}

        return roles.some((role) => userRoles.includes(role));
    };

    const navGroups: NavGroup[] = [
        {
            label: 'Platform',
            roles: null,
            items: [
                { title: 'Dashboard', href: dashboard(), icon: LayoutGrid },
            ],
        },
        {
            label: 'Owner',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Dashboard Owner', href: owner.dashboard(), icon: LayoutGrid },
            ],
        },
        {
            label: 'Management',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Menu Categories', href: admin.menuCategories.index(), icon: Tag },
                { title: 'Menus', href: admin.menus.index(), icon: Utensils },
                { title: 'Option Groups', href: admin.optionGroups.index(), icon: Settings2 },
                { title: 'Tables', href: admin.tables.index(), icon: Grid3x3 },
            ],
        },
        {
            label: 'Operations',
            roles: ['Owner', 'Admin', 'Cashier'],
            items: [
                { title: 'POS Kasir', href: pos.index(), icon: ShoppingCart },
                { title: 'Shift Kasir', href: sessions.index(), icon: Receipt },
            ],
        },
        {
            label: 'Kitchen',
            roles: ['Owner', 'Admin', 'Cashier', 'Kitchen Staff'],
            items: [
                { title: 'Kitchen Display', href: kitchen.index(), icon: ChefHat },
            ],
        },
        {
            label: 'Waiter',
            roles: ['Owner', 'Admin', 'Cashier', 'Waiter'],
            items: [
                { title: 'Siap Saji', href: waiter.ready(), icon: HandPlatter },
            ],
        },
        {
            label: 'Absensi',
            roles: null,
            items: [
                { title: 'Absensi', href: attendance.index(), icon: Clock },
                { title: 'Rekap Absensi', href: attendance.recap(), icon: ClipboardList },
            ],
        },
        {
            label: 'Employees',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Karyawan', href: admin.employees.index(), icon: Users },
                { title: 'Shift', href: admin.shifts.index(), icon: Calendar },
            ],
        },
        {
            label: 'Payroll',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Komponen Gaji', href: admin.salaryComponents.index(), icon: HandCoinsIcon },
                { title: 'Bonus', href: admin.bonuses.index(), icon: AwardIcon },
                { title: 'Potongan', href: admin.deductions.index(), icon: ScissorsLineDashedIcon },
                { title: 'Slip Gaji', href: admin.payslips.index(), icon: Wallet },
                { title: 'Laporan Payroll', href: admin.payroll.report(), icon: ChartArea },
                { title: 'Pengaturan Payroll', href: admin.payroll.settings(), icon: Settings2 },
            ],
        },
        {
            label: 'Reports Employee',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Kehadiran', href: admin.reports.attendance(), icon: FileUserIcon },
                { title: 'Lembur', href: admin.reports.overtime(), icon: BarChart3 },
                { title: 'Poin Waiter', href: admin.reports.waiterPoints(), icon: HandPlatter },
            ],
        },
        {
            label: 'Reports Financial',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Laporan Penjualan', href: admin.reports.index(), icon: ChartCandlestick },
                { title: 'Menu & Varian Terlaris', href: admin.reports.topMenus(), icon: HandPlatter },
                { title: 'Rekonsiliasi', href: admin.reports.reconciliation(), icon: BarChart3 },
            ],
        },
        {
            label: 'Security',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Log Aktivitas', href: admin.activityLogs.index(), icon: ListTodo },
            ],
        },
        {
            label: 'Settings',
            roles: ['Owner', 'Admin'],
            items: [
                { title: 'Pengaturan Outlet', href: '/admin/outlet-settings', icon: MapPin },
            ],
        },
    ];

    const visibleGroups = navGroups.filter((group) => {
        if (group.label === 'Absensi') {
            return hasEmployee || hasAnyRole(['Owner', 'Admin']);
        }

        return hasAnyRole(group.roles);
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch onClick={() => setOpenMobile(false)}>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {visibleGroups.map((group) => (
                    <NavMain key={group.label} label={group.label} items={group.items} />
                ))}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
