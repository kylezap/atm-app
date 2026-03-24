import { formatCurrency } from "./atm-format";

export function sanitizeDigits(value: string, maxLength = 4) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

export function isSupportedCustomAmount(amount: number) {
  return Number.isInteger(amount) && amount > 0 && amount % 5 === 0;
}

export function getNearestAmountSuggestions(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    return [5, 10] as const;
  }

  const lower = Math.max(5, Math.floor(amount / 5) * 5);
  const upper = Math.max(5, Math.ceil(amount / 5) * 5);

  if (lower === upper) {
    return [lower, lower + 5] as const;
  }

  return [lower, upper] as const;
}

export function getCustomAmountHelper(value: string) {
  if (!value) {
    return "Enter a custom amount in increments of £5.";
  }

  const parsedAmount = Number(value);

  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    return "Enter a whole-pound amount greater than zero.";
  }

  if (parsedAmount % 5 !== 0) {
    const [lower, upper] = getNearestAmountSuggestions(parsedAmount);

    return `This machine dispenses in £5 steps. Try ${formatCurrency(lower)} or ${formatCurrency(
      upper,
    )}.`;
  }

  return "The ATM will validate balance and note availability when the session runs.";
}
