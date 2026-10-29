import type { Metadata } from "next";import "./globals.css";
import MetaConsent from "@/components/meta-consent";
import { META_PIXEL_ID } from "@/lib/meta-config";
export const metadata:Metadata={title:"VAIYO · La pureza que va contigo",description:"Agua alcalina y ozonizada a domicilio en Lima. Bidones, cajas y packs de botellas para hogares y empresas. Delivery incluido.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
const motionBootstrap="try{if(localStorage.getItem('vaiyo-motion')==='off')document.documentElement.dataset.vaiyoMotion='off'}catch{}if(document.documentElement.dataset.vaiyoMotion!=='off')document.documentElement.classList.add('motion-ready')";
// Keep the payment lookup token out of third-party tracking URLs while retaining
// it in this history entry for refresh. If this fails, Meta is not loaded there.
const paymentPrivacyBootstrap = "try{if(location.pathname==='/pago'){var u=new URL(location.href),t=u.searchParams.get('token');if(t&&/^[a-f0-9-]{36}$/.test(t)){u.search='';history.replaceState(Object.assign({},history.state,{vaiyoPaymentToken:t}),'',u.pathname+u.hash)}}}catch{}";
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es-PE" data-vaiyo-motion="on" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:motionBootstrap}}/>{/^\d{5,32}$/.test(META_PIXEL_ID)&&<script dangerouslySetInnerHTML={{__html:paymentPrivacyBootstrap}}/>}{children}<MetaConsent/></body></html>}
