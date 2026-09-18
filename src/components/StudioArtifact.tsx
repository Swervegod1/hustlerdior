"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-fallback">
      HD<span>INDEPENDENT BY DESIGN.</span>
    </div>
  ),
});

export default function StudioArtifact() {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!root.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="studio-artifact" ref={root}>
      <span className="studio-label">FROM THE HD STUDIO</span>
      {visible ? (
        <HeroScene />
      ) : (
        <div className="scene-fallback">
          HD<span>INDEPENDENT BY DESIGN.</span>
        </div>
      )}
      <span className="studio-caption">CHROME STUDY / CONCEPT ARTIFACT</span>
      <span className="studio-drag">DRAG TO EXPLORE ↔</span>
    </div>
  );
}
