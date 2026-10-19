import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReadFlow.ai | Multi-Domain Interactive PDF Learning",
  description:
    "Production-level interactive PDF learning platform across Medicine, Education, Supply Chain, Finance, Mathematics, and Physics with Google Gemini AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased selection:bg-[#E4A3D4] selection:text-[#3D2347]">
        {children}
      </body>
    </html>
  );
}
