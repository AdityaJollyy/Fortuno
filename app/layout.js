import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Fortuno",
  description:
    "All-in-one personal finance companion for tracking expenses, savings, budgets, and financial goals.",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          <TooltipProvider>
            {/* header */}
            <Header />

            <main className="min-h-screen">{children}</main>

            {/* footer */}
            <footer className="bg-blue-50 py-12">
              <div className="container mx-auto px-4 text-center text-gray-600">
                <p>Made with 💗</p>
              </div>
            </footer>
          </TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
