import type { PropsWithChildren, ReactNode } from "react";

import { AtmFrame } from "./AtmFrame";
import { WelcomeSidebarCard } from "./WelcomeSidebarCard";

interface AtmScreenLayoutProps extends PropsWithChildren {
  machineState: string;
  screenLabel: string;
  headline: string;
  lead: string;
  sessionLabel: string;
  footer?: ReactNode;
  aside?: ReactNode;
  sidebarPrimary?: ReactNode;
  showAuthenticatedSidebar?: boolean;
}

export function AtmScreenLayout({
  machineState,
  screenLabel,
  headline,
  lead,
  sessionLabel,
  footer,
  aside,
  sidebarPrimary,
  showAuthenticatedSidebar = false,
  children,
}: AtmScreenLayoutProps) {
  return (
    <AtmFrame
      machineState={machineState}
      screenLabel={screenLabel}
      headline={headline}
      lead={lead}
      sessionLabel={sessionLabel}
      footer={footer}
      aside={
        <>
          <section className="atm-aside-block">
            <p className="atm-aside-block__label">Machine notes</p>
            <ul className="atm-bullet-list">
              <li>Custom amounts must be entered in increments of £5.</li>
              <li>Overdraft maximum is £100.</li>
            </ul>
          </section>
          {aside}
        </>
      }
      sidebarPrimary={
        showAuthenticatedSidebar ? sidebarPrimary ?? <WelcomeSidebarCard /> : sidebarPrimary
      }
    >
      {children}
    </AtmFrame>
  );
}
