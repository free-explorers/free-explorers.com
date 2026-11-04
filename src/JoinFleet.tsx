import React, { useEffect, useRef, useState } from "react";
import { BoatShape } from "./scene/Boat";
import { checkoutPageUrl, checkoutUrl, formatPrice, TIERS, type Offer, type Tier } from "./members";

// Joining the fleet without leaving the site: pick your boat (a tier), then Open
// Collective's own checkout for it, embedded. Payment happens on Open Collective, inside
// the frame. Once done (or when the panel closes) the member list is fetched again so the
// new explorer's boat sails in.

const OC_ORIGIN = "https://opencollective.com";

export const JoinFleet: React.FC<{
  // The tier to open on: null shows the choice of boats; undefined keeps the panel closed.
  open: Tier | null | undefined;
  offers: Offer[];
  onClose: () => void;
  onJoined: () => void;
}> = ({ open, offers, onClose, onJoined }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const [joined, setJoined] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== undefined) {
      setTier(open);
      setJoined(false);
      setLoaded(false);
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [open]);

  // Open Collective's embed announces a finished contribution with a message to this page
  // (not yet released everywhere, so closing the panel refreshes the fleet too).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== OC_ORIGIN) return;
      const text = typeof e.data === "string" ? e.data : JSON.stringify(e.data ?? "");
      if (/success/i.test(text)) {
        setJoined(true);
        onJoined();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onJoined]);

  const offer = tier ? offers.find((o) => o.tier === tier) : undefined;
  const pick = (t: Tier) => {
    setTier(t);
    setLoaded(false);
  };

  return (
    <dialog
      ref={dialog}
      className={`join${offer ? " join-checkout" : ""}`}
      aria-labelledby="join-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop (outside the panel) closes it.
        if (e.target === dialog.current) dialog.current.close();
      }}
    >
      <div className="join-panel">
        <header className="join-head">
          {offer && !joined ? (
            <button type="button" className="join-back" onClick={() => setTier(null)}>
              ← Boats
            </button>
          ) : (
            <span />
          )}
          <h2 id="join-title">{joined ? "Welcome aboard!" : offer ? offer.name : "Choose your boat"}</h2>
          <button type="button" className="join-close" aria-label="Close" onClick={() => dialog.current?.close()}>
            ×
          </button>
        </header>

        {joined ? (
          <div className="join-done">
            <p>Thank you for joining the Free Explorers. Your boat is setting sail: it will join the fleet in a moment.</p>
            <button type="button" className="cta" onClick={() => dialog.current?.close()}>
              See the fleet
            </button>
          </div>
        ) : offer ? (
          <div className="join-frame">
            {!loaded && <p className="join-loading">Opening Open Collective…</p>}
            <iframe key={offer.path} src={checkoutUrl(offer)} title={`Contribute as a ${offer.name} on Open Collective`} onLoad={() => setLoaded(true)} />
            <p className="join-note">
              Payment is handled by Open Collective. Trouble with the form?{" "}
              <a href={checkoutPageUrl(offer)} target="_blank" rel="noreferrer">
                Open it on opencollective.com
              </a>
            </p>
          </div>
        ) : (
          <>
            <p className="join-intro">Every Explorer sails a boat on our sea. The bigger your support, the bigger your boat.</p>
            <ul className="join-tiers">
              {offers.map((o) => {
                const color = TIERS.find((t) => t.id === o.tier)?.color;
                return (
                  <li key={o.path}>
                    <button type="button" className="join-tier" style={{ "--tier": color } as React.CSSProperties} onClick={() => pick(o.tier)}>
                      <svg viewBox="-170 -330 340 360" aria-hidden="true">
                        <BoatShape tier={o.tier} uid={`join-${o.tier}`} />
                      </svg>
                      <span className="join-tier-name">{o.name}</span>
                      <span className="join-tier-price">
                        {formatPrice(o)}
                        {o.flexible && <small>or any amount</small>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </dialog>
  );
};
