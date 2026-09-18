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
    text: "Delivery quotes and shipping policies will be published before checkout opens. We cannot promise a delivery date during this catalog preview.",
    href: "/help",
    action: "ORDERING INFORMATION",
  },
  checkout: {
    text: "Online checkout is being prepared; you can explore pieces and save a bag in this browser. Adding to your bag does not reserve inventory.",
    href: "/#collection",
    action: "EXPLORE THE COLLECTION",
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
