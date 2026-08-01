# Design System Documentation

## Overview

This design system ensures consistency across the LWS POS application, following the shift kasir (cashier shift) interface patterns.

## Color Palette

### Primary Colors
- **Primary (Dark Teal)**: `#4F6B6A`
  - Used for: Primary buttons, headers, active states, navigation highlights
- **Secondary (Sand/Cream)**: `#CFC0A4`
  - Used for: Accents, borders, hover states, secondary elements

### Background Colors
- **Cream Background**: `#F6F2E9` - Main app background
- **White**: `#FFFFFF` - Cards, modals, panels
- **Dark Background**: `#233433` - Sidebar, hero sections

### Text Colors
- **Ink (Primary Text)**: `#25332F` - Main content text
- **Muted Text**: `#5c6a66` - Secondary text, labels
- **Light Gray**: `#64748b` - Tertiary text, timestamps

### Border Colors
- **Default Border**: `rgba(37,51,47,0.08)` - Card borders
- **Muted Border**: `oklch(0.80 0.038 88.5 / 0.35)` - Form elements

### Status Colors
- **Success**: `#059669` (Emerald-500)
- **Warning**: `#f59e0b` (Amber-500)
- **Danger**: `#e11d48` (Rose-500)
- **Info**: `#3b82f6` (Sky-500)

## Typography

### Font Families
- **Sans**: `Instrument Sans`, system-ui, sans-serif
- **Display/Serif**: `Fraunces`, Georgia, serif

### Text Styles

| Style | Font Family | Size | Weight | Line Height |
|-------|-------------|------|--------|-------------|
| Display Large | Fraunces | 3xl | 700 | 1.15 |
| Display Medium | Fraunces | 2xl | 600 | 1.2 |
| Body Large | Instrument Sans | 1rem | 400 | 1.5 |
| Body Default | Instrument Sans | 0.875rem | 400 | 1.5 |
| Caption | Instrument Sans | 0.75rem | 400 | 1.4 |
| Label | Instrument Sans | 0.75rem | 500 | 1.3 |

## Components

### Buttons

#### Primary Button
```jsx
<Button
    className="gap-2 font-serif font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02]"
    style={{ backgroundColor: '#4F6B6A' }}
>
    <Wallet className="size-4" />
    Buka Session Sekarang
</Button>
```

**States:**
- Default: `#4F6B6A` background, white text
- Hover: Scale `1.02`, enhanced shadow
- Disabled: `opacity-50`

#### Outline Button
```jsx
<Button variant="outline" className="font-medium" style={{ borderColor: BORDER }}>
    Batal
</Button>
```

**Styles:**
- Border: `#CFC0A4` or theme border
- Text: `#64748b`
- Background: `#F6F2E9` on hover

#### Ghost Button
```jsx
<Button variant="ghost">
    <Eye className="size-3.5" />
    Detail
</Button>
```

### Cards

#### Standard Card
```jsx
<Card className="overflow-hidden border-0 shadow-lg shadow-slate-900/5" style={{ backgroundColor: '#fff' }}>
    <CardHeader className="border-b px-6 py-5" style={{ borderColor: BORDER }}>
        <CardTitle className="font-serif text-lg font-bold" style={{ color: INK }}>
            Riwayat Session
        </CardTitle>
    </CardHeader>
    <CardContent className="p-6">
        {/* Content */}
    </CardContent>
</Card>
```

**Card Features:**
- No border (`border-0`)
- Subtle shadow
- White background
- Header with bottom border
- Consistent padding: `px-6 py-5`

### Dialogs/Modals

```jsx
<Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
    <DialogContent className="sm:max-w-sm" style={{ backgroundColor: '#fff' }}>
        <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold" style={{ color: INK }}>
                Buka Session Baru
            </DialogTitle>
            <p className="text-xs" style={{ color: 'oklch(0.60 0.03 88.5)' }}>
                Masukkan uang awal untuk hari ini
            </p>
        </DialogHeader>
        {/* Form content */}
    </DialogContent>
</Dialog>
```

**Dialog Styles:**
- Max width: `sm:max-w-sm` or `sm:max-w-lg`
- White background
- Rounded corners
- Overlay with backdrop

### Cards with Accent

```jsx
<div className="group relative overflow-hidden border-[#CFC0A4]/40 bg-[#4F6B6A]/5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10 rounded-2xl p-5">
    {/* Accent line */}
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
    {/* Content */}
</div>
```

