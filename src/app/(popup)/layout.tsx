"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";

export default function PopupLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-w-[1280px] min-h-screen bg-background text-foreground">
          {children}
        </div>
      </QueryClientProvider>
    </SessionProvider>
  );
}
