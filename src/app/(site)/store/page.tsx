import type { Metadata } from "next";
import { StoreView } from "./StoreView";
import { getProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store — Merch, Albums & Prints",
  description:
    "Buy Sinza Universal merchandise, albums on CD and vinyl, and limited concert prints. Mobile money and card accepted.",
  alternates: { canonical: "/store" },
};

export default async function StorePage() {
  const products = await getProducts().catch(() => []);
  const categories = Array.from(new Set(products.map((p) => p.category)));
  return (
    <StoreView products={JSON.parse(JSON.stringify(products))} categories={categories as string[]} />
  );
}
