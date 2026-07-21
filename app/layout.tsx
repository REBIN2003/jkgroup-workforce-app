import type { Metadata } from "next";
import "../src/styles/globals.css";
import { ConvexClientProvider } from "../src/providers/ConvexClientProvider";

export const metadata: Metadata = {
  title: "Enterprise HRMS & Workforce Management System",
  description: "Enterprise Workforce Management System ERP Solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
