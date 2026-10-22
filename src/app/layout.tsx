import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "88GB Production Expenses",
  description: "Expense tracker for the video production team",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="flex min-h-full flex-col font-sans"
        style={{ backgroundColor: "#0c0a09", color: "#f5f0eb" }}
      >
        {children}
      </body>
    </html>
  );
}
