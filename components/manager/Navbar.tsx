"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import DarkModeToggle from "@/components/ui/DarkModeToggle";
import NotificationToggle from "@/components/ui/NotificationToggle";

const links = [
  { href: "/manager/dashboard",    label: "לוח בקרה" },
  { href: "/manager/drivers",      label: "צוות" },
  { href: "/manager/tasks",        label: "משימות" },
  { href: "/manager/deliveries",   label: "יומן מסירות" },
  { href: "/manager/inventory",    label: "מלאי" },
  { href: "/manager/catalog",      label: "קטלוג" },
  { href: "/manager/lab-settings", label: "הגדרות מעבדה" },
  { href: "/manager/lab-reports",  label: "דוח מעבדה" },
];

interface NavbarProps {
  userName: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">מערכת ניהול נהגים</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User + toggle + logout */}
          <div className="flex items-center gap-2">
            <NotificationToggle />
            <DarkModeToggle />
            <Link
              href="/manager/profile"
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-200">
                  {userName.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{userName}</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              יציאה
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-100 dark:border-slate-700 px-4 py-2 flex gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === link.href
                ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
