/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    container: {
      center: false,
      padding: '0',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        gold: "#b76e79", // Rose gold
        softgold: {
          50: "#fdf2f3",
          100: "#fce5e7",
          200: "#f9cbd0",
          300: "#f6b1b9",
          400: "#f397a2",
          500: "#b76e79", // Base rose gold
          600: "#a55d68",
          700: "#934c57",
          800: "#813b46",
          900: "#6f2a35",
        },
        rosegold: {
          50: "#fdf2f3",
          100: "#fce5e7",
          200: "#f9cbd0",
          300: "#f6b1b9",
          400: "#f397a2",
          500: "#b76e79", // Base rose gold
          600: "#a55d68",
          700: "#934c57",
          800: "#813b46",
          900: "#6f2a35",
        },
        charcoal: {
          50: "#F5F5F5",
          100: "#E0E0E0",
          200: "#C0C0C0",
          300: "#A0A0A0",
          400: "#808080",
          500: "#000000", // Base black
          600: "#000000",
          700: "#000000",
          800: "#000000",
          900: "#000000",
        },
        zinc: {
          700: "#3f3f46",
          800: "#000000",
          900: "#000000",
        },
        nexus: {
          blue: {
            50: "#E6F1FF",
            100: "#CCE4FF",
            200: "#99C9FF",
            300: "#66ADFF",
            400: "#3392FF",
            500: "#0077FF",
            600: "#005FCC",
            700: "#004799",
            800: "#003066",
            900: "#001833",
          },
          purple: {
            50: "#F3E6FF",
            100: "#E7CCFF",
            200: "#CF99FF",
            300: "#B766FF",
            400: "#9F33FF",
            500: "#8700FF",
            600: "#6C00CC",
            700: "#510099",
            800: "#360066",
            900: "#1B0033",
          },
          neutral: {
            50: "#F8F9FA",
            100: "#F1F3F5",
            200: "#E9ECEF",
            300: "#DEE2E6",
            400: "#CED4DA",
            500: "#ADB5BD",
            600: "#868E96",
            700: "#495057",
            800: "#343A40",
            900: "#212529",
          },
        },
      },
      fontFamily: {
        sans: [
          "Neue Sans",
          "Inter var",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "Ed Gamarod",
          "ui-serif",
          "Georgia",
          "serif",
        ],
        poppins: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-soft": "linear-gradient(180deg, var(--tw-gradient-stops))",
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-secondary': 'var(--gradient-secondary)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-gold-light': 'var(--gradient-gold-light)',
        'gradient-gold-dark': 'var(--gradient-gold-dark)',
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out",
      },
      boxShadow: {
        'elegant': 'var(--shadow-elegant)',
        'card': 'var(--shadow-card)',
        'hover': 'var(--shadow-hover)',
        'glow-primary': 'var(--glow-primary)',
        'glow-accent': 'var(--glow-accent)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      perspective: {
        1000: "1000px",
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }) {
      addUtilities({
        ".perspective-1000": {
          perspective: "1000px",
        },
        ".preserve-3d": {
          transformStyle: "preserve-3d",
        },
        ".backface-hidden": {
          backfaceVisibility: "hidden",
        },
        ".rotate-y-180": {
          transform: "rotateY(180deg)",
        },
      });
    },
  ],
};
