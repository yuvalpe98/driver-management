"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ToggleDriverButton({
  driverId,
  isActive,
}: {
  driverId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch(`/api/drivers/${driverId}`, { method: "PATCH" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-green-50 text-green-600 hover:bg-green-100"
      }`}
    >
      {loading ? "..." : isActive ? "השבת" : "הפעל"}
    </button>
  );
}
