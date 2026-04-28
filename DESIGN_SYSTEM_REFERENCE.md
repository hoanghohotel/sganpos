# Design System - Complete Reference

## Color System

### Primary Accent
```
Emerald-600: #059669
  - Use for: primary buttons, active states, focus rings, important accents
  - Hover: Emerald-700 (#047857)
  - Light: Emerald-50 (#f0fdf4), Emerald-100 (#dcfce7)
```

### Neutrals (Slate)
```
Slate-50:  #f8fafc  (lightest backgrounds)
Slate-100: #f1f5f9  (subtle backgrounds)
Slate-200: #e2e8f0  (borders, dividers)
Slate-400: #cbd5e1  (placeholders, icons)
Slate-500: #64748b  (secondary text)
Slate-600: #475569  (body text)
Slate-700: #334155  (strong text)
Slate-800: #1e293b  (headings)
Slate-900: #0f172a  (highest contrast)
```

### Semantic Colors
```
Success: #10b981 (emerald-600) - positive actions
Warning: #f59e0b (amber-500) - caution needed
Danger:  #ef4444 (red-500) - destructive actions
Info:    #3b82f6 (blue-500) - information
```

---

## Typography

### Font Family
```
Primary: "Inter", ui-sans-serif, system-ui, sans-serif
Mono:    "JetBrains Mono", ui-monospace, SFMono-Regular, monospace
```

### Type Scale
```
h1: 32px (2xl), font-bold, tracking-tight
h2: 28px (xl), font-bold, tracking-tight
h3: 24px (lg), font-bold
h4: 20px (base), font-semibold
h5: 16px (sm), font-semibold

Body: 16px (1rem), font-medium, leading-relaxed
Small: 14px (0.875rem), font-medium
Tiny: 12px (0.75rem), font-medium
```

### Font Weights
```
400: Regular text
500: Medium emphasis
600: Semibold (headers, labels)
700: Bold (strong emphasis)
800: Extra bold (importance)
```

---

## Spacing Scale (8px Grid)

```
gap-2:  8px   (small gaps between items)
gap-4:  16px  (standard gaps between items)
gap-6:  24px  (large gaps between sections)
gap-8:  32px  (xl gaps)

p-4:    16px  (padding inside inputs)
p-6:    24px  (standard card padding)
p-8:    32px  (large section padding)
```

### Recommended Usage
```
- Between elements: gap-2, gap-4
- Between sections: gap-6
- Inside cards: p-6
- Inside inputs: px-4 py-3 (standard)
- Container padding: p-6 sm:p-8
```

---

## Components

### Buttons

**Primary Button**
```tsx
className="button-primary"
// bg-emerald-600, text-white
// Hover: bg-emerald-700
// Active: bg-emerald-800
// Height: 48px (h-12)
```

**Secondary Button**
```tsx
className="button-secondary"
// bg-slate-100, text-slate-900
// Hover: bg-slate-200
// Height: 48px
```

**Ghost Button**
```tsx
className="button-ghost"
// No background
// text-slate-700
// Hover: bg-slate-100
```

**Danger Button**
```tsx
className="button-danger"
// bg-red-600, text-white
// Use for delete/remove actions
```

### Cards

**Standard Card**
```tsx
className="card-base"
// bg-white, border border-slate-200
// rounded-lg, shadow-sm
// p-6
```

**Interactive Card**
```tsx
className="card-interactive"
// Same as card-base
// Plus: hover:border-slate-300, hover:shadow-md
// Cursor: pointer
```

### Inputs

**Text Input**
```tsx
className="input-base input-focus"
// Height: 48px (h-12)
// Padding: px-4
// Border: border-slate-200
// Focus: border-emerald-500, ring-2 ring-emerald-100
// Border radius: rounded-lg
```

### Badges

**Success Badge**
```tsx
className="badge-success"
// bg-emerald-100, text-emerald-700
// px-3 py-1.5, rounded-full
```

**Danger Badge**
```tsx
className="badge-danger"
// bg-red-100, text-red-700
```

**Warning Badge**
```tsx
className="badge-warning"
// bg-amber-100, text-amber-700
```

**Info Badge**
```tsx
className="badge-info"
// bg-blue-100, text-blue-700
```

### Modals

**Modal Structure**
```tsx
<Modal isOpen={true} onClose={handleClose}>
  {/* Content */}
</Modal>

// Features:
// - Backdrop blur
// - Smooth animations
// - Configurable size (sm, md, lg)
// - Built-in close button
// - Optional footer with buttons
```

---

## Shadows

