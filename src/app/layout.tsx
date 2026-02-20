import type { Metadata } from "next";
import { Gayathri, Poppins } from "next/font/google";
import localFont from "next/font/local";
import Image from "next/image";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthRedirectGuard } from "@/components/AuthRedirectGuard";

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

const gayathri = Gayathri({
  weight: ["400", "700"],
  subsets: ["latin", "malayalam"],
  variable: "--next-font-gayathri",
});

const ledCounter = localFont({
  src: "../../public/fonts/led_counter-7.ttf",
  variable: "--font-led-counter",
  display: "swap",
});

const gebuk = localFont({
  src: "../../public/fonts/Gebuk-Regular.ttf",
  variable: "--font-gebuk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Soshly",
  description: "Nearby experiences, TasteLists, and local events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${gayathri.variable} ${ledCounter.variable} ${gebuk.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <div className="app-frame">
          <Image
            src="/bg.svg"
            alt=""
            fill
            priority
            className="z-0 object-cover object-center pointer-events-none"
          />
          <div className="relative z-10 min-h-full">
            <AuthProvider>
              <AuthRedirectGuard>{children}</AuthRedirectGuard>
            </AuthProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
