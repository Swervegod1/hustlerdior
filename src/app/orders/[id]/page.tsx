import { z } from "zod";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import OrderStatus from "@/components/OrderStatus";
export const metadata: Metadata = {
  title: "Order Status",
  robots: { index: false, follow: false },
};
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  return (
    <main id="main" className="reading-page">
      <OrderStatus id={id.data} />
    </main>
  );
}
