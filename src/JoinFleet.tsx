import React, { useEffect, useRef, useState } from "react";
import { BoatShape } from "./scene/Boat";
import { Bob } from "./scene/Motion";
import {
  AMOUNTS,
  BOATS,
  boatFor,
  boatInfo,
  checkoutPageUrl,
  checkoutUrl,
  COLLECTIVE,
  formatAmount,
  FREQUENCIES,
  perLabel,
  type BoatKind,
  type Frequency,
} from "./members";

// Joining the fleet without leaving the site: choose how often and how much (a stepped
// slider), see the boat that amount sails, then Open Collective's own checkout for it,
// embedded. Payment happens on Open Collective, inside the frame. Once done (or when the
// panel closes) the member list is fetched again so the new explorer's boat sails in.

const OC_ORIGIN = "https://opencollective.com";
const DEFAULT_AMOUNT = 20;
const indexOf = (amount: number) => Math.max(0, AMOUNTS.indexOf(amount));

// The slider's four zones, smallest boat first, each as wide as its share of the steps.
const ZONES = [...BOATS].reverse().map((b) => ({ ...b, steps: AMOUNTS.filter((a) => boatFor(a) === b.id).length }));

export const JoinFleet: React.FC<{
  // Opens the panel: null on the default amount, or on a boat's smallest amount; undefined
  // keeps it closed.
  open: BoatKind | null | undefined;
  onClose: () => void;
  onJoined: () => void;
}> = ({ open, onClose, onJoined }) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [frequency, setFrequency] = useState<Frequency>("month");
  const [index, setIndex] = useState(indexOf(DEFAULT_AMOUNT));
  const [paying, setPaying] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== undefined) {
      setIndex(indexOf(open ? boatInfo(open).min : DEFAULT_AMOUNT));
      setPaying(false);
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

  const amount = AMOUNTS[index];
  const kind = boatFor(amount);
  const boat = boatInfo(kind);
  const price = `${formatAmount(amount)} ${perLabel(frequency)}`;
  const close = () => dialog.current?.close();

  return (
    <dialog
      ref={dialog}
      className={`join${paying ? " join-checkout" : ""}`}
      aria-labelledby="join-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop (outside the panel) closes it.
        if (e.target === dialog.current) close();
      }}
    >
      <div className="join-panel">
        <header className="join-head">
          {paying && !joined ? (
            <button type="button" className="join-back" onClick={() => setPaying(false)}>
              ← Amount
            </button>
          ) : (
            <span />
          )}
          <h2 id="join-title">{joined ? "Welcome aboard!" : paying ? `Your ${boat.name} · ${price}` : "Join the fleet"}</h2>
          <button type="button" className="join-close" aria-label="Close" onClick={close}>
            ×
          </button>
        </header>

        {joined ? (
          <div className="join-done">
            <p>Thank you for joining the Free Explorers. Your boat is setting sail: it will join the fleet in a moment.</p>
            <button type="button" className="cta" onClick={close}>
              See the fleet
            </button>
          </div>
        ) : paying ? (
          <div className="join-frame">
            {!loaded && <p className="join-loading">Opening Open Collective…</p>}
            <iframe key={`${amount}-${frequency}`} src={checkoutUrl(amount, frequency)} title={`Contribute ${price} on Open Collective`} onLoad={() => setLoaded(true)} />
            <p className="join-note">
              Payment is handled by Open Collective. Trouble with the form?{" "}
              <a href={checkoutPageUrl(amount, frequency)} target="_blank" rel="noreferrer">
                Open it on opencollective.com
              </a>
            </p>
          </div>
        ) : (
          <div className="join-choose" style={{ "--boat": boat.color } as React.CSSProperties}>
            <div className="join-frequency" role="radiogroup" aria-label="How often">
              {FREQUENCIES.map((f) => (
                <button key={f.id} type="button" role="radio" aria-checked={f.id === frequency} onClick={() => setFrequency(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* The boat this amount sails */}
            <div className="join-preview">
              <svg viewBox="-330 -450 680 520" aria-hidden="true">
                <Bob dy={4} deg={kind === "galleon" ? 0.8 : 1.4}>
                  <BoatShape key={kind} kind={kind} uid="join-preview" />
                </Bob>
              </svg>
              <div className="join-boat">
                <span className="join-boat-name">{boat.name}</span>
                <span className="join-amount">
                  {formatAmount(amount)} <small>{perLabel(frequency)}</small>
                </span>
              </div>
            </div>

            <input
              className="join-slider"
              type="range"
              min={0}
              max={AMOUNTS.length - 1}
              step={1}
              value={index}
              onChange={(e) => setIndex(Number(e.target.value))}
              aria-label="Amount"
              aria-valuetext={`${price}, ${boat.name}`}
              style={{ "--fill": `${(index / (AMOUNTS.length - 1)) * 100}%` } as React.CSSProperties}
            />
            {/* The four boats along the slider; each jumps to its smallest amount */}
            <div className="join-zones">
              {ZONES.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={z.id === kind ? "on" : undefined}
                  style={{ flexGrow: z.steps, "--zone": z.color } as React.CSSProperties}
                  onClick={() => setIndex(indexOf(z.min))}
                >
                  <span>{z.name}</span>
                  <small>{z.range}</small>
                </button>
              ))}
            </div>

            <p className="join-hint">
              {kind === "galleon" ? (
                <>
                  For enterprise sponsors: your company sails a galleon at the head of the fleet.{" "}
                  {amount === AMOUNTS[AMOUNTS.length - 1] && (
                    <>
                      More than {formatAmount(amount)}?{" "}
                      <a href={COLLECTIVE} target="_blank" rel="noreferrer">
                        Reach us on Open Collective
                      </a>
                      .
                    </>
                  )}
                </>
              ) : (
                "Every Explorer sails a boat on our sea. The more you give, the bigger your boat."
              )}
            </p>

            <button type="button" className="cta join-continue" onClick={() => setPaying(true)}>
              Continue · {price}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
};
