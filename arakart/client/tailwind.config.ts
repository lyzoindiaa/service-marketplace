import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4f46e5',
          primary: '#4f46e5',
          dark: '#3730a3',
          light: '#eef2ff',
          glow: 'rgba(79, 70, 229, 0.28)',
        },
        'border-light': '#e2e8f0',
        accent: {
          DEFAULT: '#f59e0b',
          dark: '#b45309',
          light: '#fffbeb',
        },
        ink: {
          DEFAULT: '#0f172a',
          secondary: '#334155',
          muted: '#64748b',
        },
        surface: {
          DEFAULT: '#ffffff',
          bg: '#f8fafc',
          subtle: '#f1f5f9',
          line: 'rgba(226, 232, 240, 0.9)',
        },
        status: {
          green: '#10b981',
          'green-light': '#ecfdf5',
          red: '#f43f5e',
          'red-light': '#fff1f2',
          blue: '#0284c7',
          'blue-light': '#f0f9ff',
          whatsapp: '#10b981',
        }
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',
        'control': '12px',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #4338ca 0%, #4f46e5 50%, #6366f1 100%)',
        'accent-gradient': 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        'hero-radial': 'radial-gradient(130% 130% at 50% 0%, #1e1b4b 0%, #0f172a 65%, #020617 100%)',
      },
      boxShadow: {
        'glow': '0 4px 20px rgba(79, 70, 229, 0.28)',
        'subtle': '0 1px 2px rgba(15, 23, 42, 0.04)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -2px rgba(15, 23, 42, 0.04)',
        'card-hover': '0 20px 40px -8px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
      }
    },
  },
  plugins: [],
};

export default config;
