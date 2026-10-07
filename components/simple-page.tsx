import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
export default function SimplePage({title,children}:{title:string;children:ReactNode}) {return <main className="simple-page"><header className="simple-header"><a href="/"><img className="brand-logo" src="/assets/vaiyo-logo.png" alt="VAIYO"/></a><a href="/"><ArrowLeft size={17}/> Volver a VAIYO</a></header><h1>{title}</h1>{children}</main>}
