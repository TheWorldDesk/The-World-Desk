import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Editorial Standards",
  description: "The World Desk's standards for accuracy, sourcing, fairness, corrections and responsible use of AI.",
};

export default function EditorialStandardsPage() {
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
          <h1>Editorial Standards</h1>
          <p>The principles every published report should meet before it is presented as journalism.</p>
        </div>
        <div className="page-content">
          <h2>Accuracy and verification</h2>
          <p>Editors should verify material facts against primary documents, direct sources or multiple credible independent sources when possible. Unconfirmed claims must be attributed clearly and must not be presented as established fact.</p>
          <h2>Independence and fairness</h2>
          <p>Coverage should be guided by public interest, not by political, commercial or personal pressure. People or organizations facing serious allegations should be given a reasonable opportunity to respond when practicable.</p>
          <h2>Sourcing and attribution</h2>
          <p>Reports should identify sources and link to original documents or statements where appropriate. Anonymous sources require editorial approval and a clear public-interest reason. Content from other publishers may only be reused with appropriate permission and attribution.</p>
          <h2>News, opinion and sponsored material</h2>
          <p>News reporting, analysis, opinion, advertising and sponsored content must be distinguishable. Paid material must be labelled clearly and must not influence independent editorial decisions.</p>
          <h2>Images and synthetic media</h2>
          <p>Images need appropriate rights, captions and credits. Illustrations, archive images and AI-generated or materially altered images must not mislead readers about what actually happened.</p>
          <h2>AI and translation</h2>
          <p>AI may assist research, drafting, transcription or translation, but it is not a source of truth. Editors remain responsible for checking facts, quotations, names, dates, context and translated meaning before publication.</p>
          <h2>Corrections and updates</h2>
          <p>Material errors should be corrected promptly with a visible note explaining what changed. Updates that add new information should be distinguished from corrections to earlier mistakes. See our <Link href="/corrections">corrections policy</Link>.</p>
          <h2>Demo content notice</h2>
          <p>Any sample or demo stories used while the site is being developed are illustrative, not verified current news. They must be replaced or unmistakably labelled before a public journalism launch.</p>
        </div>
        <p className="category-label">These standards are a publication framework and should be reviewed by the responsible editor before launch.</p>
      </div>
    </main>
  );
}
