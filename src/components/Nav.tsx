"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/subjects", label: "Subjects" },
  { href: "/timetable", label: "Timetable" },
  { href: "/attendance", label: "Attendance" },
  { href: "/calendar", label: "Calendar" },
  { href: "/import", label: "Import (OCR)" },
  { href: "/settings", label: "Settings" },
  { href: "/profiles", label: "Profiles" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-neutral-200 p-4">
      <div className="font-semibold text-lg">WeightedAttend</div>
      <div className="text-xs text-neutral-500 mt-1">Section + Lab Group aware</div>

      <nav className="mt-4 flex md:flex-col gap-2 flex-wrap">
        {items.map((i) => {
          const active = pathname.startsWith(i.href);
          return (
            <Link
              key={i.href}
              href={i.href}
              className={`px-3 py-2 rounded-md text-sm border ${
                active
                  ? "bg-black text-white border-black"
                  : "bg-white text-black border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {i.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}