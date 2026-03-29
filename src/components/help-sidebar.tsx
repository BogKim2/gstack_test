"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type HelpNavEntry = { slug: string; title: string };

export function HelpSidebar({ items }: { items: HelpNavEntry[] }) {
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(s) ||
        i.slug.toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <aside className="flex w-full shrink-0 flex-col border-b bg-muted/20 md:w-56 md:border-b-0 md:border-r">
      <div className="p-3">
        <Input
          type="search"
          placeholder="메뉴 검색…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-9 text-sm"
          aria-label="도움말 메뉴 검색"
        />
      </div>
      <nav className="flex max-h-[50vh] flex-col gap-0.5 overflow-y-auto px-2 pb-3 md:max-h-[calc(100vh-8rem)]">
        {filtered.map((item) => {
          const href = `/help/${item.slug}`;
          const active = pathname === href;
          return (
            <Link
              key={item.slug}
              href={href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary/15 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.title}
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">일치하는 항목 없음</p>
        )}
      </nav>
    </aside>
  );
}
