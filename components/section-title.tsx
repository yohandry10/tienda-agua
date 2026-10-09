import { Children, cloneElement, isValidElement, type CSSProperties, type ReactNode } from "react";

function plainText(children: ReactNode): string {
  return Children.toArray(children).map(child => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    if (!isValidElement<{ children?: ReactNode }>(child)) return "";
    return child.type === "br" ? " " : plainText(child.props.children);
  }).join("");
}

export default function SectionTitle({ children }: { children: ReactNode }) {
  let order = 0;
  const words = (content: ReactNode): ReactNode => Children.map(content, child => {
    if (typeof child === "string") {
      return child.split(/(\s+)/).map((word, index) => {
        if (!word.trim()) return word;
        return <span className="motion-word-mask" key={index} style={{ "--motion-order": order++ } as CSSProperties}>
          <span className="motion-word-inner">{word}</span>
        </span>;
      });
    }
    if (!isValidElement<{ children?: ReactNode }>(child) || child.type === "br") return child;
    return cloneElement(child, undefined, words(child.props.children));
  });

  return <h2 className="motion-heading" aria-label={plainText(children).replace(/\s+/g, " ").trim()}>
    <span className="motion-heading-content" aria-hidden="true">{words(children)}</span>
  </h2>;
}
