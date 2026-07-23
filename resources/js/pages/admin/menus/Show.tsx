import { Head, Link } from '@inertiajs/react';
import { Pencil, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OptionItem {
    id: number;
    name: string;
    price_adjustment: string | number;
    is_available: boolean;
}

interface OptionGroup {
    id: number;
    name: string;
    selection_type: string;
    is_required: boolean;
    option_items: OptionItem[];
}

interface MenuData {
    id: number;
    name: string;
    description: string | null;
    price: string | number;
    photo_path: string | null;
    is_available: boolean;
    category: { id: number; name: string };
    option_groups: OptionGroup[];
}

interface Props {
    menu: MenuData;
}

export default function MenusShow({ menu }: Props) {
    return (
        <>
            <Head title={menu.name} />

            <div className="mb-6 flex items-center gap-4">
                <Link href="/admin/menus">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="size-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-semibold">{menu.name}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Detail menu</p>
                </div>
                <Link href={`/admin/menus/${menu.id}/edit`}>
                    <Button>
                        <Pencil className="mr-2 size-4" />
                        Edit Menu
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                    <Card>
                        <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                            {menu.photo_path ? (
                                <img
                                    src={`/storage/${menu.photo_path}`}
                                    alt={menu.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="text-6xl text-muted-foreground/30">
                                    {menu.name.charAt(0)}
                                </span>
                            )}
                        </div>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-semibold">
                                    Rp {Number(menu.price).toLocaleString('id-ID')}
                                </span>
                                <Badge variant={menu.is_available ? 'default' : 'secondary'}>
                                    {menu.is_available ? 'Tersedia' : 'Habis'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6 lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Menu</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm text-muted-foreground">Kategori</span>
                                <p className="font-medium">{menu.category.name}</p>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">Deskripsi</span>
                                <p className="font-medium">{menu.description || '-'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Grup Opsi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {menu.option_groups.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Tidak ada grup opsi.</p>
                            ) : (
                                <div className="space-y-4">
                                    {menu.option_groups.map((group) => (
                                        <div key={group.id}>
                                            <div className="mb-2 flex items-center gap-2">
                                                <h4 className="font-medium">{group.name}</h4>
                                                <Badge variant="outline">
                                                    {group.selection_type === 'single' ? 'Pilih 1' : 'Pilih banyak'}
                                                </Badge>
                                                {group.is_required && (
                                                    <Badge variant="secondary">Wajib</Badge>
                                                )}
                                            </div>
                                            <div className="ml-2 space-y-1 border-l-2 pl-4">
                                                {group.option_items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm">
                                                        <span>{item.name}</span>
                                                        <span className="text-muted-foreground">
                                                            {Number(item.price_adjustment) > 0
                                                                ? `+Rp ${Number(item.price_adjustment).toLocaleString('id-ID')}`
                                                                : 'Gratis'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

MenusShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menu', href: '/admin/menus' },
        { title: 'Detail', href: '#' },
    ],
};
