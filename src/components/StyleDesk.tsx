"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Arrow, Close } from "./Icons";
import { BRAND_LINKS } from "@/lib/brand";
import { deskAnswers } from "@/lib/support";

export default function StyleDesk() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"style" | "human">("style");
  const [answer, setAnswer] = useState<keyof typeof deskAnswers | null>(null);
  const [ready, setReady] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState("");
  const requestId = useRef("");

  useEffect(() => {
    if (!open || mode !== "human") return;
    const controller = new AbortController();
    fetch("/api/support/human", { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setReady(data.ready === true))
      .catch(() => {
        if (!controller.signal.aborted) setReady(false);
      });
    return () => controller.abort();
  }, [open, mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || sending || attempted) return;
    const values = new FormData(event.currentTarget);
    if (values.get("confirm") !== "yes") return;
    setSending(true);
    setAttempted(true);
    try {
      const response = await fetch("/api/support/human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          requestId: requestId.current,
          explicitHumanRequest: true,
          name: values.get("name"),
          email: values.get("email"),
          reason: values.get("reason"),
        }),
      });
      const data = await response.json();
      setMessage(
        response.ok
          ? data.message
          : data.error ||
              "We could not confirm your request. Please email the team.",
      );
    } catch {
      setMessage(
        "We could not confirm your request. Please email the team; do not submit again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (value) {
          setMode("style");
          setAnswer(null);
          setMessage("");
          setReady(null);
          setAttempted(false);
          requestId.current = crypto.randomUUID();
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button type="button" className="style-desk-trigger">
          <span aria-hidden="true">✳</span> STYLE DESK
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay desk-overlay" />
        <Dialog.Content className="style-desk" data-lenis-prevent>
          <Dialog.Close className="desk-close" aria-label="Close style desk">
            <Close />
          </Dialog.Close>
          <p className="eyebrow">HUSTLER DIOR / STYLE DESK</p>
          <Dialog.Title>
            MAKE IT
            <br />
            <span>YOUR ROTATION.</span>
          </Dialog.Title>
          <Dialog.Description>
            Collection shortcuts, straight answers, and a way to reach our team.
          </Dialog.Description>
          {mode === "style" ? (
            <>
              <div className="desk-directions" aria-label="Find your style">
                {[
                  ["GRAPHIC TEES", "/collections/tees"],
                  ["LAYERS & HOODIES", "/collections/hoodies-layers"],
                  ["THE WOMEN’S EDIT", "/collections/womens-streetwear"],
                  ["THE MEN’S EDIT", "/collections/mens-streetwear"],
                ].map(([name, href]) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)}>
                    {name}
                    <Arrow />
                  </Link>
                ))}
              </div>
              <div
                className="desk-topics"
                role="group"
                aria-label="Quick answers"
              >
                {(
                  [
                    ["fit", "FIT & SIZING"],
                    ["shipping", "DELIVERY"],
                    ["checkout", "CHECKOUT"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    aria-pressed={answer === key}
                    onClick={() => setAnswer(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {answer && (
                <div className="desk-answer" aria-live="polite">
                  <p>{deskAnswers[answer].text}</p>
                  <Link
                    href={deskAnswers[answer].href}
                    onClick={() => setOpen(false)}
                  >
                    {deskAnswers[answer].action} ↗
                  </Link>
                </div>
              )}
              <button
                type="button"
                className="desk-human"
                onClick={() => setMode("human")}
              >
                I’D LIKE TO SPEAK TO A PERSON <Arrow />
              </button>
            </>
          ) : (
            <div className="desk-contact">
              <button
                type="button"
                className="desk-back"
                onClick={() => setMode("style")}
              >
                ← BACK TO STYLE DESK
              </button>
              <h3>LET’S CONNECT.</h3>
              {ready === null && (
                <p role="status">Checking the best way to reach us…</p>
              )}
              {ready === false && (
                <p>
                  Send your question to our team by email. Include the piece,
                  color and size if you’re asking about an item.
                </p>
              )}
              {ready === true && (
                <form onSubmit={submit}>
                  <label>
                    NAME (OPTIONAL)
                    <input name="name" autoComplete="name" maxLength={50} />
                  </label>
                  <label>
                    YOUR EMAIL
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={128}
                    />
                  </label>
                  <label>
                    HOW CAN WE HELP?
                    <textarea
                      name="reason"
                      required
                      minLength={5}
                      maxLength={180}
                      rows={3}
                    />
                  </label>
                  <label className="desk-consent">
                    <input
                      name="confirm"
                      type="checkbox"
                      value="yes"
                      required
                    />
                    I’m requesting human help. Send these details to the team
                    for this request.
                  </label>
                  <p className="desk-privacy">
                    This does not subscribe you to marketing.{" "}
                    <Link href="/privacy#support">
                      How we handle support details.
                    </Link>
                  </p>
                  <button
                    type="submit"
                    className="desk-submit"
                    disabled={sending || attempted}
                  >
                    {sending
                      ? "SUBMITTING…"
                      : attempted
                        ? "REQUEST ATTEMPTED"
                        : "REQUEST HUMAN HELP"}
                  </button>
                </form>
              )}
              {message && (
                <p role="status" className="desk-answer">
                  {message}
                </p>
              )}
              <a
                className="desk-email"
                href={`mailto:${BRAND_LINKS.email}?subject=Hustler%20Dior%20%E2%80%94%20human%20help%20request`}
              >
                EMAIL THE TEAM <Arrow />
              </a>
              <small>We’ll reply when a team member is available.</small>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
