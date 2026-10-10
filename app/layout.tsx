import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://tm-riddles-diary.vercel.app'),
  title: 'Tom Riddle’s Diary — Some things should remain unwritten',
  description: 'A candlelit encounter with a memory that writes back.',
  openGraph: {
    title: 'Tom Riddle’s Diary',
    description: 'Some things should remain unwritten.',
    url: '/',
    siteName: 'Tom Riddle’s Diary',
    type: 'website',
    images: [{ url: '/social-preview-v2.jpg', width: 1200, height: 630, alt: 'Tom Riddle’s diary on a candlelit desk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tom Riddle’s Diary',
    description: 'Some things should remain unwritten.',
    images: ['/social-preview-v2.jpg'],
  },
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }
