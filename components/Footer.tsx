import Link from "next/link";
import { createElement } from "react";

export class Footer {
  static render() {
    return createElement(
      "footer",
      { className: "site-footer" },
      createElement(
        "div",
        { className: "container site-footer__inner" },
        createElement(
          "div",
          null,
          createElement("p", { className: "site-footer__brand" }, "Hustler Dior"),
          createElement(
            "p",
            { className: "site-footer__meta" },
            "The Concrete Edit · Wear your own rules · Made-to-order",
          ),
          createElement(
            "p",
            { className: "site-footer__credit" },
            "Creative direction: Swerve God · Fulfilled by Printful · Hosted on Hostinger",
          ),
        ),
        createElement(
          "div",
          { className: "site-footer__links" },
          createElement(Link, { href: "/collection" }, "Collection"),
          createElement(Link, { href: "/" }, "Home"),
        ),
      ),
    );
  }
}

export default function FooterComponent() {
  return Footer.render();
}
