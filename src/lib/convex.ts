import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn(
    "Warning: Missing NEXT_PUBLIC_CONVEX_URL environment variable. " +
    "Please ensure it is set in your Vercel Project Environment Variables."
  );
}

// Fallback placeholder URL prevents Next.js static page pre-render/build crashes
export const convex = new ConvexReactClient(
  convexUrl || "https://placeholder-url.convex.cloud"
);
