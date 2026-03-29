"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Mail } from "lucide-react";
import { useState } from "react";

interface Thread {
  id: string;
  snippet: string;
}

interface MeetingContextProps {
  contexts: Record<string, Thread[]>;
}

export function MeetingContext({ contexts }: MeetingContextProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  if (!contexts || Object.keys(contexts).length === 0) {
    return null;
  }

  const toggleItem = (email: string) => {
    setOpenItems((prev) => ({ ...prev, [email]: !prev[email] }));
  };

  return (
    <div className="space-y-2">
      <h3 className="mb-3 font-semibold">미팅 컨텍스트</h3>
      {Object.entries(contexts).map(([email, threads]) => (
        <Collapsible
          key={email}
          open={openItems[email]}
          onOpenChange={() => toggleItem(email)}
        >
          <Card className="border-l-4 border-l-chart-4 bg-chart-4/5">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-chart-4" />
                  <CardTitle className="text-sm font-medium">{email}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {threads.length}개 스레드
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openItems[email] ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-2">
                <div className="space-y-2">
                  {threads.map((thread, idx) => (
                    <div
                      key={thread.id}
                      className="rounded-md border bg-muted/50 p-3 text-xs"
                    >
                      <p className="text-muted-foreground">{thread.snippet}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
}
