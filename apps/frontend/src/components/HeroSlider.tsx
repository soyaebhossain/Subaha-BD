'use client';

import { useEffect, useMemo, useState } from "react";

type Slide = {
  title: string;
  subtitle: string;
  pills?: string[];
  image: string;
  ctaLabel?: string;
  ctaHref?: string;
};

interface Props {
  slides: Slide[];
}

export default function HeroSlider({ slides }: Props) {
  const safeSlides = useMemo(() => (slides.length ? slides : []), [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!safeSlides.length) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % safeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [safeSlides.length]);

  if (!safeSlides.length) return null;

  const current = safeSlides[index];

  return (
    <div className="heroSlider">
      <div
        className="heroBanner"
        style={{ backgroundImage: `url('${current.image}')` }}
      >
        <div className="heroOverlay">
          <div className="heroTitle">{current.title}</div>
          <div className="heroBig">{current.subtitle}</div>
          {current.pills?.length ? (
            <div className="heroPills">
              {current.pills.map((pill) => (
                <span key={pill} className="pill">
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
          {current.ctaLabel ? (
            <a href={current.ctaHref ?? "#"} className="heroBtn">
              {current.ctaLabel}
            </a>
          ) : null}
        </div>
      </div>

      <div className="heroDots">
        {safeSlides.map((_, i) => (
          <button
            key={i}
            className={`heroDot ${i === index ? "active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
