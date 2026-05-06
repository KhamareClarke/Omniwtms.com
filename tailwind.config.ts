import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        heading: ['var(--font-heading)'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Modern color scheme
        modern: {
          blue: '#3456FF',
          indigo: '#8763FF',
          cyan: '#35D3FF',
          green: '#22C55E',
          yellow: '#F59E0B',
          red: '#EF4444',
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          },
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
        },
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        success: {
          DEFAULT: 'rgb(var(--success-500) / <alpha-value>)',
          foreground: 'hsl(0 0% 100%)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning-500) / <alpha-value>)',
          foreground: 'hsl(0 0% 100%)',
        },
        error: {
          DEFAULT: 'rgb(var(--error-500) / <alpha-value>)',
          foreground: 'hsl(0 0% 100%)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
        },
      },
      maxWidth: {
        '8xl': '1400px',
      },
      boxShadow: {
        'modern-sm': 'var(--shadow-sm)',
        'modern-md': 'var(--shadow-md)',
        'modern-lg': 'var(--shadow-lg)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        blob: {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(30px, -50px) scale(1.1)',
          },
          '66%': {
            transform: 'translate(-20px, 20px) scale(0.9)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        'blob-slow': {
          '0%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
          '33%': {
            transform: 'translate(-50px, 30px) scale(1.05)',
          },
          '66%': {
            transform: 'translate(20px, -20px) scale(0.95)',
          },
          '100%': {
            transform: 'translate(0px, 0px) scale(1)',
          },
        },
        beam: {
          '0%': {
            opacity: '0.2',
            transform: 'translateY(-50%) translateX(0%) rotate(var(--beam-rotate, 30deg))',
          },
          '50%': {
            opacity: '0.15',
            transform: 'translateY(-50%) translateX(10%) rotate(var(--beam-rotate, 30deg))',
          },
          '100%': {
            opacity: '0',
            transform: 'translateY(-50%) translateX(15%) rotate(var(--beam-rotate, 30deg))',
          },
        },
        shimmer: {
          '0%': {
            transform: 'translateX(-100%)',
          },
          '100%': {
            transform: 'translateX(100%)',
          },
        },
        'gradient-shift': {
          '0%, 100%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'left center',
          },
          '50%': {
            backgroundSize: '200% 200%',
            backgroundPosition: 'right center',
          },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'text-shimmer': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.7',
            transform: 'scale(1.05)',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'blob': 'blob 20s infinite alternate',
        'blob-slow': 'blob-slow 30s infinite alternate',
        'beam': 'beam 15s infinite linear',
        'shimmer': 'shimmer 2s infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'fade-in-up': 'fade-in-up 1s ease-out',
        'fade-in-up-delay': 'fade-in-up 1s ease-out 0.3s both',
        'text-shimmer': 'text-shimmer 2s ease-in-out infinite',
        'text-shimmer-delay-1': 'text-shimmer 2s ease-in-out 0.3s infinite',
        'text-shimmer-delay-2': 'text-shimmer 2s ease-in-out 0.6s infinite',
        'text-shimmer-delay-3': 'text-shimmer 2s ease-in-out 0.9s infinite',
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;