import { auth } from "@/lib/auth";

export default async function ManagerDashboard() {
  const session = await auth();
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">שלום, {session?.user.name}</h1>
      <p className="text-slate-500 mt-1">לוח הבקרה של המנהל — בקרוב</p>
    </main>
  );
}
