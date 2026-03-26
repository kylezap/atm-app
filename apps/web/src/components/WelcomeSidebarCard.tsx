export function WelcomeSidebarCard() {
  return (
    <section className="atm-aside-block" aria-live="polite">
      <div className="atm-aside-block__header">
        <p className="atm-aside-block__label">Customer</p>
        <strong className="atm-aside-block__name">Welcome back Michael!</strong>
      </div>
      <p className="atm-helper">Choose a service from the main menu to continue.</p>
    </section>
  );
}
