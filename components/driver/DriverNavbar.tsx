"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import NotificationToggle from "@/components/ui/NotificationToggle";

const links = [
  { href: "/driver/dashboard", label: "משימות" },
  { href: "/driver/inventory", label: "מלאי" },
];

interface DriverNavbarProps {
  userName: string;
}

export default function DriverNavbar({ userName }: DriverNavbarProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <nav className="flex gap-1 mr-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith(link.href)
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* User + toggle + logout */}
          <div className="flex items-center gap-2">
            <NotificationToggle />
            <DarkModeToggle />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">{userName.charAt(0)}</span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{userName}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              יציאה
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
