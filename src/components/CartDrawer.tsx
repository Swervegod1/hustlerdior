"use client";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCart, useUI } from "@/stores/cart";
import { money } from "@/lib/format";
import { Arrow, Close } from "./Icons";
import CompleteTheLook from "./CompleteTheLook";
import CartJourney from "./CartJourney";

export default function CartDrawer() {
  const { lines, quantity, remove } = useCart();
  const { bagOpen, openBag } = useUI();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const count = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((n, l) => n + l.quantity * l.priceCents, 0);
  function checkout() {
    openBag(false);
    router.push("/checkout");
  }
  return (
    <Dialog.Root open={bagOpen} onOpenChange={openBag}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="cart-drawer" data-lenis-prevent>
          <div className="drawer-heading">
            <div>
              <span className="eyebrow">THE FIT CHECK / HUSTLER DIOR</span>
              <Dialog.Title>
                YOUR BAG <span>({count})</span>
              </Dialog.Title>
              <p className="bag-saved-note">Your edit, saved on this device.</p>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close bag">
              <Close />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Review your selected pieces, sizes, quantities and subtotal.
          </Dialog.Description>
          {lines.length ? (
            <>
              <CartJourney step={1} />
              <div className="cart-lines">
                <AnimatePresence initial={false}>
                  {lines.map((line) => (
                    <motion.div
                      className="cart-line"
                      key={line.variantId}
                      layout={reducedMotion ? false : "position"}
                      exit={{ opacity: 0, x: reducedMotion ? 0 : 24 }}
                      transition={{ duration: reducedMotion ? 0 : 0.2 }}
                    >
                      <div className="cart-image">
                        {line.image && (
                          <Image
                            src={line.image}
                            alt={line.name}
                            fill
                            sizes="100px"
                          />
                        )}
                      </div>
                      <div className="cart-line-details">
                        <h3>{line.name}</h3>
                        <p>
                          {line.color} / {line.size}
                        </p>
                        <strong>
                          {money(
                            line.priceCents * line.quantity,
                            line.currency,
                          )}
                        </strong>
                        <div className="cart-line-actions">
                          <div className="quantity-control">
                            <button
                              type="button"
                              disabled={line.quantity <= 1}
                              aria-label={`Decrease ${line.name} quantity`}
                              onClick={() =>
                                quantity(line.variantId, line.quantity - 1)
                              }
                            >
                              −
                            </button>
                            <span aria-live="polite">{line.quantity}</span>
                            <button
                              type="button"
                              disabled={line.quantity >= 20}
                              aria-label={`Increase ${line.name} quantity`}
                              onClick={() =>
                                quantity(line.variantId, line.quantity + 1)
                              }
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="remove-line"
                            onClick={() => remove(line.variantId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <CompleteTheLook />
              </div>
              <div className="cart-total">
                <div>
                  <span>SUBTOTAL</span>
                  <motion.strong
                    key={subtotal}
                    initial={reducedMotion ? false : { opacity: 0.4, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {money(subtotal, lines[0].currency)}
                  </motion.strong>
                </div>
                <p>Shipping and tax are calculated at checkout.</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={checkout}
                >
                  REVIEW & CHECKOUT
                  <Arrow />
                </button>
                <button
                  type="button"
                  className="continue-shopping"
                  onClick={() => openBag(false)}
                >
                  Continue the hunt
                </button>
              </div>
            </>
          ) : (
            <div className="empty-bag">
              <span>
                NOTHING
                <br />
                ORDINARY.
              </span>
              <p>Your next signature piece is waiting.</p>
              <button
                type="button"
                className="primary-button"
                onClick={() => openBag(false)}
              >
                EXPLORE THE COLLECTION <Arrow />
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
