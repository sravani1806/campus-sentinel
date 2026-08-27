/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentinel: {
          darkest: '#07090e',
          bg: '#0b0f19',
          surface: '#111827',
          card: '#161f33',
          border: '#23304a',
          accent: '#00f2fe',
          cyan: '#06b6d4',
          emerald: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          purple: '#8b5cf6'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
        'glow-flow': 'glowFlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        glowFlow: {
          '0%': { filter: 'drop-shadow(0 0 2px rgba(0, 242, 254, 0.4))' },
          '100%': { filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.9))' }
        }
      }
    },
  },
  plugins: [],
}
