/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        'bg-[#29FE29]', 'text-[#29FE29]', 'border-[#29FE29]',
        'hover:bg-[#25e525]', 'hover:text-[#29FE29]',
        'bg-[#2C76FF]', 'text-[#2C76FF]', 'border-[#2C76FF]',
        'hover:bg-[#1a60e6]', 'hover:text-[#2C76FF]', 'hover:border-[#2C76FF]',
        'bg-[#1E1E1E]', 'text-[#1E1E1E]',
        'shadow-[#2C76FF]/20', 'shadow-[#2C76FF]/10',
        'fill-[#29FE29]',
        'shadow-[0_6px_20px_rgba(41,254,41,0.3)]',
        'shadow-[0_6px_20px_rgba(41,254,41,0.2)]',
        'shadow-[0_4px_12px_rgba(41,254,41,0.2)]',
        'bg-[#2C76FF]/5', 'bg-[#2C76FF]/10', 'bg-[#2C76FF]/20',
        'bg-[#29FE29]/5', 'bg-[#29FE29]/10', 'bg-[#29FE29]/20',
        'text-[#2C76FF]/40', 'text-[#29FE29]/40',
        'border-[#2C76FF]/20', 'border-[#2C76FF]/30',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: '#2C76FF',
                    green: '#29FE29',
                    black: '#1E1E1E',
                },
                primary: {
                    yellow: '#FDB913',
                    dark: '#1A1A1A',
                    white: '#FFFFFF',
                },
                accent: {
                    blue: '#0066CC',
                    green: '#10B981',
                    orange: '#F97316',
                },
                visa: {
                    h1b: '#3B82F6',
                    opt: '#8B5CF6',
                    greencard: '#10B981',
                    tn: '#F59E0B',
                    e3: '#EC4899',
                    j1: '#06B6D4',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

