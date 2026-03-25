import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "omni-rest Next.js Example",
  description: "Auto-generated REST APIs with React components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}