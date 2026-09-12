"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Bell, User as UserIcon, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type UserSession = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "TENANT" | "LANDLORD" | "ADMIN";
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch current authenticated user session on mount & pathname changes
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setUser(data.user || null);
          }
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setMenuOpen(false);
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      if (res.ok) {
        setUser(null);
        toast.success("Signed out successfully");
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error("Failed to sign out");
    }
  };

  const getUserInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const dashboardHref =
    user?.role === "LANDLORD"
      ? "/dashboard/landlord"
      : user?.role === "ADMIN"
      ? "/dashboard/admin"
      : "/dashboard/tenant";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-6 sm:px-10 lg:px-12">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
            <Home className="size-5.5" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            Rent<span className="text-primary">Ease</span>
          </span>
        </Link>

        {/* Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-full bg-muted/80 p-1.5 border border-border/40 text-base font-medium">
          <Link
            href="/"
            className={`rounded-full px-5 py-2 transition-colors ${
              pathname === "/"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </Link>
          <Link
            href="/properties"
            className={`rounded-full px-5 py-2 transition-colors ${
              pathname?.startsWith("/properties")
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Properties
          </Link>
          <Link
            href="/search"
            className={`rounded-full px-5 py-2 transition-colors ${
              pathname === "/search"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Search
          </Link>
          <Link
            href="/rent-estimator"
            className={`rounded-full px-5 py-2 transition-colors ${
              pathname === "/rent-estimator"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            AI Rent Estimator
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notifications"
            suppressHydrationWarning
            className="relative grid size-10 place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
          >
            <Bell className="size-5" />
            <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-warm ring-2 ring-background" />
          </button>

          {!loading && user ? (
            /* Profile Icon & Dropdown for Signed In Users */
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                suppressHydrationWarning
                className="flex items-center gap-2 rounded-full border border-border/80 bg-card p-1 pr-2.5 transition-all hover:bg-muted/70 focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs"
              >
                <div className="grid size-8 place-items-center rounded-full bg-primary font-bold text-xs text-primary-foreground shadow-inner">
                  {getUserInitials(user.name)}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate text-sm font-semibold text-foreground">
                  {user.name}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>

              {/* Profile Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2.5 w-64 rounded-2xl border border-border/80 bg-card p-2 shadow-lift backdrop-blur-md z-50 animate-in fade-in-0 zoom-in-95 duration-100">
                  <div className="px-3.5 py-3 border-b border-border/50">
                    <p className="font-display font-bold text-foreground text-sm truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {user.email}
                    </p>
                    <span className="inline-block mt-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary tracking-wider uppercase">
                      {user.role}
                    </span>
                  </div>

                  <div className="py-1">
                    <Link
                      href={dashboardHref}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <LayoutDashboard className="size-4 text-primary" />
                      My Dashboard
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-border/50">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="size-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Sign In & Get Started Options for Guests */
            <>
              <Link
                href="/auth/signin"
                className="hidden sm:inline-block text-base font-semibold text-foreground hover:text-primary transition-colors px-2 py-1"
              >
                Sign In
              </Link>

              <Button
                size="lg"
                className="rounded-full px-6 py-2.5 text-sm font-semibold shadow-sm h-auto"
                render={<Link href="/auth/signup" />}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
