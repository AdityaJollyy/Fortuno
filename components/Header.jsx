import { Button } from "./ui/button";
import { PenBox, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Image from "next/image";

const Header = async () => {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link href="/">
          <Image
            src={"/logo3.webp"}
            alt="Welth Logo"
            width={200}
            height={60}
            className="h-12 w-auto object-contain"
            loading="eager"
          />
        </Link>

        {/* Navigation Links - Different for signed in/out users */}
        <div className="hidden items-center space-x-8 md:flex">
          <Show when="signed-out">
            <a href="#features" className="text-gray-600 hover:text-blue-600">
              Features
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-blue-600"
            >
              Testimonials
            </a>
          </Show>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
            >
              <Button variant="outline">
                <LayoutDashboard size={18} />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <a href="/transaction/create">
              <Button className="flex items-center gap-2">
                <PenBox size={18} />
                <span className="hidden md:inline">Add Transaction</span>
              </Button>
            </a>
          </Show>
          <Show when="signed-out">
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10",
                },
              }}
            />
          </Show>
        </div>
      </nav>
    </header>
  );
};

export default Header;
