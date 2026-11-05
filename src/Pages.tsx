import React from "react";
import { COLLECTIVE } from "./members";

// The long-form content of the pages to the right of the Explorers, shown in a scrollable
// column on their left.

// Commands only where they're known for sure; the other distros point to the instructions.
const INSTALL: { distro: string; command?: string; packages?: string }[] = [
  { distro: "Arch / Manjaro (AUR)", command: "yay -S veshell-bin", packages: "veshell, veshell-bin or veshell-git" },
  { distro: "NixOS (flake)", command: "nix run github:free-explorers/veshell" },
  { distro: "Fedora (COPR)" },
  { distro: "openSUSE Tumbleweed, Slowroll, Leap 16 (OBS)" },
  { distro: "Debian 13 · Ubuntu 26.04 (OBS)" },
];
const INSTRUCTIONS = "https://github.com/free-explorers/veshell#installation";

export const VeshellContent: React.FC = () => (
  <>
    <p className="lead">
      Veshell is a not-desktop environment for Linux. Instead of piling windows up like papers on a desk, it lays your apps out on a map you learn by heart,
      the way you know where everything is in your own kitchen.
    </p>
    <div className="actions">
      <a className="cta" href="https://github.com/free-explorers/veshell" target="_blank" rel="noreferrer">
        Get Veshell
      </a>
      <a className="cta cta-ghost" href={`${COLLECTIVE}/projects/veshell`} target="_blank" rel="noreferrer">
        Fund Veshell
      </a>
    </div>

    <h3>A map, not a desk</h3>
    <p>
      Everything lives on a 2D grid: <strong>rows are workspaces</strong>, <strong>columns are windows</strong>. A new app goes at the end of its row, a new
      workspace at the bottom. There's always an empty workspace waiting below, and empty ones clean themselves up. Group your apps by project, by theme, by
      whatever makes sense to you.
    </p>

    <h3>Move by direction</h3>
    <p>
      <kbd>Super</kbd> + <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> moves you around the map, one hand on the keyboard, with sliding transitions
      so you always feel where you're going. Add <kbd>Shift</kbd> to carry a window along: reorder it, or send it to the workspace above or below and follow it.
      The same four directions work everywhere.
    </p>

    <h3>It remembers everything</h3>
    <p>
      Every layout decision is kept, even across reboots. A closed app leaves a placeholder in its place; click it and Veshell resumes your work: the same
      documents, and for a terminal the same folder and the same program running.
    </p>

    <h3>Quick errands in the Overview</h3>
    <p>
      For a quick calculation, a setting or a file, open the Overview: search apps, files or settings, and what you open there stays there, as an ephemeral tab
      that never disturbs your layout. Its dashboard, the Helm, gathers your media, audio and Bluetooth devices, network, notifications and live system
      monitoring.
    </p>

    <h3>A whole environment</h3>
    <ul>
      <li>Game mode: games run full size with direct input, and pause frosted in their tile.</li>
      <li>Floating mode for the apps that need free placement.</li>
      <li>Multiple monitors, and ultra-wide screens split into several screens.</li>
      <li>Lock screen with password or fingerprint, notifications, a file explorer with previews, a settings app.</li>
      <li>Screenshots and screen sharing, in more than 20 languages.</li>
      <li>No analytics, no phone-home.</li>
    </ul>

    <h3>Install it</h3>
    <dl className="install">
      {INSTALL.map((i) => (
        <React.Fragment key={i.distro}>
          <dt>{i.distro}</dt>
          <dd>
            {i.command ? (
              <>
                <code>{i.command}</code>
                {i.packages && <span className="note"> · packages: {i.packages}</span>}
              </>
            ) : (
              <a href={INSTRUCTIONS} target="_blank" rel="noreferrer">
                Installation instructions
              </a>
            )}
          </dd>
        </React.Fragment>
      ))}
    </dl>
    <p className="note">
      Built with Rust and Flutter, released under the GPL-3.0. Successor to Material Shell. Source, issues and documentation on{" "}
      <a href="https://github.com/free-explorers/veshell" target="_blank" rel="noreferrer">
        GitHub
      </a>
      .
    </p>
  </>
);

export const ArchitectsContent: React.FC = () => (
  <>
    <p className="lead">
      Architects dedicate their time to building the technologies of tomorrow. The collective funds them, so projects are delivered with care and stay alive for
      the long run.
    </p>

    <h3>How it works</h3>
    <p>
      Every Explorer's contribution goes through our <a href={COLLECTIVE}>Open Collective</a>, where every income and expense is public. The collective pays the
      Architects to work on its projects. In return, Explorers take part in decisions and get support across the projects.
    </p>

    <h3>The Architects</h3>
    <div className="architect">
      <img src="https://github.com/PapyElGringo.png?size=160" alt="" width={72} height={72} />
      <div>
        <h4>
          <a href="https://github.com/PapyElGringo" target="_blank" rel="noreferrer">
            PapyElGringo
          </a>
        </h4>
        <p>
          Adrien Peslerbe, front-end developer and UX architect. He created Material Shell, used by hundreds of thousands of people on GNOME, and now leads
          Veshell to change how we interact with our digital environment.
        </p>
      </div>
    </div>

    <h3>Become one</h3>
    <p>
      Building something the collective could get behind? Come and talk to us on{" "}
      <a href="https://discord.gg/vBb7D9a" target="_blank" rel="noreferrer">
        Discord
      </a>
      .
    </p>
  </>
);
