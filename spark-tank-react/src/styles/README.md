# Spark Tank - Unified Styles Structure

A comprehensive, organized CSS structure for the Spark Tank React application with support for dark/light themes.

## Structure Overview

```
src/styles/
├── index.css           # Main entry point - import this in your React app
├── variables.css       # CSS custom properties (colors, spacing, etc.)
├── themes.css          # Dark/Light theme definitions
├── global.css          # Global styles, typography, animations
├── sidebar.css         # Sidebar component styles
├── leaderboard.css     # Leaderboard component styles
├── dashboard.css       # Dashboard and live view styles
└── README.md          # This file
```

## Usage in React

### 1. Import in your main entry file

In `src/main.jsx` or `src/App.jsx`:

```javascript
import './styles/index.css'
```

This single import loads all styles in the correct order.

### 2. Theme Switching

Create a theme toggle component or hook:

```javascript
// Theme hook example
import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return { theme, toggleTheme }
}
```

### 3. Using CSS Variables in Components

All CSS variables are available globally:

```jsx
// Example component
function MyComponent() {
  return (
    <div style={{
      padding: 'var(--spacing-lg)',
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-md)'
    }}>
      <h1 className="gradient-text">Hello Spark Tank!</h1>
    </div>
  )
}
```

## CSS Variables Reference

### Brand Colors
- `--brand-dark-sea-green`: #1d8f5b (Primary brand color)
- `--brand-golden-poppy`: #ffc300 (Secondary brand color)
- `--brand-shadow-gray`: #3a3a3a
- `--brand-super-silver`: #f4f4f4
- `--brand-natural-black`: #000000
- `--brand-pure-white`: #ffffff

### Functional Colors
- `--color-primary`: Green (from brand)
- `--color-secondary`: Gold (from brand)
- `--color-success`: Green
- `--color-error`: Red (#EF4444)
- `--color-warning`: Gold
- `--color-info`: Blue (#3B82F6)

### Theme-Aware Colors
These change based on the active theme (dark/light):
- `--color-bg`: Background color
- `--color-surface`: Surface/card background
- `--color-text-primary`: Primary text color
- `--color-text-secondary`: Secondary text color
- `--color-text-tertiary`: Tertiary text color

### Spacing
- `--spacing-xs`: 4px
- `--spacing-sm`: 8px
- `--spacing-md`: 16px
- `--spacing-lg`: 24px
- `--spacing-xl`: 32px
- `--spacing-2xl`: 48px
- `--spacing-3xl`: 64px

### Border Radius
- `--radius-sm`: 8px
- `--radius-md`: 12px
- `--radius-lg`: 16px
- `--radius-xl`: 24px
- `--radius-2xl`: 32px
- `--radius-full`: 9999px (for circles)

### Shadows
- `--shadow-sm`: Small shadow
- `--shadow-md`: Medium shadow
- `--shadow-lg`: Large shadow
- `--shadow-xl`: Extra large shadow

### Transitions
- `--transition-fast`: 0.15s ease
- `--transition-base`: 0.3s ease
- `--transition-slow`: 0.5s ease

## Utility Classes

### Gradients
- `.gradient-text` - Gradient text effect (primary to secondary)
- `.gradient-bg-primary` - Primary gradient background
- `.gradient-bg-secondary` - Secondary gradient background
- `.gradient-bg-full` - Full gradient (primary to secondary)

### Glass Morphism
- `.glass` - Glass effect with backdrop blur
- `.glass-light` - Light glass effect

### Effects
- `.glow` - Subtle glow effect
- `.glow-strong` - Strong glow effect

### Animations
- `.animate-fade-in` - Fade in animation
- `.animate-fade-in-up` - Fade in with upward movement
- `.animate-pulse` - Pulsing animation
- `.animate-bounce` - Bouncing animation
- `.animate-spin` - Spinning animation

## Component-Specific Classes

### Leaderboard
- `.leaderboard` - Container for leaderboard items
- `.leaderboard-card` - Individual leaderboard card
- `.leaderboard-card[data-rank="1"]` - Gold medal styling
- `.leaderboard-card[data-rank="2"]` - Silver medal styling
- `.leaderboard-card[data-rank="3"]` - Bronze medal styling

### Dashboard
- `.dashboard-container` - Main dashboard container
- `.dashboard-bg` - Animated background with orbs
- `.header` - Dashboard header
- `.transactions-ticker` - Scrolling transactions
- `.sale-celebration` - Sale celebration overlay

### Sidebar
- `.sidebar` - Main sidebar container
- `.sidebar.collapsed` - Collapsed sidebar state
- `.nav-item` - Navigation item
- `.nav-item.active` - Active navigation state

## Logo Usage

The Scaler logo is available at:
```
src/assets/scaler-logo.png
```

Use in React:
```jsx
import scalerLogo from './assets/scaler-logo.png'

function Header() {
  return <img src={scalerLogo} alt="Scaler" className="header-logo" />
}
```

## Responsive Breakpoints

- **Desktop**: > 1024px
- **Tablet**: 768px - 1024px
- **Mobile**: < 768px
- **Small Mobile**: < 480px

All components are fully responsive and adapt to these breakpoints.

## Best Practices

1. **Use CSS Variables**: Always use CSS variables instead of hardcoded values
2. **Theme Support**: Test components in both dark and light themes
3. **Responsive Design**: Use relative units (rem, %, etc.) where appropriate
4. **Consistent Spacing**: Use spacing variables for margins and padding
5. **Accessibility**: Ensure sufficient color contrast in both themes

## Migration from HTML

If migrating from the original HTML files:
1. Replace `<link>` tags with the single import: `import './styles/index.css'`
2. Theme switching now uses `data-theme` attribute instead of classes
3. All styles are modular and tree-shakeable with Vite
4. Logo is now a local asset instead of a CDN URL

## Performance

- All CSS is bundled and optimized by Vite
- CSS variables provide better performance than inline styles
- Animations use CSS transforms for GPU acceleration
- Minimal specificity conflicts due to organized structure

## Support

For questions or issues with the styles, contact the development team or refer to the main project documentation.
