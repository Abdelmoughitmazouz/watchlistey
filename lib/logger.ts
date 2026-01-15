
// Safely check for production environment variable
const isProduction = (import.meta as any).env?.PROD;

/**
 * A safe wrapper around console logging.
 * Logs are programmatically suppressed in production environments.
 * Use this instead of console.log/warn/error directly.
 */
export const Logger = {
  log: (...args: any[]) => {
    if (!isProduction) console.log(...args);
  },
  warn: (...args: any[]) => {
    if (!isProduction) console.warn(...args);
  },
  error: (...args: any[]) => {
    if (!isProduction) console.error(...args);
  },
  debug: (...args: any[]) => {
    if (!isProduction) console.debug(...args);
  },
  info: (...args: any[]) => {
    if (!isProduction) console.info(...args);
  },
  // Use critical only for errors that must be seen even in prod (e.g. fatal app crashes)
  // But generally, avoid sending sensitive data here.
  critical: (...args: any[]) => {
    console.error(...args);
  }
};
