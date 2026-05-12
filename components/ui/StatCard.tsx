interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "blue" | "green" | "yellow" | "slate";
}

const colorMap = {
  blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   text: "text-blue-700"   },
  green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-600", text: "text-green-700"  },
  yellow: { bg: "bg-yellow-50", icon: "bg-yellow-100 text-yellow-600",text: "text-yellow-700" },
  slate:  { bg: "bg-slate-50",  icon: "bg-slate-100 text-slate-600", text: "text-slate-700"  },
};

export default function StatCard({ label, value, icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} rounded-2xl p-6 flex items-center gap-4`}>
      <div className={`${c.icon} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className={`${c.text} text-3xl font-bold mt-0.5`}>{value}</p>
      </div>
    </div>
  );
}