**Features:**
- Rounded corners (`rounded-2xl`)
- Accent gradient line at top
- Hover effects: lift + shadow
- Border with muted color

### Badge/Chip

```jsx
<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
    <CheckCircle2 className="size-3" />
    Aktif
</span>
```

**Status Colors:**
- Active: `bg-emerald-50 text-emerald-700`
- Closed: `bg-slate-100 text-slate-500`
- Warning: `bg-amber-50 text-amber-700`

### Empty State

```jsx
<div className="flex flex-col items-center px-6 py-12 text-center">
    <div className="mb-4 flex size-16 items-center justify-center rounded-2xl" style={{ backgroundColor: INK_LIGHT }}>
        <Clock className="size-8" style={{ color: INK }} />
    </div>
    <h2 className="font-serif text-xl font-bold" style={{ color: INK }}>Belum Ada Session Aktif</h2>
    <p className="mt-1 max-w-sm text-sm" style={{ color: 'oklch(0.60 0.03 88.5)' }}>
        Buka session baru untuk mulai mencatat transaksi hari ini.
    </p>
    <Button onClick={() => setSessionDialogOpen(true)} className="mt-6 gap-2">
        <Wallet className="size-4" />
        Buka Session Sekarang
    </Button>
</div>
```

**Empty State Elements:**
- Large icon circle with light background
- Centered layout
- Clear CTA button
- Helper text

### Input Fields

```jsx
<Input 
    type="number" 
    min="0" 
    placeholder="0"
    value={sessionOpeningBalance}
    onChange={e => setSessionOpeningBalance(e.target.value)}
    className="h-11 border-2 text-base font-medium shadow-sm transition-all focus:border-emerald-500 focus:ring-emerald-500"
    style={{ borderColor: BORDER }}
/>
```

**Input Features:**
- Border: `2px` solid
- Focus state: Emerald border + ring
- Height: `h-11`

### Table

```jsx
<table className="w-full text-left text-sm">
    <thead>
        <tr className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'oklch(0.60 0.03 88.5)', backgroundColor: CREAM }}>
            <th className="px-6 py-3">Tanggal</th>
        </tr>
    </thead>
    <tbody className="divide-y" style={{ borderColor: BORDER }}>
        <tr className="transition-colors hover:bg-slate-50" style={{ borderColor: BORDER }}>
            <td className="px-6 py-3.5">Content</td>
        </tr>
    </tbody>
</table>
```

**Table Features:**
- Uppercase header with tracking
- Hover rows
- Subtle borders
- Consistent padding

### Navigation Tabs

```jsx
<div className="flex gap-1 overflow-x-auto px-5 pt-4 pb-2">
    {categories.map(cat => (
        <button 
            key={cat.id} 
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                selectedCategoryId === cat.id ? 'text-white shadow-sm' : 'hover:opacity-80'
            }`}
            style={{ 
                backgroundColor: selectedCategoryId === cat.id ? INK : 'oklch(0.48 0.032 195.5 / 0.06)', 
                color: selectedCategoryId === cat.id ? '#fff' : INK 
            }}
        >
            {cat.name}
        </button>
    ))}
