import Link from "next/link";
import { createElement } from "react";

export class Header {
  static render() {
    return createElement(
      "header",
      { className: "site-header" },
      createElement(
        "div",
        { className: "container site-header__inner" },
        createElement(
          Link,
          { href: "/", className: "brand" },
          createElement("span", { className: "brand__name" }, "Hustler Dior"),
          createElement("span", { className: "brand__edit" }, "The Concrete Edit"),
        ),
        createElement(
          "nav",
          { className: "nav", "aria-label": "Primary" },
          createElement(Link, { href: "/collection" }, "Shop"),
          createElement(Link, { href: "/#manifesto" }, "Manifesto"),
          createElement(
            "a",
            { href: "https://www.printful.com", target: "_blank", rel: "noreferrer" },
            "Made to order",
          ),
        ),
      ),
    );
  }
}

export default function HeaderComponent() {
  return Header.render();
}
