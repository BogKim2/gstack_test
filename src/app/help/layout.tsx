import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getHelpNav } from "@/lib/help-content";
import { HelpSidebar } from "@/components/help-sidebar";

export default async function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const backHref = session.googleLinked
    ? "/dashboard"
    : "/settings/connect-google";

  const nav = getHelpNav();

  return (
    <div className="min-h-screen bg-gradient-to-br from-chart-5/10 via-background to-chart-2/10">
      <header className="border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Link href={backHref}>
              <Button variant="ghost" size="icon" aria-label="뒤로">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <BookOpen className="h-5 w-5 shrink-0 text-chart-500" />
            <h1 className="truncate text-lg font-semibold">도움말</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto flex h-[calc(100vh-3.5rem)] max-w-6xl flex-col md:flex-row">
        <HelpSidebar items={nav} />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
