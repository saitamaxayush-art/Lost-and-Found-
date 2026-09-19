import { forwardRef, useImperativeHandle, useRef } from "react";

const StorySteps = forwardRef(function StorySteps(props, ref) {
  const stepRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  useImperativeHandle(
    ref,
    () => ({
      applyTimeline: (data) => {
        data.steps.forEach((stepData, idx) => {
          const el = stepRefs[idx].current;
          if (el) {
            el.style.opacity = stepData.opacity.toFixed(3);
            el.style.transform = `translateY(${stepData.translateY.toFixed(1)}px)`;
            el.style.filter = stepData.blur > 0.1 ? `blur(${stepData.blur.toFixed(1)}px)` : "none";
            el.style.pointerEvents = stepData.pointerEvents;
            el.style.display = stepData.opacity <= 0.005 ? "none" : "block";
          }
        });
      },
    }),
    []
  );

  return (
    <div className="story-steps-container">
      {/* ========================================================
          STEP 1: Report lost (0.13 - 0.29)
          ======================================================== */}
      <div className="story-step-item" ref={stepRefs[0]} style={{ opacity: 0, display: "none" }}>
        <div className="step-badge-row">
          <span className="step-num">(1)</span>
          <span className="step-topic">Lost an item?</span>
        </div>
        <h2 className="step-title">
          Report what you’ve <em className="amber-kw">lost</em>.
        </h2>
        <p className="step-para">
          Left your glasses in a seminar room or forgot your wallet at the cafeteria? Log the details,
          category, time, and last known spot in 30 seconds.
        </p>

        {/* Cream Mock-UI Card 1 */}
        <div className="cream-mock-card">
          <div className="mock-card-header">
            <span className="mock-pill lost">LOST REPORT</span>
            <span className="mock-timestamp">Just now</span>
          </div>
          <div className="mock-form-preview">
            <div className="mock-row">
              <span className="mock-lbl">Item name</span>
              <span className="mock-val">Navy Blue Bifold Wallet</span>
            </div>
            <div className="mock-row">
              <span className="mock-lbl">Category</span>
              <span className="mock-val">Accessories / Wallet</span>
            </div>
            <div className="mock-row">
              <span className="mock-lbl">Last seen</span>
              <span className="mock-val">Cafeteria, Booth 7</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          STEP 2: Report found (0.29 - 0.44)
          ======================================================== */}
      <div className="story-step-item" ref={stepRefs[1]} style={{ opacity: 0, display: "none" }}>
        <div className="step-badge-row">
          <span className="step-num">(2)</span>
          <span className="step-topic">Found something?</span>
        </div>
        <h2 className="step-title">
          Report what you’ve <em className="amber-kw">found</em>.
        </h2>
        <p className="step-para">
          Be someone’s hero. Snap a photo of unattended belongings, tag the room or building,
          and log where you handed it in so the owner can track it down.
        </p>

        {/* Cream Mock-UI Card 2 */}
        <div className="cream-mock-card">
          <div className="mock-card-header">
            <span className="mock-pill found">FOUND REPORT</span>
            <span className="mock-timestamp">10m ago</span>
          </div>
          <div className="mock-found-body">
            <div className="mock-photo-thumb">
              <span>📷 Photo Logged</span>
            </div>
            <div className="mock-found-info">
              <strong>Gold Wire Glasses</strong>
              <span>📍 Central Library 2F Desk</span>
              <span className="mock-custody">Custody: Security Desk</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          STEP 3: We match them (0.44 - 0.57)
          ======================================================== */}
      <div className="story-step-item" ref={stepRefs[2]} style={{ opacity: 0, display: "none" }}>
        <div className="step-badge-row">
          <span className="step-num">(3)</span>
          <span className="step-topic">Smart Engine</span>
        </div>
        <h2 className="step-title">
          We <em className="amber-kw">match</em> them automatically.
        </h2>
        <p className="step-para">
          No need to scroll endlessly. Our automated correlation engine cross-checks categories,
          color keywords, and timestamps between lost and found logs in real time.
        </p>

        {/* Cream Mock-UI Card 3 */}
        <div className="cream-mock-card">
          <div className="mock-match-pill-header">
            <span className="match-stars">✨ 96% Match Confidence</span>
          </div>
          <div className="mock-match-exchange">
            <div className="exchange-item">
              <span className="ex-tag">Lost Entry</span>
              <span className="ex-text">"Navy leather wallet with ID"</span>
            </div>
            <span className="exchange-arrow">⇄</span>
            <div className="exchange-item">
              <span className="ex-tag">Found Log</span>
              <span className="ex-text">"Blue Bifold Wallet at Cafe"</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          STEP 4: You get notified (0.57 - 0.70)
          ======================================================== */}
      <div className="story-step-item" ref={stepRefs[3]} style={{ opacity: 0, display: "none" }}>
        <div className="step-badge-row">
          <span className="step-num">(4)</span>
          <span className="step-topic">Instant Alert</span>
        </div>
        <h2 className="step-title">
          You get <em className="amber-kw">notified</em> immediately.
        </h2>
        <p className="step-para">
          The moment a matching item is registered, an alert pops on your portal notification bell
          with direct details and verification instructions.
        </p>

        {/* Cream Mock-UI Card 4 */}
        <div className="cream-mock-card">
          <div className="mock-notif-row">
            <div className="notif-bell-circle">🔔</div>
            <div className="notif-content">
              <strong>Match Alert!</strong>
              <p>A found report matching your Navy Wallet was logged at Central Desk.</p>
              <span className="notif-action-text">Click to verify &amp; claim →</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          STEP 5: Item found & returned (0.70 - 0.85)
          ======================================================== */}
      <div className="story-step-item" ref={stepRefs[4]} style={{ opacity: 0, display: "none" }}>
        <div className="step-badge-row">
          <span className="step-num">(5)</span>
          <span className="step-topic">Resolution</span>
        </div>
        <h2 className="step-title">
          Item <em className="amber-kw">reunited</em> safely.
        </h2>
        <p className="step-para">
          Track the journey through our 3-stage lifecycle. Show your claim reference code at the
          campus desk, confirm ownership, and collect your item.
        </p>

        {/* Cream Mock-UI Card 5 */}
        <div className="cream-mock-card">
          <div className="mock-lifecycle-tracker">
            <div className="life-step done">
              <span className="life-circle">✓</span>
              <span className="life-lbl">Reported</span>
            </div>
            <div className="life-line active"></div>
            <div className="life-step done">
              <span className="life-circle">✓</span>
              <span className="life-lbl">Matched</span>
            </div>
            <div className="life-line active"></div>
            <div className="life-step done returned">
              <span className="life-circle">🎉</span>
              <span className="life-lbl">Returned</span>
            </div>
          </div>
          <div className="mock-ticket-footer">
            <span>Verified Desk Claim: <strong>#HYT-2026-904</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default StorySteps;
