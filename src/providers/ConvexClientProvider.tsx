"use client";

import React, { useState } from "react";
import { ConvexProvider } from "convex/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { convex } from "../lib/convex";

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ConvexProvider client={convex}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ConvexProvider>
  );
}
