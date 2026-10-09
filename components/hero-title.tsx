import type { CSSProperties } from "react";

function Word({ children, index }: { children: string; index: number }) {
  return <span className="hero-word-mask" style={{ "--word-index": index } as CSSProperties}>
    <span className="hero-word-inner">{children}</span>
  </span>;
}

export default function HeroTitle() {
  return <h1 id="hero-title" aria-label="La pureza que va contigo.">
    <span className="hero-title-line" aria-hidden="true">
      <Word index={0}>La</Word>{" "}<Word index={1}>pureza</Word>{" "}<Word index={2}>que</Word>
    </span>
    <em className="hero-title-line" aria-hidden="true">
      <Word index={3}>va</Word>{" "}<Word index={4}>contigo.</Word>
    </em>
  </h1>;
}
