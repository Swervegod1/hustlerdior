import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="status-page">
      <p className="eyebrow">404 / OFF THE GRID</p>
      <h1>
        THIS PIECE
        <br />
        MOVED ON.
      </h1>
      <Link href="/#collection" className="primary-button">
        BACK TO THE COLLECTION ↗
      </Link>
    </main>
  );
}
