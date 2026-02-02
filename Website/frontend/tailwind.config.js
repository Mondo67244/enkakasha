/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Instrument Sans', 'system-ui', 'sans-serif'],
                display: ['Space Grotesk', 'Instrument Sans', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
