/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SASIENALA Brand Colors (from website) - Earthy, Natural Tones
        'sasie-black': '#1A1918',
        'sasie-white': '#FFFFFF',
        // Beige/Cream Series - Warm neutrals
        'sasie-beige': '#E8E0D5',
        'sasie-beige-light': '#F5F0E8',
        'sasie-cream': '#F2EBE4',
        'sasie-dove': '#D9CFC4',
        // Brown Series - From SASIENALA color palette
        'sasie-brown': '#8B7355',
        'sasie-brown-dark': '#5C4A3A',
        'sasie-mocca': '#6B5A4A',
        'sasie-milo': '#7A6858',
        'sasie-terracotta': '#A67B5B',
        'sasie-bronze': '#8B6914',
        'sasie-marun': '#7A4B4B',
        'sasie-coksu': '#9C7C6C',
        // Gold/Luxury accent
        'sasie-gold': '#C9A86C',
        'sasie-gold-light': '#E5D4A8',
        // Green Series - Soft earthy greens
        'sasie-green': '#6B7A5F',
        'sasie-green-light': '#8FA38A',
        'sasie-sage': '#9CAF94',
        'sasie-olive': '#7A8B6A',
        'sasie-emerald': '#4A7C59',
        // Utility colors
        'sasie-gray': '#F5F5F5',
        'sasie-gray-dark': '#E0E0E0',
        'sasie-gray-light': '#FAFAFA',
        // Accent color for CTAs
        'sasie-accent': '#8B7355',

        // COLOR OF US Theme - Invitation Inspired
        'blush-pink': '#F8E8E8',
        'blush-pink-light': '#FCF0F0',
        'blush-pink-dark': '#E8D0D0',
        'sage-green': '#8B9A7D',
        'sage-green-light': '#A8B8A5',
        'sage-green-dark': '#6B7A5F',
        'mahogany-brown': '#8B4513',
        'mahogany-light': '#A0522D',
        'mahogany-dark': '#5C2E0A',
        'champagne-gold': '#D4AF37',
        'champagne-gold-light': '#E5C758',
        'champagne-gold-dark': '#B8941F',
        'dusty-rose': '#D4A5A5',
        'cream-ivory': '#FFFEF9',
        'warm-sage': '#9CAF94',
      },
      fontFamily: {
        'dancing': ['"Dancing Script"', 'cursive'],
        'elegant': ['"Playfair Display"', 'serif'],
        'worksans': ['"Work Sans"', 'sans-serif'],
        sans: ['"Work Sans"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.96)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
