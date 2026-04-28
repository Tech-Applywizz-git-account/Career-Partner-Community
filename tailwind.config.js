/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
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
