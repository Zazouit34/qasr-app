import { Outfit, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { I18nProvider } from "@/context/I18nContext";
import Providers from "@/components/providers/Providers";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, parseLocaleCookie } from "@/i18n/config";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = parseLocaleCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const isRtl = locale === "ar";

  return (
    <html lang={locale} dir={isRtl ? "rtl" : "ltr"} suppressHydrationWarning>
      <body
        className={`${isRtl ? notoArabic.className : outfit.className} relative z-1 min-h-screen bg-gray-50 font-normal dark:bg-gray-900`}
      >
        <I18nProvider locale={locale}>
          <ThemeProvider>
            <Providers>
              <SidebarProvider>{children}</SidebarProvider>
            </Providers>
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
