import type { PropsWithChildren, ReactNode } from "react";

interface AtmFrameProps extends PropsWithChildren {
  screenLabel: string;
  headline: string;
  lead: string;
  machineState: string;
  sessionLabel: string;
  footer?: ReactNode;
  sidebarPrimary?: ReactNode;
  machineNotesExtra?: ReactNode;
  aside?: ReactNode;
}

export function AtmFrame({
  screenLabel,
  headline,
  lead,
  machineState,
  sessionLabel,
  footer,
  sidebarPrimary,
  machineNotesExtra,
  aside,
  children,
}: AtmFrameProps) {
  return (
    <main className="atm-page-shell">
      <div className="atm-stage">
        <section className="atm-machine" aria-label="ATM monitor">
          <header className="atm-machine__header">
            <div>
              <p className="atm-machine__eyebrow">Cardless terminal</p>
              <h1 className="atm-machine__brand">Pokémon Bank</h1>
            </div>
            <p className="atm-machine__status">{machineState}</p>
          </header>

          <div className="atm-screen">
            <div className="atm-screen__topline">
              <span>{screenLabel}</span>
              <span>{sessionLabel}</span>
              <span>Notes: £20 / £10 / £5</span>
            </div>

            <div className="atm-screen__grid">
              <section className="atm-screen__main">
                <header className="atm-screen__header">
                  <p className="atm-screen__label">{screenLabel}</p>
                  <h2>{headline}</h2>
                  <p>{lead}</p>
                </header>

                <div className="atm-screen__content">{children}</div>

                {footer ? <div className="atm-screen__footer">{footer}</div> : null}
              </section>

              <aside className="atm-screen__aside">
                {sidebarPrimary}

                <section className="atm-aside-block">
                  <p className="atm-aside-block__label">Machine notes</p>
                  <ul className="atm-bullet-list">
                    <li>Custom amounts must be entered in increments of £5.</li>
                    <li>Overdraft maximum is £100.</li>
                  </ul>
                  {machineNotesExtra ? (
                    <div className="atm-aside-block__section">{machineNotesExtra}</div>
                  ) : null}
                </section>

                {aside}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
