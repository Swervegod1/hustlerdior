import { z } from "zod";

export const humanRequestSchema = z
  .object({
    requestId: z.uuid(),
    explicitHumanRequest: z.literal(true),
    name: z.string().trim().max(50).default(""),
    email: z.email().max(128),
    reason: z.string().trim().min(5).max(180),
  })
  .strict();

export const deskAnswers = {
  fit: {
    text: "Start with your preferred silhouette, then check the size and color on the product page. Our fit guide explains how to compare proportions.",
    href: "/fit-guide",
    action: "OPEN THE FIT GUIDE",
  },
  shipping: {
    text: "When checkout is configured, a live Printful delivery quote is calculated from your US address and bag. We cannot promise a delivery date from browsing the catalog alone.",
    href: "/help",
    action: "ORDERING INFORMATION",
  },
  checkout: {
    text: "Checkout uses a US delivery quote and Stripe-hosted payment when Stripe keys are set on the host. If payment is not configured, your bag stays saved in this browser. Adding a piece does not reserve inventory.",
    href: "/checkout",
    action: "REVIEW CHECKOUT",
  },
} as const;

// A future model may propose this tool. Only a separate, explicit confirmation
// by the customer can submit the browser request to /api/support/human.
export const humanTool = {
  name: "request_human_agent",
  description:
    "Offer a human handoff only when the shopper explicitly asks for a person. Open the confirmation form; do not send a message yourself.",
  parameters: {
    type: "object",
    properties: { reason: { type: "string", maxLength: 180 } },
    required: ["reason"],
    additionalProperties: false,
  },
} as const;
