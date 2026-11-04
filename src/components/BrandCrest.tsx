import Image from "next/image";
export default function BrandCrest() {
  return (
    <span className="brand-crest" aria-hidden="true">
      <Image
        src="/brand/chrome-lockup.webp"
        alt=""
        width={180}
        height={60}
        sizes="180px"
      />
    </span>
  );
}
