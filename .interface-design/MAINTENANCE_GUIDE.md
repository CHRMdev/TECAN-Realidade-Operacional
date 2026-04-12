# TECAN Interface System - Maintenance Guide

## Quick Reference

### Color Palette Quick Access
All colors defined in `frontend/tailwind.config.js`:

```javascript
// Brand Colors
cargo.primary    → #005eb8 (main brand blue)
cargo.dark       → #004494 (hover state)
cargo.light      → #1a7fd4 (highlights)

// Accent Colors
accent.terracotta → #c95f3a (secondary actions)
accent.amber     → #d97706 (warnings)
accent.sage      → #6b8e7f (tertiary)

// Warm Base
warm.cream       → #f5f1ed (page background)
warm.light       → #faf8f6 (section backgrounds)
warm.dark        → #e5ddd4 (borders)

// Semantic Colors
semantic.success → #059669 (confirmations)
semantic.warning → #d97706 (cautions)
semantic.danger  → #dc2626 (errors)
semantic.info    → #005eb8 (information)
```

### CSS Variables
All colors also available as CSS custom properties in `src/index.css`:

```css
--color-cargo-primary: #005eb8;
--color-terracotta: #c95f3a;
--color-warm-cream: #f5f1ed;
/* ... and more */
```

---

## Adding New Components

### Step 1: Follow Component Pattern

All UI components in `src/components/ui/`:
```typescript
// Example: New component
interface NewComponentProps {
  variant?: 'primary' | 'secondary'; // Use semantic variants
  className?: string; // Allow class override
}

export function NewComponent({ variant = 'primary', className }: NewComponentProps) {
  return (
    <div className={clsx(
      'base-styles',
      {
        'cargo-primary text-white hover:bg-cargo-dark': variant === 'primary',
        'border border-warm-dark hover:border-cargo-primary': variant === 'secondary',
      },
      className
    )}>
      {/* content */}
    </div>
  );
}
```

### Step 2: Use Design System Values
- **Colors**: Use `cargo-*`, `accent-*`, `warm-*`, `semantic-*` classes
- **Spacing**: Use `gap-xs`, `p-md`, `m-lg`, etc.
- **Borders**: Use `border-warm-dark` for primary borders
- **Focus**: Always add `focus-visible:ring-2 focus-visible:ring-cargo-primary`

### Step 3: Test Accessibility
- Verify focus states are visible
- Check color contrast (use WebAIM or similar)
- Test with keyboard navigation
- Test on mobile devices

---

## Modifying Existing Components

### When to Update

**Maintain existing prop interface** - don't rename or remove props

**Do update**: Only styling and visual presentation

**Example**: Updating Button sizes
```typescript
// ❌ DON'T do this:
'px-4 py-2 text-sm': size === 'md', // OLD

// ✅ DO this:
'px-md py-sm text-sm': size === 'md', // Using spacing scale
```

### Color Updates

If you need to change a component's primary color:

```typescript
// ❌ WRONG - Uses hardcoded color
className="bg-blue-500 hover:bg-blue-600"

// ✅ CORRECT - Uses design system
className="bg-cargo-primary hover:bg-cargo-dark"

// ✅ ALSO OK - With custom prop
interface Props {
  color?: 'cargo' | 'terracotta';
}
```

---

## Styling Guidelines

### Do's ✅

1. **Use Tailwind classes exclusively**
   ```jsx
   className="bg-white border border-warm-dark rounded-md"
   ```

2. **Use spacing scale**
   ```jsx
   className="p-lg gap-md m-sm"
   ```

3. **Use semantic color names**
   ```jsx
   className="text-semantic-danger bg-semantic-danger/10"
   ```

4. **Add focus states**
   ```jsx
   className="focus-visible:ring-2 focus-visible:ring-cargo-primary"
   ```

5. **Use clsx for conditionals**
   ```jsx
   className={clsx('base', {
     'cargo-primary': variant === 'primary',
     'accent-terracotta': variant === 'secondary',
   })}
   ```

### Don'ts ❌

1. **Don't use arbitrary values**
   ```jsx
   // ❌ WRONG
   className="bg-[#123456]"
   // ✅ CORRECT - Add to tailwind.config.js first
   className="bg-cargo-primary"
   ```

2. **Don't inline styles**
   ```jsx
   // ❌ WRONG
   style={{ color: '#005eb8' }}
   // ✅ CORRECT
   className="text-cargo-primary"
   ```

3. **Don't hardcode old colors**
   ```jsx
   // ❌ WRONG - Old dark mode colors
   className="bg-slate-900 text-slate-100"
   // ✅ CORRECT
   className="bg-white text-gray-900"
   ```

4. **Don't forget focus states**
   ```jsx
   // ❌ WRONG
   <input className="border border-warm-dark" />
   // ✅ CORRECT
   <input className="border border-warm-dark focus-visible:ring-2 focus-visible:ring-cargo-primary" />
   ```

5. **Don't break accessibility**
   ```jsx
   // ❌ WRONG - No focus state, low contrast
   <button className="bg-accent-sage text-white">Click</button>
   // ✅ CORRECT - Good contrast, visible focus
   <button className="bg-cargo-primary text-white focus-visible:ring-2">Click</button>
   ```

---

## Updating Tailwind Config

