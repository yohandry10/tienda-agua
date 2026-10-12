import type { Metadata } from "next";
import PaymentResult from "@/components/payment-result";
export const metadata: Metadata = { title: "Tu pago | VAIYO", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default function Page() { return <PaymentResult/>; }