```
shadow-sm:  0 1px 2px 0 rgba(0,0,0,0.05)
shadow-md:  0 4px 6px -1px rgba(0,0,0,0.1)
shadow-lg:  0 10px 15px -3px rgba(0,0,0,0.1)
shadow-xl:  0 20px 25px -5px rgba(0,0,0,0.1)
```

**Usage**
```
- Cards: shadow-sm
- Hovered cards: shadow-md
- Modals: shadow-lg
- Dropdowns/floating: shadow-lg
```

---

## Border Radius

```
rounded-lg:  0.5rem (8px) - inputs, buttons, cards
rounded-2xl: 1rem (16px) - modals, large components
rounded-full: 9999px - pills, badges
```

---

## Responsive Breakpoints

```
mobile:  default (< 640px)
sm:      640px  (small)
md:      768px  (medium)
lg:      1024px (large)
xl:      1280px (extra large)
2xl:     1536px (2x extra large)
```

**Example**
```tsx
className="p-4 sm:p-6 md:p-8 lg:grid-cols-2"
// Mobile: p-4
// Small+: p-6
// Medium+: p-8
// Large+: 2 columns
```

---

## Animation Principles

### Transitions
```
Duration: 150ms (default)
Easing: ease-out
Property: all
```

### Hover Effects
```
scale: 1.02 (slight growth)
opacity: change to 0.8
shadow: upgrade by one level
color: change to accent (emerald)
```

### Click Effects
```
scale: 0.98 (slight shrink)
Active state visual feedback
```

---

## Form Patterns

### Input Group
```tsx
<FormGroup label="Label" required>
  <Input placeholder="Enter value" />
</FormGroup>
```

### Select
```tsx
<FormGroup label="Choose">
  <Select 
    options={[
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' }
    ]}
  />
</FormGroup>
```

### Checkbox
```tsx
<Checkbox label="Accept terms" />
```

### Textarea
```tsx
<FormGroup label="Description">
  <TextArea placeholder="Enter details" rows={4} />
</FormGroup>
```

---

## Table Patterns

### Basic Table
```tsx
<Table>
  <TableHead>
    <TableRow>
      <TableHeaderCell>Name</TableHeaderCell>
      <TableHeaderCell align="right">Price</TableHeaderCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id}>
        <TableData>{item.name}</TableData>
        <TableData align="right">{item.price}đ</TableData>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Empty State
```tsx
<TableEmptyState 
  title="No data"
  description="Create your first item to get started"
  icon={<Icon />}
/>
```

---

## Dark Mode (Reserved for Future)

```
Will use a separate color palette:
- bg-slate-900 for backgrounds
- bg-slate-800 for cards
- text-slate-50 for text
- Similar accent color (emerald)
```

---

## Accessibility

### Color Contrast
```
✅ Text on white: Slate-600+ (AAA compliance)
✅ Text on slate-100: Slate-700+ (AAA compliance)
✅ Emerald buttons: Good contrast for white text
✅ Avoid red/green only indicators
```

### Keyboard Navigation
```
✅ All buttons/inputs: Tab focusable
✅ Focus ring: 2px ring-emerald-100
✅ Visual feedback: Clear focus states
```

### ARIA Labels
```
- Buttons: aria-label for icon buttons
- Inputs: Associated labels via <label>
- Modals: role="dialog", aria-modal="true"
- Tables: role="table", proper header structure
```

---

## Do's and Don'ts

### DO ✅
- Use emerald-600 for primary accents
- Use slate grayscale for neutrals
- Maintain 48px button/input height
- Use gap-based spacing
- Provide hover states
- Use semantic HTML
- Test on mobile

### DON'T ❌
- Mix multiple accent colors
- Use arbitrary colors (use design tokens)
- Forget focus states
- Hardcode colors (use utility classes)
- Skip responsive design
- Ignore accessibility
- Use too many shadows

---

## File Structure

```
src/
├── index.css                    # Design system (170+ lines)
├── components/
│   ├── ModalForm.tsx           # Modal & form components
│   ├── DataTable.tsx           # Table components
│   └── Logo.tsx
├── pages/
│   ├── LoginPage.tsx           # Redesigned ✅
│   ├── DashboardPage.tsx       # Redesigned ✅
│   ├── POSPage.tsx             # Partial ⚠️
│   └── ...
└── lib/
    └── utils.ts                # cn() utility
```

---

## Performance Checklist

- [ ] Use CSS utilities instead of inline styles
- [ ] Batch Tailwind classes
- [ ] Minimize custom CSS
- [ ] Use appropriate shadow levels
- [ ] Prefer built-in components over custom
- [ ] Lazy load modals (load content only when open)
- [ ] Use memoization for large lists

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (all modern)

---

**Last Updated**: 2026-04-28  
**Version**: 1.0  
**Status**: Production Ready
