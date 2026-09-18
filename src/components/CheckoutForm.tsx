"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, useUI } from "@/stores/cart";
import { money } from "@/lib/format";
import type { Recipient } from "@/lib/checkout-schema";
import type { PublicQuote } from "@/lib/commerce-schema";
import { Arrow } from "./Icons";
import CartJourney from "./CartJourney";
import CompleteTheLook from "./CompleteTheLook";
const initial: Recipient = {
  name: "",
  email: "",
  address1: "",
  address2: "",
  city: "",
  state_code: "",
  zip: "",
  country_code: "US",
};
const fields = [
  ["name", "Full name", "name"],
  ["email", "Email", "email"],
  ["address1", "Street address", "address-line1"],
  ["address2", "Apartment / suite (optional)", "address-line2"],
  ["city", "City", "address-level2"],
  ["state_code", "State (two-letter code)", "address-level1"],
  ["zip", "ZIP code", "postal-code"],
] as const;
export default function CheckoutForm({ enabled }: { enabled: boolean }) {
  const lines = useCart((s) => s.lines);
  const openBag = useUI((s) => s.openBag);
  const [recipient, setRecipient] = useState(initial);
  const [quote, setQuote] = useState<{
    value: PublicQuote;
    key: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const cart = {
    items: lines.map(({ productId, variantId, quantity }) => ({
      productId,
      variantId,
      quantity,
    })),
  };
  const input = { cart, recipient };
  const fingerprint = JSON.stringify(input);
  const current = quote?.key === fingerprint ? quote.value : null;
  const currency = current?.currency ?? lines[0]?.currency ?? "USD";
  const subtotal =
    current?.subtotalCents ??
    lines.reduce((n, line) => n + line.quantity * line.priceCents, 0);
  async function requestQuote(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    setQuote(null);
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: fingerprint,
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "The quote is unavailable.");
      setQuote({ value: data, key: fingerprint });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function pay() {
    if (!current || busy) return;
    if (current.expiresAt <= Date.now()) {
      setQuote(null);
      setMessage("Your quote expired. Refresh it before paying.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId: current.id }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Checkout is unavailable.");
      const url = new URL(data.url);
      if (
        url.origin !== "https://checkout.stripe.com" ||
        url.username ||
        url.password
      )
        throw new Error("Checkout could not be opened.");
      window.location.assign(url.href);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
      setBusy(false);
    }
  }
  if (!lines.length)
    return (
      <div className="checkout-empty">
        <p>Your bag is empty. Choose a piece to begin.</p>
        <Link href="/" className="primary-button">
          EXPLORE THE COLLECTION <Arrow />
        </Link>
      </div>
    );
  return (
    <>
      <CartJourney step={current ? 3 : 2} />
      {!enabled && (
        <div className="checkout-readiness" role="status">
          <span aria-hidden="true">✳</span>
          <p>
            <strong>Build your edit. Keep it saved.</strong>Online payment is
            being prepared. You can review your pieces and add finishing touches
            now.
          </p>
        </div>
      )}
      <div className="checkout-layout">
        <div className="checkout-delivery-column">
          <form onSubmit={requestQuote} className="delivery-form">
            <span className="eyebrow">01 / WHERE YOUR PIECES ARE GOING</span>
            <h2>DELIVERY DETAILS.</h2>
            <p className="field-hint">
              United States delivery. Review your address and the live quote
              before continuing to secure payment.
            </p>
            <fieldset disabled={busy || !enabled}>
              <legend className="sr-only">Delivery address</legend>
              <div className="delivery-fields">
                {fields.map(([key, label, autocomplete]) => (
                  <label className={`field-label field-${key}`} key={key}>
                    {label}
                    <input
                      name={key}
                      autoComplete={autocomplete}
                      type={key === "email" ? "email" : "text"}
                      required={key !== "address2"}
                      value={recipient[key]}
                      maxLength={
                        key === "state_code"
                          ? 2
                          : key === "zip"
                            ? 10
                            : key === "email"
                              ? 254
                              : 200
                      }
                      pattern={
                        key === "state_code"
                          ? "[A-Za-z]{2}"
                          : key === "zip"
                            ? "[0-9]{5}(-[0-9]{4})?"
                            : undefined
                      }
                      onChange={(event) =>
                        setRecipient((r) => ({
                          ...r,
                          [key]:
                            key === "state_code"
                              ? event.target.value.toUpperCase()
                              : event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              <button className="secondary-button" type="submit">
                {busy
                  ? "CHECKING…"
                  : current
                    ? "REFRESH DELIVERY QUOTE"
                    : "GET DELIVERY QUOTE"}
                <Arrow />
              </button>
            </fieldset>
            <p className="field-hint">
              Your address is used to quote and fulfill your order.{" "}
              <Link href="/privacy">Privacy information</Link>
            </p>
          </form>
          <CompleteTheLook placement="checkout" />
        </div>
        <section className="checkout-summary" aria-label="Review and pay">
          <span className="eyebrow">02 / THE FINAL EDIT</span>
          <div className="checkout-edit-heading">
            <h2>YOUR PIECES.</h2>
            <button
              type="button"
              className="checkout-edit-bag"
              onClick={() => openBag(true)}
            >
              EDIT BAG ↗
            </button>
          </div>
          {(current?.lines ?? lines).map((line) => (
            <div className="checkout-summary-line" key={line.variantId}>
              {lines.find((item) => item.variantId === line.variantId)
                ?.image && (
                <div className="checkout-piece-image">
                  <Image
                    src={
                      lines.find((item) => item.variantId === line.variantId)!
                        .image!
                    }
                    alt=""
                    fill
                    sizes="64px"
                  />
                </div>
              )}
              <span>
                {line.name}
                <small>
                  {
                    lines.find((item) => item.variantId === line.variantId)
                      ?.color
                  }{" "}
                  /{" "}
                  {
                    lines.find((item) => item.variantId === line.variantId)
                      ?.size
                  }{" "}
                  · Qty {line.quantity}
                </small>
              </span>
              <strong>
                {money(line.priceCents * line.quantity, currency)}
              </strong>
            </div>
          ))}
          <dl className="checkout-totals">
            <div>
              <dt>Merchandise</dt>
              <dd>{money(subtotal, currency)}</dd>
            </div>
            <div>
              <dt>Standard shipping</dt>
              <dd>
                {current
                  ? money(current.shippingCents, currency)
                  : "Enter delivery details"}
              </dd>
            </div>
            <div>
              <dt>Sales tax</dt>
              <dd>Shown at secure payment</dd>
            </div>
            {current && (
              <div className="checkout-before-tax">
                <dt>Total before sales tax</dt>
                <dd>
                  {money(
                    current.subtotalCents + current.shippingCents,
                    currency,
                  )}
                </dd>
              </div>
            )}
          </dl>
          {current && (
            <p className="field-hint">
              Prices and availability have been checked. This quote can open
              checkout for 15 minutes. Delivery: {recipient.address1},{" "}
              {recipient.city}, {recipient.state_code} {recipient.zip}.
            </p>
          )}
          <button
            type="button"
            className="primary-button"
            disabled={!current || busy || !enabled}
            onClick={pay}
          >
            {busy ? "PLEASE WAIT…" : "CONTINUE TO SECURE PAYMENT"}
            <Arrow />
          </button>
          <p className="form-message" role="status">
            {message ||
              (!enabled
                ? "Online checkout is being prepared. Your bag stays saved on this device."
                : "")}
          </p>
          <Link className="continue-shopping" href="/">
            Keep exploring
          </Link>
        </section>
      </div>
    </>
  );
}
