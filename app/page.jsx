import Script from 'next/script';

export default function Home() {
  return (
    <>
      <div className="marketing-offer-bar"><span>Free statement check</span><span>Your PDF stays on your device</span></div>
      <div className="report-site">
        <a className="report-skip" href="#main">Skip to content</a>
        <header className="report-header marketing-header">
          <a className="report-brand" href="#" id="brand" aria-label="Statement Check home"><img className="statement-logo" src="/statement-check-logo.webp" width="900" height="123" alt="" /></a>
          <nav id="marketing-navigation" data-open="false" aria-label="Main navigation"><a href="#service">What you’ll see</a><a href="#examples" data-open-sample="">Sample result</a><a href="#how-it-works">Find my statement</a><a href="#ownership">Privacy</a><a href="#questions">FAQs</a><a href="#guides">Guides</a></nav>
          <div className="marketing-header-actions">
            <button className="report-button" id="header-choose-file" type="button">Choose statement PDF</button>
            <button className="marketing-menu-toggle" type="button" aria-expanded="false" aria-controls="marketing-navigation" aria-label="Toggle navigation">☰</button>
          </div>
        </header>
        <main id="main">
          <div className="lc-home">
            <section className="lc-hero" id="demo">
              <div className="lc-hero-copy">
                <p className="report-eyebrow"><span className="lc-live-dot" />Free UK credit card statement check</p>
                <h1>See what changed on your credit card.<br /><em>And when you could clear it.</em></h1>
                <p className="report-lead">See what you were charged in interest and fees, which rates your statement lists and when your payment is due.</p>
                <p className="lc-access-note">One statement, all its pages. Your PDF stays on your device.</p>
                <div className="domain-entry">
                  <div className="hero-report-actions">
                    <button className="report-button" id="choose-file" type="button">Choose a PDF</button>
                    <button className="hero-sample-button" data-open-sample="" type="button">Try the sample report</button>
                  </div>
                  <input type="file" id="file" accept=".pdf,application/pdf" hidden />
                  <p>Text-based PDFs · up to 15 MB and 30 pages</p>
                  <a href="#how-it-works">How do I find my statement?</a>
                  <p id="status" role="status" />
                </div>
              </div>
              <aside className="hero-benefits" aria-label="What you’ll get from your statement check">
                <p className="hero-benefits-label">Understand what happened</p>
                <ul className="hero-benefit-list">
                  <li>
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6" /></svg>
                    <div><h2>Know what your card cost you</h2><p>See the interest and fees you were charged.</p></div>
                  </li>
                  <li>
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M3 17l5-5 4 3 7-8m-5 0h5v5" /></svg>
                    <div><h2>Understand why your balance changed</h2><p>See how spending, repayments and charges added up.</p></div>
                  </li>
                  <li>
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 19 19 5M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm10 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg>
                    <div><h2>Find your interest rates</h2><p>See the rates listed and when any promotion ends.</p></div>
                  </li>
                  <li>
                    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 3v4m10-4v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
                    <div><h2>See what’s due and when</h2><p>Find your minimum payment and due date.</p></div>
                  </li>
                </ul>
                <div className="hero-benefit-next">
                  <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 8h16M4 16h16M9 5v6m6 2v6" /></svg>
                  <div>
                    <h2>Explore what’s next</h2>
                    <p>See how a different payment could change your payoff date and interest.</p>
                  </div>
                </div>
              </aside>
            </section>
            <section id="result" hidden aria-labelledby="result-title">
              <div className="report-result-header">
                <div>
                  <div className="report-document-meta">
                    <span className="report-source" id="result-type" />
                    <span id="report-date" hidden />
                  </div>
                  <h2 id="result-title" tabIndex="-1">Your statement, explained</h2>
                  <p className="report-sample-note" id="sample-note" hidden>Example figures. Choose your own PDF to get a personal report.</p>
                </div>
                <button type="button" className="report-button secondary report-clear" id="clear">Close report</button>
              </div>
              <p id="statement-issues" className="statement-issues" hidden />
              <div id="balance-breakdown" />
              <section id="statement-insights" aria-label="Statement insights" />
              <div id="payoff" />
              <details id="report-details" className="report-details">
                <summary>Statement figures and downloads</summary>
                <div id="metrics" />
                <div id="rates" />
                <div className="actions exports">
                  <button className="report-button" id="print">Print or save as PDF</button>
                  <button className="report-button secondary" id="csv">Download summary CSV</button>
                  <button className="link" id="json">Download JSON</button>
                </div>
              </details>
            </section>
            <dialog id="sample-dialog" aria-labelledby="result-title" />
            <section className="lc-problem" id="why-yotion">
              <div className="lc-section-heading">
                <p className="report-eyebrow">The problem</p>
                <h2>What did your card<br /><em>actually cost you?</em></h2>
                <p>You can see your balance in the app. To find the interest, fees and rates, you may need to look across several pages of the statement.</p>
                <p>Statement Check puts the figures it can identify in one place, with page references so you can check them yourself.</p>
              </div>
            </section>
            <section className="lc-trust" id="service">
              <div>
                <p className="report-eyebrow">What you’ll see</p>
                <h2>Understand the numbers<br /><em>that matter.</em></h2>
              </div>
              <div>
                <p>See the statement balance and what you were charged in interest and fees.</p>
                <p>Find the annual rates, promotional expiry dates and minimum payment details shown on your PDF.</p>
              </div>
            </section>
            <section className="lc-trust case-study" id="examples" aria-labelledby="case-title">
              <div className="case-intro">
                <p className="report-eyebrow">What you get</p>
                <h2 id="case-title">Your statement,<br /><em>explained.</em></h2>
              </div>
              <ol className="report-preview-list">
                <li>
                  <span className="report-preview-number" aria-hidden="true">01</span>
                  <h3>Where you stand</h3>
                  <p>See what you owe, how your balance moved and when your minimum payment is due.</p>
                </li>
                <li>
                  <span className="report-preview-number" aria-hidden="true">02</span>
                  <h3>What changed it</h3>
                  <p>See how spending, payments, refunds, interest and fees affected your balance.</p>
                </li>
                <li>
                  <span className="report-preview-number" aria-hidden="true">03</span>
                  <h3>When you could clear it</h3>
                  <p>Try a different monthly payment or payoff date and see the estimated interest and time you could save.</p>
                </li>
              </ol>
              <div className="report-preview-footer">
                <button data-open-sample="" className="report-button" type="button">Try the sample report</button>
                <p>Explore the calculator with fictional figures.</p>
              </div>
            </section>
            <section className="lc-trust" id="customer-story" aria-labelledby="customer-story-title">
              <div className="case-intro">
                <p className="report-eyebrow">Reading your results</p>
                <h2 id="customer-story-title">Find the detail<br /><em>behind the figures.</em></h2>
              </div>
              <div>
                <p>Each recognised figure includes the page number it came from. If a field is marked “Not identified”, you can check the original statement or ask your card provider.</p>
                <p>You can print the summary, save it as PDF or download the figures as CSV or JSON.</p>
              </div>
              <aside className="hero-service">
                <h3>Interest charged and annual rates</h3>
                <p>The interest charge is an amount in pounds for the statement period. An annual rate is a percentage listed by the card provider.</p>
              </aside>
            </section>
            <section className="lc-how" id="how-it-works">
              <div className="lc-section-heading">
                <p className="report-eyebrow">Find your PDF</p>
                <h2>Where is my<br /><em>credit card statement?</em></h2>
              </div>
              <div className="lc-journey">
                <article>
                  <span className="lc-stage">01 · Open</span>
                  <h3>Select your credit card.</h3>
                  <p>Open the card provider’s app or online banking.</p>
                </article>
                <article>
                  <span className="lc-stage">02 · Find</span>
                  <h3>Look for Statements.</h3>
                  <p>Try More or Manage card if it’s hidden.</p>
                </article>
                <article>
                  <span className="lc-stage">03 · Save</span>
                  <h3>Download the PDF.</h3>
                  <p>Open the monthly statement and use Download or Share.</p>
                </article>
                <article>
                  <span className="lc-stage">04 · Check</span>
                  <h3>Choose your PDF.</h3>
                  <p>Come back here and select the file you saved.</p>
                </article>
              </div>
            </section>
            <section id="ownership" aria-labelledby="ownership-title">
              <div className="lc-section-heading">
                <p className="report-eyebrow">Privacy</p>
                <h2 id="ownership-title">Your PDF stays<br /><em>on your device.</em></h2>
              </div>
              <div className="ownership-cards">
                <article>
                  <h3>Read in your browser</h3>
                  <p>Your statement is processed on your device.</p>
                </article>
                <article>
                  <h3>Only the figures you need</h3>
                  <p>The result uses recognised amounts, rates, dates and page numbers. It excludes names, addresses, account numbers and transaction descriptions.</p>
                </article>
                <article>
                  <h3>Your copy to keep</h3>
                  <p>The site stores neither your statement nor your result. Print or download the summary if you want to keep it.</p>
                </article>
              </div>
            </section>
            <section className="report-faq lc-faq" id="questions">
              <div>
                <p className="report-eyebrow">Before you take the next step</p>
                <h2>A few<br /><em>useful answers.</em></h2>
              </div>
              <div>
                <details>
                  <summary>Which PDFs can I use?</summary>
                  <p>Use a text-based UK credit card statement up to 15 MB and 30 pages. Scanned and password-protected PDFs are unsupported.</p>
                </details>
                <details>
                  <summary>Is it free?</summary>
                  <p>Yes. You can check one statement at a time and download the summary for free.</p>
                </details>
                <details>
                  <summary>What if I can’t find the download in the app?</summary>
                  <p>Try signing in to online banking in your browser and opening the Statements section for your credit card.</p>
                </details>
              </div>
            </section>
            <section className="lc-trust" id="guides" aria-labelledby="guides-title">
              <div>
                <p className="report-eyebrow">UK credit card guides</p>
                <h2 id="guides-title">Understand<br /><em>your statement.</em></h2>
              </div>
              <ul className="guide-link-list">
                <li><a href="/guides/credit-card-apr-and-interest-charged.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm10 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" /></svg><span>Where to find your credit card APR and interest charged</span></a></li>
                <li><a href="/guides/why-credit-card-interest-was-charged.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6m-6 4h6" /></svg><span>Why have I been charged interest on my credit card?</span></a></li>
                <li><a href="/guides/why-interest-on-a-zero-percent-credit-card.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg><span>Why am I paying interest on my 0% credit card?</span></a></li>
                <li><a href="/guides/how-to-read-a-uk-credit-card-statement.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6m-6 4h6" /></svg><span>How to read a UK credit card statement</span></a></li>
              </ul>
            </section>
            <section className="lc-closing">
              <p className="report-eyebrow">See it with your own statement</p>
              <h2>Find out what your card<br /><em>is costing you.</em></h2>
              <a href="#demo" className="report-button">Check my statement</a>
              <small>One PDF · Processed on your device</small>
            </section>
          </div>
        </main>
      </div>
      <footer className="yotion-footer">
        <div className="footer-inner">
          <div className="footer-layout">
            <div className="footer-identity">
              <a className="report-brand" href="#" aria-label="Statement Check home"><img className="statement-logo" src="/statement-check-logo.webp" width="900" height="123" alt="" /></a>
              <p>A free UK credit card statement check.</p>
            </div>
            <nav aria-label="Footer navigation">
              <h2>Explore Statement Check</h2>
              <a href="#service">What you’ll see</a>
              <a href="#examples" data-open-sample="">Sample result</a>
              <a href="#how-it-works">Find my statement</a>
              <a href="#ownership">Privacy</a>
              <a href="#questions">FAQs</a>
              <a href="#guides">Guides</a>
            </nav>
          </div>
          <div className="footer-base"><span>© 2026 Statement Check</span><a href="#main">Back to top</a></div>
        </div>
      </footer>
      <Script src="/statement-check.mjs" type="module" strategy="afterInteractive" />
    </>
  );
}
