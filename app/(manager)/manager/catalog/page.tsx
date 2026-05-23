import { prisma } from "@/lib/prisma";
import CatalogManager from "./CatalogManager";

export default async function CatalogPage() {
  const items = await prisma.catalogItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { inventoryItems: true, equipment: true } },
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">קטלוג פריטים</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          הגדר את רשימת הפריטים המאושרים — נהגים יוכלו לבחור רק מתוך קטלוג זה
        </p>
      </div>

      <CatalogManager initialItems={items} />
    </div>
  );
}
