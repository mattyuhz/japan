import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
const geist=Geist({variable:"--font-geist-sans",subsets:["latin"]});
export const metadata:Metadata={title:"Japan · November 2026",description:"A compact field plan for thirteen days across Tokyo, Kyoto, Osaka, and Kamakura.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"},openGraph:{title:"Japan · November 2026",description:"Tokyo → Kyoto → Osaka → Tokyo. A compact thirteen-day field plan.",type:"website",images:[{url:"/og.png",width:1200,height:630,alt:"Japan field plan, November 10–23, 2026"}]},twitter:{card:"summary_large_image",title:"Japan · November 2026",description:"Tokyo → Kyoto → Osaka → Tokyo. A compact thirteen-day field plan.",images:["/og.png"]}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body className={geist.variable}>{children}</body></html>}
