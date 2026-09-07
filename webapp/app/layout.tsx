import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "M.N.S. Portfolio | คณะพยาบาลศาสตร์ มธ.",
  description: "แฟ้มสะสมผลงานและระบบติดตามความก้าวหน้านักศึกษา คณะพยาบาลศาสตร์ มหาวิทยาลัยธรรมศาสตร์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
