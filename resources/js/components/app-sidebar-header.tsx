import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

const CREAM = '#F6F2E9';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header
            className="flex h-16 shrink-0 items-center gap-2 border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4"
            style={{ borderColor: 'rgba(37,51,47,0.08)', backgroundColor: CREAM }}
        >
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-[#4F6B6A] hover:text-[#233433]" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
        </header>
    );
}
