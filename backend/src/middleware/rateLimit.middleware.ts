import rateLimit from 'express-rate-limit';

// General API abuse protection — generous enough that normal use (list
// pages, dashboards polling on load, pagination) never comes close,
// but bounds how much a single client can hammer the API.
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many requests. Please slow down and try again shortly.' },
});

// Login is the one endpoint an attacker can hit with no credentials at
// all, so it gets a much tighter, IP-scoped limit — enough headroom for
// a real user mistyping a password a few times, not enough for a
// brute-force / credential-stuffing run.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    status: 'error',
    message: 'Too many login attempts. Please wait a few minutes before trying again.',
  },
});
