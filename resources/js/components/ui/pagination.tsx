import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginationLink[];
}

interface Props {
    meta: PaginationMeta;
    onPerPageChange?: (perPage: number) => void;
    perPage?: number;
}

export function Pagination({ meta, onPerPageChange, perPage = 50 }: Props) {
    if (meta.last_page <= 1) return null;

    return (
        <div className="flex flex-col items-center gap-3 border-t px-4 py-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
                <p className="whitespace-nowrap text-sm text-muted-foreground">
                    Menampilkan <span className="font-medium">{meta.from ?? 0}</span>
                    {'–'}
                    <span className="font-medium">{meta.to ?? 0}</span> dari{' '}
                    <span className="font-medium">{meta.total}</span>
                </p>

                {onPerPageChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Per halaman</span>
                        <Select
                            value={String(perPage)}
                            onValueChange={(v) => onPerPageChange(Number(v))}
                        >
                            <SelectTrigger className="h-8 w-16">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[20, 50, 100].map((n) => (
                                    <SelectItem key={n} value={String(n)}>
                                        {n}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                {meta.links.map((link, i) => {
                    if (link.label.includes('Previous')) {
                        return link.url ? (
                            <Link key={i} href={link.url} preserveScroll preserveState>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <ChevronLeft className="size-4" />
                                </Button>
                            </Link>
                        ) : (
                            <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                                <ChevronLeft className="size-4 text-muted-foreground/50" />
                            </Button>
                        );
                    }

                    if (link.label.includes('Next')) {
                        return link.url ? (
                            <Link key={i} href={link.url} preserveScroll preserveState>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <ChevronRight className="size-4" />
                                </Button>
                            </Link>
                        ) : (
                            <Button key={i} variant="outline" size="sm" className="h-8 w-8 p-0" disabled>
                                <ChevronRight className="size-4 text-muted-foreground/50" />
                            </Button>
                        );
                    }

                    const isEllipsis = link.label.includes('...');

                    if (!link.url || isEllipsis) {
                        return (
                            <span
                                key={i}
                                className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
                            >
                                {isEllipsis ? '⋯' : link.label}
                            </span>
                        );
                    }

                    return (
                        <Link key={i} href={link.url} preserveScroll preserveState>
                            <Button
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                className={`h-8 min-w-8 px-2 text-xs ${
                                    link.active ? '' : 'text-muted-foreground'
                                }`}
                            >
                                {link.label}
                            </Button>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
