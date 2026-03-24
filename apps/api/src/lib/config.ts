import "dotenv/config";

const DEFAULT_PORT = 3001;

function parsePort(rawValue: string | undefined): number {
  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }

  return parsed;
}

export const config = {
  port: parsePort(process.env.PORT),
} as const;