### Add New Colors

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      myColor: {
        light: '#...',
        DEFAULT: '#...',
        dark: '#...',
      }
    }
  }
}
```

Then use: `className="bg-myColor hover:bg-myColor-dark"`

### Add New Spacing Value

```javascript
theme: {
  extend: {
    spacing: {
      '4.5': '1.125rem', // 18px
    }
  }
}
```

Then use: `className="p-4.5 gap-4.5"`

### Update CSS Variables

In `src/index.css`:
```css
:root {
  --color-my-new-color: #...;
}
```

---

## Testing Checklist

### Visual Testing
- [ ] Component displays in light mode (warm cream background)
- [ ] Colors match approved palette
- [ ] Text is readable (contrast ≥ 4.5:1)
- [ ] Spacing consistent with scale
- [ ] Borders use warm-dark

### Accessibility Testing
- [ ] Tab through all interactive elements
- [ ] Focus states visible (ring appears)
- [ ] Focus ring color is semantic
- [ ] Color not sole differentiator
- [ ] No element smaller than 44px (touch targets)

### Responsive Testing
- [ ] Component works on 320px width
- [ ] Component works on 768px width
- [ ] Component works on 1280px width
- [ ] Touch targets properly spaced
- [ ] Text readable on mobile

### Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

---

## Common Updates

### Change Button Color
```typescript
// In Button.tsx, update variant
{
  'bg-cargo-primary text-white hover:bg-cargo-dark': variant === 'primary',
  'bg-accent-terracotta text-white hover:bg-accent-dark': variant === 'secondary',
}
```

### Update Card Styling
```typescript
// In component
className="bg-white border border-warm-dark border-b-4 border-b-cargo-primary"
```

### Modify Focus Ring Color
```typescript
// The standard ring color
className="focus-visible:ring-2 focus-visible:ring-cargo-primary"

// Override per component
className="focus-visible:ring-2 focus-visible:ring-semantic-danger"
```

### Change Spacing
Replace specific values with scale:
```typescript
// ❌ OLD
className="gap-4 p-6"

// ✅ NEW
className="gap-md p-lg"
```

---

## Troubleshooting

### Problem: Class Not Applying
**Solution**: Check if class is in Tailwind content path
```javascript
// tailwind.config.js - content paths
content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}', // Check this includes your files
]
```

### Problem: Color Looks Wrong
**Solution**: Verify you're using correct Tailwind naming
```jsx
// ❌ WRONG - Not how Tailwind works
className="cargo-primary" // Missing bg- or text- prefix

// ✅ CORRECT
className="bg-cargo-primary"
className="text-cargo-primary"
className="border-cargo-primary"
```

### Problem: Focus Ring Not Visible
**Solution**: Ensure `focus-visible` is applied
```jsx
// Add to interactive element
className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-cargo-primary"
```

### Problem: Mobile Looks Cramped
**Solution**: Use responsive prefixes
```jsx
className="gap-sm md:gap-md lg:gap-lg"
className="p-md md:p-lg"
```

---

## Performance Notes

- ✅ Tailwind CSS is compiled (no runtime overhead)
- ✅ All colors pre-defined in config
- ✅ No custom CSS outside Tailwind
- ✅ No unnecessary utility classes
- ✅ Tree-shaking removes unused classes

### Build Output
CSS is optimized and minified:
- Development: ~200KB (with sourcemaps)
- Production: ~30KB (minified + gzipped)

---

## Design System Consistency

### When Adding New Pages

1. Check similar pages for patterns
2. Use existing component library
3. Follow spacing scale religiously
4. Apply semantic colors
5. Add focus states
6. Test on mobile

### When Adding New Sections

1. Start with white background (`bg-white`)
2. Add warm border (`border border-warm-dark`)
3. Use appropriate card padding (`p-lg`)
4. Apply title color (`text-gray-900`)
5. Add shadows if floating (`shadow-sm` to `shadow-lg`)

### When Updating Forms

1. Use Input component (has styling built-in)
2. Add labels (better accessibility)
3. Show validation errors (semantic danger color)
4. Keep button cargo blue (primary action)
5. Use secondary button for alternatives

---

## Maintenance Checklist (Monthly)

- [ ] Review Tailwind version for updates
- [ ] Check for unused utility classes
- [ ] Audit color contrast on all pages
- [ ] Test keyboard navigation (all pages)
- [ ] Verify mobile responsiveness
- [ ] Check focus state visibility
- [ ] Review custom CSS for violations
- [ ] Test form validation styling

---

## Quick Commands

```bash
# Check for Tailwind errors
npm run lint

# Build with optimizations
npm run build

# Run dev server (watch mode)
npm run dev

# Preview production build
npm run preview
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `tailwind.config.js` | **Main config** - Colors, spacing, borders |
| `src/index.css` | **Base styles** - CSS vars, resets, global |
| `src/components/ui/*.tsx` | **Components** - Reusable styled elements |
| `.interface-design/system.md` | **Full specs** - Complete documentation |

---

## Support & Questions

### For color questions:
See `.interface-design/system.md` - Color Palette section

### For component usage:
Check component file `src/components/ui/ComponentName.tsx`

### For layout questions:
See `.interface-design/system.md` - Layout Components section

### For accessibility:
See `.interface-design/system.md` - Accessibility section

---

## Escalation Path

### If you need to:
1. **Add new color** → Update tailwind.config.js + CSS variables
2. **Create new component** → Follow pattern in `src/components/ui/`
3. **Change brand colors** → Update colors in tailwind.config.js
4. **Implement dark mode** → Create new theme configuration
5. **Add animations** → Use Framer Motion (already installed)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Apr 11, 2026 | Initial implementation |

---

**Last Updated**: April 11, 2026
**Maintainer**: Design Systems Team
**Status**: Production Ready

Good luck maintaining the beautiful TECAN interface! 🚀
