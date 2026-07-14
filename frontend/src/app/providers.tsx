"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";

import { useCartStore } from "@/store/useCartStore";

function CartBootstrap() {
  const refresh = useCartStore((s) => s.refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <CartBootstrap />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
