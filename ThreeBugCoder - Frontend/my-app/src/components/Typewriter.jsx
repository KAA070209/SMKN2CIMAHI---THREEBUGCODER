import React, { useEffect, useRef, useState } from "react";

export function Typewriter({ text, speed = 45, startDelay = 250, style, className, tag = "h1" }) {
  const [count, setCount] = useState(0);
  const reduced = useRef(
    typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (reduced.current) {
      setCount(text.length);
      return;
    }
    setCount(0);
    let raf;
    let start = null;
    const tick = (t) => {
      if (start === null) start = t;
      const elapsed = t - start - startDelay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const next = Math.floor(elapsed / speed);
      if (next >= text.length) {
        setCount(text.length);
        return;
      }
      setCount(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, speed, startDelay]);

  const Tag = tag;
  return (
    <Tag style={style} className={className} aria-label={text}>
      <span aria-hidden="true" style={{ whiteSpace: "pre-line" }}>
        {text.slice(0, count)}
      </span>
      <span aria-hidden="true" className="bk-caret" />
    </Tag>
  );
}