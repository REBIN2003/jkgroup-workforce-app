import { ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.warn(
    "Warning: Missing NEXT_PUBLIC_CONVEX_URL environment variable. " +
    "Please ensure it is set in your Vercel Project Environment Variables."
  );
}

// Fallback to actual production URL prevents client-side 'Couldn't parse deployment name' fatal errors
export const convex = new ConvexReactClient(
  convexUrl || "https://reliable-ant-46.eu-west-1.convex.cloud"
);
