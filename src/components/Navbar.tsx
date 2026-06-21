"use client";

import Link from "next/link";
import { Coffee, Menu, X, LogOut, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const pathname = usePathname();
  const role = (session?.user as any)?.role;

  const dashboardHref = role === "admin" ? "/admin" : "/dashboard";
  const dashboardLabel = role === "admin" ? "Admin Panel" : "Dashboard";

  const closeMobile = () => setMobileOpen(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleOutsideClick = () => setProfileMenuOpen(false);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [profileMenuOpen]);

  const userInitial = session?.user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
          : "bg-transparent border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group" onClick={closeMobile}>
              <div className="relative">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-1.5 rounded-xl group-hover:scale-110 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/25">
                  <Coffee size={20} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gradient">
                ContribuX
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/explore"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === "/explore"
                  ? "text-white bg-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Explore
            </Link>
            <Link
              href="/pricing"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === "/pricing"
                  ? "text-white bg-white/10"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Pricing
            </Link>

            <div className="h-5 w-px bg-white/10 mx-2" />

            {session ? (
              <div className="flex items-center gap-2">
                <Link
                  href={dashboardHref}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    pathname.startsWith("/dashboard") || pathname.startsWith("/admin")
                      ? "text-white bg-white/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {dashboardLabel}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                >
                  <LogOut size={16} />
                </button>
                
                {/* Clickable Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProfileMenuOpen(!profileMenuOpen);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 transition-all ring-2 ring-white/10 hover:ring-indigo-500/50"
                  >
                    {session?.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {userInitial}
                      </div>
                    )}
                  </button>

                  {profileMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2.5 w-56 rounded-2xl bg-[#0a0a15] border border-white/10 shadow-2xl py-2 z-50 animate-scale-in divide-y divide-white/5 text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-4 py-3">
                        <p className="text-sm font-semibold text-white truncate">{session?.user?.name || "User"}</p>
                        <p className="text-xs text-gray-500 truncate">{session?.user?.email || ""}</p>
                        <p className="text-[10px] mt-1.5 inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold uppercase tracking-wider">
                          {role}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          href={dashboardHref}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          {dashboardLabel}
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          Settings (Edit Profile)
                        </Link>
                        {role === "creator" && (
                          <Link
                            href={`/creator/${(session.user as any).id}`}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            My Profile Page
                          </Link>
                        )}
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileMenuOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-left"
                        >
                          <LogOut size={14} />
                          Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="relative px-5 py-2 text-sm font-semibold rounded-full bg-white text-black hover:bg-gray-100 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-white/10"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-3">
            {session && (
              <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/10 flex items-center justify-center">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {userInitial}
                  </div>
                )}
              </div>
            )}
            <button
              className="text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          <Link href="/explore" onClick={closeMobile} className="block text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all px-4 py-3 rounded-lg">
            Explore Creators
          </Link>
          <Link href="/pricing" onClick={closeMobile} className="block text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all px-4 py-3 rounded-lg">
            Pricing
          </Link>
          <div className="h-px bg-white/10 my-2" />
          {session ? (
            <>
              <Link href={dashboardHref} onClick={closeMobile} className="block text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all px-4 py-3 rounded-lg">
                {dashboardLabel}
              </Link>
              <button
                onClick={() => { signOut({ callbackUrl: "/" }); closeMobile(); }}
                className="block text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all px-4 py-3 rounded-lg w-full text-left"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={closeMobile} className="block text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-all px-4 py-3 rounded-lg">
                Log in
              </Link>
              <Link href="/register" onClick={closeMobile} className="block text-sm font-medium bg-white text-black px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors text-center mt-2">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
