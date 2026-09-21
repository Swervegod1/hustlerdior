import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import ReadingPage from "@/components/ReadingPage";
import fitGuideFaq from "@/data/faq-fit-guide.json";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Compare streetwear silhouettes, measure a garment you already like, and understand color and size selection in the Hustler Dior collection.";
export const metadata: Metadata = {
  title: "Streetwear Fit & Size Selection Guide",
  description,
  alternates: { canonical: absoluteUrl("/fit-guide") },
  openGraph: {
    title: "Hustler Dior Fit Guide",
    description,
    url: absoluteUrl("/fit-guide"),
  },
};

export default function FitGuide() {
  return (
    <ReadingPage
      title="FIND YOUR FIT."
      name="Fit guide"
      path="/fit-guide"
      intro={description}
    >
      <h2>START WITH A PIECE YOU ALREADY WEAR.</h2>
      <p>
        Lay a favorite tee or hoodie flat without stretching it. Note the width
        across the chest and the length from the shoulder to the hem. These
        garment measurements describe a fit you already know; they are different
        from measurements taken around your body.
      </p>
      <p>
        A size letter alone does not establish the same fit across different
        garments. Before ordering, compare those measurements with the size
        chart for the exact garment. Product-specific measurement charts are
        still being prepared for this storefront.
      </p>
      <h2>CHOOSE A SILHOUETTE.</h2>
      <div className="fit-table-wrap">
        <table className="fit-table">
          <thead>
            <tr>
              <th>Silhouette</th>
              <th>What to compare</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Oversized</td>
              <td>
                Shoulder position, chest room and hem length. Sizing up a
                regular garment may change the length without recreating an
                oversized cut.
              </td>
            </tr>
            <tr>
              <td>Fitted</td>
              <td>
                Chest and sleeve room. Compare a garment you already like rather
                than assuming your usual size will fit the same way.
              </td>
            </tr>
            <tr>
              <td>Cropped</td>
              <td>
                Shoulder-to-hem length and where that hem meets your waistband.
              </td>
            </tr>
            <tr>
              <td>Unisex</td>
              <td>
                The actual cut and measurements. Unisex describes the intended
                audience; it is not a measurement standard.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>WHY DOES MY SIZE DISAPPEAR WHEN I CHANGE COLOR?</h2>
      <p>
        Each color and size combination is a separate variant. Some combinations
        can be unavailable even when another color is available. Choose a color
        first, then select one of the enabled sizes.
      </p>
      <h2>DO LARGER SIZES COST MORE?</h2>
      <p>
        Some pieces have different prices by size. Selecting a size shows the
        price for that exact variant. A “From” price on a collection card is the
        lowest current price among its available variants.
      </p>
      <Link href="/collections/hoodies-layers">Explore hoodies & layers ↗</Link>
      <p>
        <Link href="/help">Read ordering information</Link>
      </p>
      <JsonLd data={fitGuideFaq} />
    </ReadingPage>
  );
}
