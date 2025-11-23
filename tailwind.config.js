/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'media',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Custom colors if needed, but using default Zinc/Indigo as requested
            },
        },
    },
    plugins: [],
}
