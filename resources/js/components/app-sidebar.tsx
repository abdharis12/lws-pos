import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ChefHat, FolderGit2, Grid3x3, LayoutGrid, Settings2, ShoppingCart, Tag, Users, Utensils } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
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
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import admin from '@/routes/admin';
import pos from '@/routes/pos';
import kitchen from '@/routes/kitchen';
import type { NavItem } from '@/types';

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

type NavGroup = {
    label: string;
    roles: string[] | null;
    items: NavItem[];
};

export function AppSidebar() {
    const { auth } = usePage().props;
    const userRoles: string[] = (auth as { roles: string[] }).roles ?? [];

    const hasAnyRole = (roles: string[] | null): boolean => {
        if (roles === null) return true;
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
            label: 'Management',
            roles: ['Owner', 'Admin', 'Cashier', 'Kitchen Staff', 'Waiter'],
            items: [
                { title: 'Menu Categories', href: admin.menuCategories.index(), icon: Tag },
                { title: 'Menus', href: admin.menus.index(), icon: Utensils },
                { title: 'Option Groups', href: admin.optionGroups.index(), icon: Settings2 },
                { title: 'Tables', href: admin.tables.index(), icon: Grid3x3 },
                { title: 'Employees', href: admin.employees.index(), icon: Users },
            ],
        },
        {
            label: 'Operations',
            roles: ['Owner', 'Admin', 'Cashier'],
            items: [
                { title: 'POS Kasir', href: pos.index(), icon: ShoppingCart },
            ],
        },
        {
            label: 'Kitchen',
            roles: ['Owner', 'Admin', 'Cashier', 'Kitchen Staff'],
            items: [
                { title: 'Kitchen Display', href: kitchen.index(), icon: ChefHat },
            ],
        },
    ];

    const visibleGroups = navGroups.filter((group) => hasAnyRole(group.roles));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
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
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
