import type { Metadata } from "next";
import ReadingPage from "@/components/ReadingPage";
import { absoluteUrl } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Photo & Shopping Privacy",
  alternates: { canonical: absoluteUrl("/privacy") },
};
export default function Privacy() {
  return (
    <ReadingPage
      title="YOUR IMAGE. YOUR CHOICE."
      name="Photo & shopping privacy"
      path="/privacy"
      intro="How photos and shopping information move through this storefront."
    >
      <h2 id="try-on">AI TRY-ON PHOTOS</h2>
      <p>
        You choose whether to upload a photo or enable your camera. Camera
        access begins only after you request it. We capture a still photo when
        you press Take photo, and stop the camera when you close or leave the
        fitting room.
      </p>
      <p>
        Pressing Generate my look sends your selected photo and the garment
        image to OpenAI for image editing. The storefront removes photo
        metadata, including embedded location information, before sending it.
        Photos and generated previews are processed in memory; this application
        does not save them in its database or logs. Closing the fitting room
        removes your browser’s preview. Download a result if you want to keep
        it.
      </p>
      <p>
        OpenAI processes the images under its API data policies. Default
        abuse-monitoring logs may be retained for up to 30 days, with exceptions
        described by the provider. This is separate from this storefront’s
        storage. Read{" "}
        <a
          href="https://developers.openai.com/api/docs/guides/your-data"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenAI’s data controls
        </a>{" "}
        for the current details.
      </p>
      <p>
        Use a photo you have permission to use. Previews are generated images
        and may change lettering, patterns, proportions or other details. They
        do not establish garment size, fit or exact appearance.
      </p>
      <h2 id="support">REQUESTING HUMAN HELP</h2>
      <p>
        The Style Desk uses fixed collection links and ordering answers;
        browsing those answers does not send a conversation to an AI provider.
        If you choose email, your email application sends the message when you
        send it.
      </p>
      <p>
        When human alerts are connected, submitting the support form sends your
        name, email and question to the team through Twilio. Do not include card
        numbers, passwords or other sensitive information. The storefront stores
        a request reference, a hash of the submitted details, browser ownership
        and notification status to prevent duplicate alerts; it does not store
        the message text in that table.
      </p>
      <p>
        Requesting help does not enroll you in marketing or authorize a
        purchase. Twilio and the team’s receiving device process the submitted
        message. You can email hustlerdior@gmail.com with a privacy request.
      </p>
      <h2>YOUR BAG AND CHECKOUT</h2>
      <p>
        Bag selections are saved in this browser’s local storage. Clearing that
        storage removes the saved bag. A first-party session cookie connects
        this browser with its checkout and preview allowance.
      </p>
      <p>
        Saved pieces in the Extended Edit are also stored in this browser. They
        do not reserve stock, create an account or subscribe you to marketing.
        Use Unsave on a piece or clear this site’s browser storage to remove
        them.
      </p>
      <p>
        When checkout is enabled, delivery details and the order record are
        stored to process your purchase. Stripe receives the information needed
        to collect payment; Printful receives the information needed to fulfill
        the order. Card details are entered on Stripe’s hosted payment page and
        are not stored by this storefront.
      </p>
    </ReadingPage>
  );
}
