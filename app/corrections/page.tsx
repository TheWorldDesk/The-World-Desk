import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Corrections Policy",
  description: "How The World Desk should handle reader reports, corrections and material updates.",
};

export default function CorrectionsPage() {
  return (
    <main>
      <header className="wrap masthead">
        <div className="masthead-row">
          <Link href="/" className="brand"><span className="brand-mark">W</span><span>THE WORLD<span className="brand-second">DESK</span><small>NEWS · CONTEXT · PERSPECTIVE</small></span></Link>
          <Link href="/latest">Latest news →</Link>
        </div>
      </header>
      <div className="wrap">
        <div className="page-intro">
          <span className="category-label">ACCOUNTABILITY</span>
          <h1>Corrections Policy</h1>
          <p>Readers should be able to understand what changed in a report and why.</p>
        </div>
        <div className="page-content">
          <h2>How to report a possible error</h2>
          <p>Send the article URL, the exact passage in question, an explanation of the suspected error and links to supporting evidence through the publisher's verified contact channel. Do not include sensitive personal information.</p>
          <h2>How corrections should be handled</h2>
          <p>An editor should review the claim, check the supporting evidence and record the decision. Material factual errors should be corrected promptly, with a visible correction note that explains the change. Minor spelling or formatting fixes that do not change meaning may not need a public note.</p>
          <h2>Updates and editor's notes</h2>
          <p>New information added after publication should be identified as an update when it materially changes a story. A correction must not be silently disguised as an ordinary update.</p>
          <h2>Transparency</h2>
          <p>Correction decisions and significant changes should be logged internally. A public contact address and a working correction-submission process must be configured before the site launches as a live news service.</p>
        </div>
        <p className="category-label">This is a proposed operational policy. The publisher must configure and monitor a verified contact channel before launch.</p>
        <Link href="/editorial-standards" className="category-label">Read editorial standards →</Link>
      </div>
    </main>
  );
}
