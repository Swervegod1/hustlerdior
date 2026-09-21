import {
  workPaymentJobs,
  processPaidOrder,
} from "../src/lib/server/payment-worker";
import { database } from "../src/lib/server/database";
import { z } from "zod";
try {
  const orderId = process.argv[2];
  if (orderId) {
    await processPaidOrder(z.uuid().parse(orderId));
    console.log("Order reconciliation completed.");
  } else {
    await workPaymentJobs(10);
    console.log("Payment queue pass completed.");
  }
} finally {
  await database().end();
}
