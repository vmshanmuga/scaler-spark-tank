/**
 * useTheme Hook
 *
 * A React hook for managing theme switching in the Spark Tank application.
 * Supports dark and light themes with localStorage persistence.
 *
 * Usage:
 * ```jsx
 * import { useTheme } from './hooks/useTheme'
 *
 * function ThemeToggle() {
 *   const { theme, toggleTheme } = useTheme()
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {theme}
 *     </button>
 *   )
 * }
 * ```
 */

import { useState, useEffect } from 'react'

export function useTheme() {
  // Get initial theme from localStorage or default to 'dark'
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark'
    }
    return 'dark'
  })

  // Apply theme to document root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  // Toggle between dark and light themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  // Set specific theme
  const setSpecificTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setTheme(newTheme)
    }
  }

  // Check if current theme is dark
  const isDark = theme === 'dark'

  // Check if current theme is light
  const isLight = theme === 'light'

  return {
    theme,           // Current theme: 'dark' or 'light'
    toggleTheme,     // Function to toggle theme
    setTheme: setSpecificTheme,  // Function to set specific theme
    isDark,          // Boolean: true if dark theme
    isLight          // Boolean: true if light theme
  }
}

/**
 * Example Theme Toggle Component
 *
 * ```jsx
 * import { useTheme } from './hooks/useTheme'
 *
 * function ThemeToggle() {
 *   const { theme, toggleTheme, isDark } = useTheme()
 *
 *   return (
 *     <button
 *       className="theme-toggle-btn"
 *       onClick={toggleTheme}
 *       aria-label="Toggle theme"
 *     >
 *       {isDark ? '🌙' : '☀️'}
 *     </button>
 *   )
 * }
 * ```
 */
