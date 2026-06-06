import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from 'next';
import { Alegreya, Merriweather_Sans } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import '../styles/main.scss';

const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
});

const merriweather = Merriweather_Sans({
  subsets: ['latin'],
  variable: '--font-merriweather',
});

export const metadata: Metadata = {
  title: 'Recipes',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${alegreya.variable} ${merriweather.variable}`}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <Analytics/>
      </body>
    </html>
  );
}
