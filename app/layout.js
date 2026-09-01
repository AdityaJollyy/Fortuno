import { Manrope, Nunito_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { ClerkThemeProvider } from "@/components/ClerkThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata = {
  title: "Fortuno",
  description:
    "All-in-one personal finance companion for tracking expenses, savings, budgets, and financial goals.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${nunito.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClerkThemeProvider>
            <TooltipProvider>
              <Header />

              <main className="min-h-screen">{children}</main>
              <Toaster richColors />

              <Footer />
            </TooltipProvider>
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
