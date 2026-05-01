import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UFO Collection",
  description:
    "Premium streetwear & fashion. Shop the latest trends with UFO Collection.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-[#0a0a0f] text-white antialiased`}
      >
        <I18nProvider>
          {children}

          {/* ✅ Toast System */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "#11121a",
                color: "#fff",
                border: "1px solid #26293a",
                borderRadius: "12px",
                fontSize: "13px",
              },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  );
}