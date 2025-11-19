/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(214.3, 31.8%, 91.4%)",
                input: "hsl(214.3, 31.8%, 91.4%)",
                ring: "hsl(262.1, 83.3%, 57.8%)",
                background: "hsl(0, 0%, 100%)",
                foreground: "hsl(222.2, 84%, 4.9%)",
                primary: {
                    DEFAULT: "hsl(262.1, 83.3%, 57.8%)",
                    foreground: "hsl(210, 40%, 98%)",
                },
                secondary: {
                    DEFAULT: "hsl(160, 60%, 45%)",
                    foreground: "hsl(210, 40%, 98%)",
                },
                destructive: {
                    DEFAULT: "hsl(0, 84.2%, 60.2%)",
                    foreground: "hsl(210, 40%, 98%)",
                },
                muted: {
                    DEFAULT: "hsl(210, 40%, 96.1%)",
                    foreground: "hsl(215.4, 16.3%, 46.9%)",
                },
                accent: {
                    DEFAULT: "hsl(330, 70%, 60%)",
                    foreground: "hsl(210, 40%, 98%)",
                },
                popover: {
                    DEFAULT: "hsl(0, 0%, 100%)",
                    foreground: "hsl(222.2, 84%, 4.9%)",
                },
                card: {
                    DEFAULT: "hsl(0, 0%, 100%)",
                    foreground: "hsl(222.2, 84%, 4.9%)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [],
}