import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import apiRoutes from './routes/index';
import { notFoundHandler } from './middleware/notFound.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { apiRateLimiter } from './middleware/rateLimit.middleware';

const app: Application = express();

// Baseline security headers (X-Content-Type-Options, X-Frame-Options,
// a conservative CSP, HSTS when served over HTTPS, etc). Disable the
// cross-origin-resource-policy default so the frontend (a different
// origin) can still load uploaded logo images from /uploads.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// HTTP request logging — 'dev' is concise and colored for local work;
// 'combined' (Apache-style, includes IP/UA/referrer) is what you want
// in production, written to stdout so any process manager or hosting
// platform (systemd, Docker, PM2, Render, Railway, ...) can capture and
// ship it without this app needing to know about log files at all.
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

app.use(
  cors({
    origin: env.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// General abuse/DoS protection across the whole API. Sensitive
// endpoints (login) layer a much stricter limiter on top — see
// auth.routes.ts.
app.use('/api', apiRateLimiter);

// Serves uploaded logo files (e.g. /uploads/logos/logo-123.png) so the
// frontend can render them directly via the URL stored in logoUrl.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
