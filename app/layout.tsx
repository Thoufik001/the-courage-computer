import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://the-courage-computer.vercel.app"),
  openGraph: {type:"website",url:"https://the-courage-computer.vercel.app",title:"COURAGE-OS — The computer in Nowhere",description:"A sarcastic computer. A room in Nowhere. An unofficial interactive fan project.",images:[{url:"/share-preview.jpg",width:1200,height:630,alt:"Courage computer in its wooden room"}]},
  twitter: {card:"summary_large_image",title:"COURAGE-OS — The computer in Nowhere",images:["/share-preview.jpg"]},
  title: "COURAGE-OS — The computer in Nowhere",
  description:
    "A sarcastic computer. A room in Nowhere. An unofficial interactive fan project.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
