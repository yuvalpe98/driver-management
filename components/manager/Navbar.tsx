"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/manager/dashboard", label: "לוח בקרה" },
  { href: "/manager/drivers", label: "נהגים" },
  { href: "/manager/tasks", label: "משימות" },
];

interface NavbarProps {
  userName: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
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
            <span className="font-bold text-slate-800 text-sm">מערכת ניהול נהגים</span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* User + logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-slate-600">
                  {userName.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium text-slate-700 hidden sm:block">{userName}</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-sm text-slate-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              יציאה
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex-1 text-center px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === link.href
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
