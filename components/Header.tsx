import Link from "next/link";

export class Header {
  static render() {
    return (
      <header className="site-header">
        <div className="container site-header__inner">
          <Link href="/" className="brand">
            <span className="brand__name">Hustler Dior</span>
            <span className="brand__edit">The Concrete Edit</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            <Link href="/collection">Shop</Link>
            <Link href="/#manifesto">Manifesto</Link>
            <a href="https://www.printful.com" target="_blank" rel="noreferrer">
              Made to order
            </a>
          </nav>
        </div>
      </header>
    );
  }
}

export default function HeaderComponent() {
  return Header.render();
}
