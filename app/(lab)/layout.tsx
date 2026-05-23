import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LabSignOutButton from "./LabSignOutButton";
import DarkModeToggle from "@/components/ui/DarkModeToggle";

/**
 * Lab route group layout — accessible to LAB_USER only.
 * Any other authenticated role is dispatched back to root for correct routing.
 */
export default async function LabLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "LAB_USER") redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Minimal header — no full Navbar; lab users only have one page */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">מעבדת ריכוזי חמצן</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{session.user.name}</span>
            <DarkModeToggle />
            <LabSignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
