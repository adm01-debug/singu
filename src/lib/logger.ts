/**
 * Production-safe logger that only outputs in development.
 * Drop-in replacement for console.log/error/warn.
 */

const isDev = import.meta.env.DEV;

/* eslint-disable no-console */
export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  error: isDev ? console.error.bind(console) : () => {},
  info: isDev ? console.info.bind(console) : () => {},
  debug: isDev ? console.debug.bind(console) : () => {},
  table: isDev ? console.table.bind(console) : () => {},
  group: isDev ? console.group.bind(console) : () => {},
  groupEnd: isDev ? console.groupEnd.bind(console) : () => {},
};
/* eslint-enable no-console */
