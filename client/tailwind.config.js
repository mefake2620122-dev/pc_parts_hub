/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          white: '#ffffff',
          offwhite: '#fbfbfd',
          card: '#ffffff',
          surface: '#f5f5f7',
          border: 'rgba(0, 0, 0, 0.08)',
          'border-light': 'rgba(0, 0, 0, 0.04)',
          text: '#1d1d1f',
          subtext: '#6e6e73',
          muted: '#86868b',
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          'blue-light': '#f0f6ff',
        },
        brand: {
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          whatsapp: '#25D366',
          'whatsapp-hover': '#20BD5A',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'apple-sm': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'apple-card': '0 4px 20px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'apple-hover': '0 16px 40px -10px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.03)',
        'apple-floating': '0 24px 60px -15px rgba(0, 0, 0, 0.12), 0 8px 24px -5px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
        'metallic-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.9), 0 2px 6px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '20px',
        '2xl': '28px',
      }
    },
  },
  plugins: [],
}

