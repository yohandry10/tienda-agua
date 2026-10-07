import type { Metadata } from "next";import "./globals.css";
export const metadata:Metadata={title:"VAIYO · La pureza que va contigo",description:"Agua alcalina y ozonizada a domicilio en Lima. Bidones, cajas y packs de botellas para hogares y empresas. Delivery incluido.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-PE"><body>{children}</body></html>}
