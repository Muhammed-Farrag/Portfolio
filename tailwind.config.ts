import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Cyberpunk / Neo-Terminal Palette
                void: {
                    DEFAULT: '#050505',
                    50: '#0a0a0a',
                    100: '#0f0f0f',
                    200: '#141414',
                    300: '#1a1a1a',
                    400: '#1f1f1f',
                },
                neon: {
                    green: '#00ff41',
                    greenDark: '#00cc33',
                    greenGlow: 'rgba(0, 255, 65, 0.4)',
                },
                electric: {
                    purple: '#bf00ff',
                    purpleDark: '#9900cc',
                    purpleGlow: 'rgba(191, 0, 255, 0.4)',
                },
                cyber: {
                    blue: '#00d4ff',
                    pink: '#ff0080',
                    orange: '#ff6600',
                },
            },
            fontFamily: {
                mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'terminal-blink': 'terminal-blink 1s step-end infinite',
                'float': 'float 6s ease-in-out infinite',
                'gradient-shift': 'gradient-shift 8s ease infinite',
                'scan-line': 'scan-line 8s linear infinite',
            },
            keyframes: {
                'glow-pulse': {
                    '0%, 100%': {
                        boxShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 20px currentColor',
                    },
                    '50%': {
                        boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 40px currentColor',
                    },
                },
                'terminal-blink': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
                'gradient-shift': {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' },
                },
                'scan-line': {
                    '0%': { transform: 'translateY(-100%)' },
                    '100%': { transform: 'translateY(100vh)' },
                },
            },
            backgroundImage: {
                'cyber-gradient': 'linear-gradient(135deg, #00ff41 0%, #bf00ff 50%, #00d4ff 100%)',
                'void-gradient': 'radial-gradient(ellipse at center, #0f0f0f 0%, #050505 100%)',
                'grid-pattern': `linear-gradient(rgba(0, 255, 65, 0.03) 1px, transparent 1px),
                         linear-gradient(90deg, rgba(0, 255, 65, 0.03) 1px, transparent 1px)`,
            },
            boxShadow: {
                'neon-green': '0 0 5px #00ff41, 0 0 10px #00ff41, 0 0 20px #00ff41',
                'neon-purple': '0 0 5px #bf00ff, 0 0 10px #bf00ff, 0 0 20px #bf00ff',
                'neon-blue': '0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 20px #00d4ff',
            },
        },
    },
    plugins: [],
};

export default config;