</div>
```

**Tab Features:**
- Rounded tabs
- Active state: Dark teal background
- Horizontal scroll on mobile

## Spacing Scale

| Size | Value |
|------|-------|
| xs | 0.25rem (4px) |
| sm | 0.5rem (8px) |
| md | 1rem (16px) |
| lg | 1.5rem (24px) |
| xl | 2rem (32px) |
| 2xl | 3rem (48px) |
| 3xl | 4rem (64px) |

## Border Radius

| Size | Value |
|------|-------|
| sm | 0.25rem (4px) |
| md | 0.375rem (6px) |
| lg | 0.5rem (8px) |
| xl | 0.75rem (12px) |
| 2xl | 1rem (16px) |
| 3xl | 1.5rem (24px) |
| full | 9999px |

## Shadows

| Type | CSS |
|------|-----|
| xs | `shadow-xs` |
| sm | `shadow-sm` |
| md | `shadow-md` |
| lg | `shadow-lg` |
| xl | `shadow-xl` |

## Layout

### Max Width Containers
- Standard: `max-w-7xl` (80rem / 1280px)
- Form: `sm:max-w-sm` or `sm:max-w-lg`

### Sidebars
- Desktop: `w-80` (20rem / 320px)
- Wide sidebar: `w-96` (24rem / 384px)
- Icon-only: `w-(--sidebar-width-icon)` (3rem)

## Responsive Breakpoints

| Breakpoint | Class | Width |
|------------|-------|-------|
| Mobile | Default | <640px |
| Tablet | `sm:` | ≥640px |
| Desktop | `lg:` | ≥1024px |

## Accessibility

- Focus ring: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Contrast ratio: Ensure minimum 4.5:1 for text
- Touch targets: Minimum 44x44px
- Screen reader: Use `sr-only` for visually hidden content

## Implementation Guidelines

### Color Usage

1. **Primary (#4F6B6A)**
   - Main brand color
   - Primary actions
   - Active states
   - Headers

2. **Secondary (#CFC0A4)**
   - Accents and highlights
   - Hover states
   - Borders
   - Background highlights

3. **Background (#F6F2E9)**
   - Main app background
   - Card backgrounds
   - Subtle elements

### Icon Usage

- **Size**: Use `size-{n}` pattern (e.g., `size-4`, `size-8`)
- **Color**: Inherit from parent or use inline style
- **Libraries**: `lucide-react`

### Spacing Pattern

- Vertical: `gap-{n}`, `space-y-{n}`
- Horizontal: `gap-x-{n}`, `space-x-{n}`
- Padding: `p-{n}`, `px-{n}`, `py-{n}`
- Margin: `m-{n}`, `mx-{n}`, `my-{n}`

### Animation

- Duration: `transition-all duration-200`
- Hover: `hover:scale-[1.02]`
- Active: `active:scale-95`

## Examples

### Card with Gradient Accent

```jsx
<div className="group relative overflow-hidden border-[#CFC0A4]/40 bg-[#4F6B6A]/5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10 rounded-2xl p-5">
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <Wallet className="size-7" />
        Uang Awal
    </div>
    <p className="mt-2 font-serif text-xl font-bold text-primary">
        {formatCurrency(currentSession.opening_balance)}
    </p>
</div>
```

### Status Badge

```jsx
<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold">
    {s.status === 'open' ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
    {s.status === 'open' ? 'Aktif' : 'Ditutup'}
</span>
```

### Icon Circle

```jsx
<div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
    <TrendingUp className="size-5 text-white" />
</div>
```


## Stats Cards (Attendance Pattern)

Used for displaying key metrics with icons in the attendance and similar pages.

### Basic Stats Card

```jsx
<Card className="group relative overflow-hidden border-[#CFC0A4]/40 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#4F6B6A]/10">
    {/* Accent line at top - varies by card */}
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4F6B6A] to-[#CFC0A4]" />
    
    <CardHeader className="flex flex-row items-start justify-between pt-5">
        <div>
            <CardTitle className="text-[15px] font-semibold uppercase tracking-[0.12em] text-[#4F6B6A]/70">
                Hadir
            </CardTitle>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F6B6A]/10">
            <CheckCircle2 className="h-4.5 w-4.5 text-[#4F6B6A]" strokeWidth={2} />
        </div>
    </CardHeader>
    
    <CardContent>
        <p className="font-serif text-4xl font-bold tracking-tight text-[#4F6B6A]">
            {stats.hadir}
        </p>
        <p className="mt-1.5 text-xs text-slate-500">
            Dari <span className="font-medium text-slate-700">{stats.total_karyawan}</span> karyawan
        </p>
    </CardContent>
</Card>
```

### Variations

**Gradient Direction 2:**
```jsx
<div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#CFC0A4] to-[#4F6B6A]" />
```

**Solid Accent Line:**
```jsx
<div className="absolute inset-x-0 top-0 h-1 bg-[#4F6B6A]" />
```

### Props Reference

| Prop | Value | Description |
|------|-------|-------------|
| `border` | `#CFC0A4/40` | Muted sand border |
| `shadow` | `-[#4F6B6A]/10` | Subtle teal shadow on hover |
| `hover` | `-translate-y-0.5` | Lift effect |
| `label` | `tracking-[0.12em]` | Uppercase with tracking |
| `value` | `font-serif text-4xl` | Large serif font |
| `icon` | `h-9 w-9 rounded-full` | Circular icon container |

### Icon Colors

| Element | Color |
|---------|-------|
| Primary icon | `#4F6B6A` |
| Icon background | `#4F6B6A/10` or `#CFC0A4/25` |
| Label | `#4F6B6A/70` |
| Value | `#4F6B6A` |
| Description | `text-slate-500` |

## Version

- **Version**: 1.0.0
- **Last Updated**: August 2026
- **Framework**: Laravel + Inertia + React
- **Styling**: Tailwind CSS 4.x
