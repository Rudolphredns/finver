/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: 'class', // ใช้คลาส 'dark' เพื่อสลับโหมด
	content: [
	  "./pages/**/*.{js,ts,jsx,tsx,mdx}",
	  "./components/**/*.{js,ts,jsx,tsx,mdx}",
	  "./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
	  extend: {
		colors: {
		  background: 'hsl(var(--background))',
		  foreground: 'hsl(var(--foreground))',
		  card: {
			DEFAULT: 'hsl(var(--card))',
			foreground: 'hsl(var(--card-foreground))',
			dark: 'hsl(var(--card-dark))',
		  },
		  popover: {
			DEFAULT: 'hsl(var(--popover))',
			foreground: 'hsl(var(--popover-foreground))',
		  },
		  primary: {
			DEFAULT: 'hsl(var(--primary))',
			foreground: 'hsl(var(--primary-foreground))',
			dark: 'hsl(var(--primary-dark))',
		  },
		  secondary: {
			DEFAULT: 'hsl(var(--secondary))',
			foreground: 'hsl(var(--secondary-foreground))',
			dark: 'hsl(var(--secondary-dark))',
		  },
		  muted: {
			DEFAULT: 'hsl(var(--muted))',
			foreground: 'hsl(var(--muted-foreground))',
		  },
		  accent: {
			DEFAULT: 'hsl(var(--accent))',
			foreground: 'hsl(var(--accent-foreground))',
		  },
		  destructive: {
			DEFAULT: 'hsl(var(--destructive))',
			foreground: 'hsl(var(--destructive-foreground))',
		  },
		  border: 'hsl(var(--border))',
		  input: 'hsl(var(--input))',
		  ring: 'hsl(var(--ring))',
		  chart: {
			'1': 'hsl(var(--chart-1))',
			'2': 'hsl(var(--chart-2))',
			'3': 'hsl(var(--chart-3))',
			'4': 'hsl(var(--chart-4))',
			'5': 'hsl(var(--chart-5))',
		  },
		},
		borderRadius: {
		  lg: 'var(--radius)',
		  md: 'calc(var(--radius) - 2px)',
		  sm: 'calc(var(--radius) - 4px)',
		},
		keyframes: {
		  colorShift: {
			'0%, 100%': { backgroundPosition: '0% 50%' },
			'50%': { backgroundPosition: '100% 50%' },
		  },
		  fadeInUp: {
			'0%': {
			  opacity: '0',
			  transform: 'translateY(20px)',
			},
			'100%': {
			  opacity: '1',
			  transform: 'translateY(0)',
			},
		  },
		  gradientMove: {
			"0%": { backgroundPosition: "0% 50%" },
			"50%": { backgroundPosition: "100% 50%" },
			"100%": { backgroundPosition: "0% 50%" },
		  },
		  spinSlow: {
			"0%": { transform: "rotate(0deg)" },
			"100%": { transform: "rotate(360deg)" },
		  },
		  spinFast: {
			"0%": { transform: "rotate(0deg)" },
			"100%": { transform: "rotate(360deg)" },
		  },
		},
		animation: {
		  colorShift: 'colorShift 10s ease infinite',
		  fadeInUp: 'fadeInUp 0.5s ease-out forwards',
		  gradientMove: 'gradientMove 8s infinite',
		  spinSlow: 'spinSlow 10s linear infinite',
		  spinFast: 'spinFast 3s linear infinite',
		},
		backgroundImage: {
		  'logo-gradient': 'linear-gradient(270deg, #ff7e5f, #feb47b, #86a8e7, #7f7fd5)',
		},
		backgroundSize: {
		  'logo-size': '800% 800%',
		},
	  },
	},
	plugins: [require("tailwindcss-animate")],
  };
  