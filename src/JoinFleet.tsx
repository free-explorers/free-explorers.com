import React, { useEffect, useRef, useState } from "react";
import { BoatShape } from "./scene/Boat";
import { Bob } from "./scene/Motion";
import {
  AMOUNTS,
  BOATS,
  boatFor,
  boatInfo,
  sizeWithin,
  checkoutPageUrl,
  checkoutUrl,
  COLLECTIVE,
  formatAmount,
  FREQUENCIES,
  multiplier,
  perLabel,
  rangeLabel,
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
  // An amount typed in (for the chosen frequency) instead of the slider's; null uses the
  // slider. `editing` holds the field's text while it's open.
  const [custom, setCustom] = useState<number | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [joined, setJoined] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== undefined) {
      setIndex(indexOf(open ? boatInfo(open).min : DEFAULT_AMOUNT));
      setCustom(null);
      setEditing(null);
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

  // The slider picks an amount per month; yearly is twelve times it. The boat follows the
  // monthly amount.
  const amount = custom ?? AMOUNTS[index] * multiplier(frequency);
  const monthly = amount / multiplier(frequency);
  const kind = boatFor(monthly);
  // The slider sits on the step at or below a typed amount.
  const sliderIndex = custom === null ? index : Math.max(0, AMOUNTS.filter((a) => a <= monthly).length - 1);
  const pickFrequency = (f: Frequency) => {
    // A typed amount keeps its value per month (yearly being twelve months of it).
    if (custom !== null) setCustom(Math.round((custom / multiplier(frequency)) * multiplier(f) * 100) / 100);
    setFrequency(f);
  };
  const commitEdit = () => {
    const value = Math.round(Number((editing ?? "").replace(/[^0-9.]/g, "")) * 100) / 100;
    if (value >= 1) setCustom(value);
    setEditing(null);
  };
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
                <button key={f.id} type="button" role="radio" aria-checked={f.id === frequency} onClick={() => pickFrequency(f.id)}>
                  {f.label}
                </button>
              ))}
            </div>

            {/* The boat this amount sails */}
            <div className="join-preview">
              <svg viewBox="-330 -450 680 520" aria-hidden="true">
                <Bob dy={4} deg={kind === "galleon" ? 0.8 : 1.4}>
                  {/* Grows with the amount within its kind, from the waterline up */}
                  <g transform={`scale(${sizeWithin(monthly)})`}>
                    <BoatShape key={kind} kind={kind} uid="join-preview" />
                  </g>
                </Bob>
              </svg>
              <div className="join-boat">
                <span className="join-boat-name">{boat.name}</span>
                {editing !== null ? (
                  <span className="join-amount">
                    $
                    <input
                      className="join-amount-input"
                      type="number"
                      inputMode="decimal"
                      min={1}
                      step="any"
                      value={editing}
                      autoFocus
                      aria-label={`Amount in dollars ${perLabel(frequency)}`}
                      onChange={(e) => setEditing(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit();
                        if (e.key === "Escape") {
                          // Cancel the edit, not the whole panel.
                          e.preventDefault();
                          setEditing(null);
                        }
                      }}
                    />
                    <small>{perLabel(frequency)}</small>
                  </span>
                ) : (
                  <span className="join-amount">
                    {formatAmount(amount)} <small>{perLabel(frequency)}</small>
                    <button type="button" className="join-edit" aria-label="Type an amount" title="Type an amount" onClick={() => setEditing(String(amount))}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" />
                        <path d="m13.5 6.5 4 4" />
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            </div>

            <input
              className="join-slider"
              type="range"
              min={0}
              max={AMOUNTS.length - 1}
              step={1}
              value={sliderIndex}
              onChange={(e) => {
                setIndex(Number(e.target.value));
                setCustom(null);
              }}
              aria-label="Amount"
              aria-valuetext={`${price}, ${boat.name}`}
              style={{ "--fill": `${(sliderIndex / (AMOUNTS.length - 1)) * 100}%` } as React.CSSProperties}
            />
            {/* The four boats along the slider; each jumps to its smallest amount */}
            <div className="join-zones">
              {ZONES.map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className={z.id === kind ? "on" : undefined}
                  style={{ flexGrow: z.steps, "--zone": z.color } as React.CSSProperties}
                  onClick={() => {
                    setIndex(indexOf(z.min));
                    setCustom(null);
                  }}
                >
                  <span>{z.name}</span>
                  <small>{rangeLabel(z, frequency)}</small>
                </button>
              ))}
            </div>

            <p className="join-hint">
              {kind === "galleon" ? (
                <>
                  For enterprise sponsors: your company sails a galleon at the head of the fleet.{" "}
                  {monthly >= AMOUNTS[AMOUNTS.length - 1] && (
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
