"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { useSocket } from "@/context/Socketcontext";
import { Menu } from "lucide-react";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  return (
    <div>
      <div className="sticky top-0 w-full bg-[#282828] text-white outline outline-4 outline-[#FC924B] z-50">
        <div className="max-w-screen-l mx-auto p-4">
          <div className="flex justify-between items-center w-full">
            {/* Logo */}
            <div
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => router.push("/")}
            >
              <div className="font-bold text-2xl">Finver</div>
            </div>

            {/* Hamburger Menu for small screens */}
            <div className="md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)}>
                <Menu className="text-white w-8 h-8" />
              </button>
            </div>

            {/* Navigation Links - Show only if signed in */}
            {isSignedIn && (
              <div
                className={`flex-col md:flex-row md:gap-12 md:flex md:items-center ml-auto text-lg font-medium
                ${menuOpen ? "flex" : "hidden"} absolute md:static top-16 right-0 w-full md:w-auto bg-[#282828] md:bg-transparent`}
              >
                <div
                  className="cursor-pointer hover:text-[#FC924B] transition-colors p-4 md:py-0 md:px-6"
                  onClick={() => router.push("/")}
                >
                  Home
                </div>
                <div
                  className="cursor-pointer hover:text-[#FC924B] transition-colors p-4 md:py-0 md:px-6"
                  onClick={() => router.push("/top-up")}
                >
                  Top up
                </div>
                <div
                  className="cursor-pointer hover:text-[#FC924B] transition-colors p-4 md:py-0 md:px-6"
                  onClick={() => router.push("/settings")}
                >
                  Setting
                </div>
                <div
                  className="cursor-pointer hover:text-[#FC924B] transition-colors p-4 md:py-0 md:px-6"
                  onClick={() => router.push("/contact")}
                >
                  Contact
                </div>
              </div>
            )}

            {/* User Authentication */}
            <div className="hidden md:flex gap-4 items-center ml-6">
              <UserButton />
              {!isSignedIn && (
                <>
                  <Button
                    onClick={() => router.push("/sign-in")}
                    size="sm"
                    variant="default"
                    className="bg-transparent text-white border-none hover:bg-transparent"
                  >
                    Sign in
                  </Button>
                  <Button
                    onClick={() => router.push("/sign-up")}
                    size="sm"
                    className="bg-transparent text-white border-[1px] border-gray-300 rounded-full animate-glow"
                  >
                    Sign up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="w-full border-b-4 border-[#FC924B]"></div>
      </div>
    </div>
  );
};

export default NavBar;
