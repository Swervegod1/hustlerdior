"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="status-page">
      <p className="eyebrow">A MOMENTARY INTERRUPTION.</p>
      <h1>
        BACK IN
        <br />A MOMENT.
      </h1>
      <p>The collection could not be loaded.</p>
      <button type="button" className="primary-button" onClick={reset}>
        TRY AGAIN
      </button>
    </main>
  );
}
