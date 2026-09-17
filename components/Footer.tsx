import Link from "next/link";

export class Footer {
  static render() {
    return (
      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div>
            <p className="site-footer__brand">Hustler Dior</p>
            <p className="site-footer__meta">
              The Concrete Edit · Wear your own rules · Made-to-order
            </p>
            <p className="site-footer__credit">
              Creative direction: Swerve God · Fulfilled by Printful · Hosted on
              Hostinger
            </p>
          </div>
          <div className="site-footer__links">
            <Link href="/collection">Collection</Link>
            <Link href="/">Home</Link>
          </div>
        </div>
      </footer>
    );
  }
}

export default function FooterComponent() {
  return Footer.render();
}
