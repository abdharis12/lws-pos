import { Head, Link, router } from '@inertiajs/react';
import { Plus, Pencil, Trash2, EyeOff, Eye } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MenuCategory {
    id: number;
    name: string;
}

interface MenuItem {
    id: number;
    name: string;
    description: string | null;
    price: string | number;
    photo_path: string | null;
    is_available: boolean;
    category: MenuCategory;
}

interface Props {
    menus: MenuItem[];
    categories: MenuCategory[];
}

export default function MenusIndex({ menus, categories }: Props) {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');

    const filtered = menus.filter((m) => {
        const matchName = m.name.toLowerCase().includes(search.toLowerCase());
        const matchCat = categoryFilter === 'all' || m.category.id === Number(categoryFilter);

        return matchName && matchCat;
    });

    function toggleAvailability(menuId: number) {
        router.patch(`/admin/menus/${menuId}/toggle-availability`);
    }

    function destroy(menuId: number) {
        if (confirm('Hapus menu ini?')) {
            router.delete(`/admin/menus/${menuId}`);
        }
    }

    return (
        <>
            <Head title="Menu" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Menu</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Kelola daftar menu restoran</p>
                </div>
                <Link href="/admin/menus/create">
                    <Button>
                        <Plus className="mr-2 size-4" />
                        Tambah Menu
                    </Button>
                </Link>
            </div>

            <div className="mb-6 flex flex-wrap gap-4">
                <Input
                    placeholder="Cari menu..."
                    className="max-w-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-44">
                        <SelectValue placeholder="Semua kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((menu) => (
                    <Card key={menu.id} className="overflow-hidden">
                        <div className="flex aspect-video items-center justify-center bg-muted text-muted-foreground">
                            {menu.photo_path ? (
                                <img
                                    src={`/storage/${menu.photo_path}`}
                                    alt={menu.name}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <span className="font-display text-4xl text-muted-foreground/30">
                                    {menu.name.charAt(0)}
                                </span>
                            )}
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-lg">{menu.name}</CardTitle>
                                    <span className="text-xs text-muted-foreground">{menu.category.name}</span>
                                </div>
                                <Badge variant={menu.is_available ? 'default' : 'secondary'}>
                                    {menu.is_available ? 'Tersedia' : 'Habis'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-semibold">
                                    Rp {Number(menu.price).toLocaleString('id-ID')}
                                </span>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => toggleAvailability(menu.id)}>
                                        {menu.is_available ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </Button>
                                    <Link href={`/admin/menus/${menu.id}/edit`}>
                                        <Button variant="ghost" size="icon">
                                            <Pencil className="size-4" />
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="icon" onClick={() => destroy(menu.id)}>
                                        <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filtered.length === 0 && (
                    <p className="col-span-full py-8 text-center text-muted-foreground">
                        Tidak ada menu ditemukan.
                    </p>
                )}
            </div>
        </>
    );
}

MenusIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Menu', href: '/admin/menus' },
    ],
};
