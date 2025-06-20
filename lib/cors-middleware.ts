import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import Cors from 'cors';

// Allow only trusted origins for admin endpoints
const allowedOrigins = [
  process.env.ADMIN_ORIGIN || 'http://localhost:3000',
];

const cors = Cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export function withCorsAndSecurityHeaders(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Run CORS
    try {
      await runMiddleware(req, res, cors);
    } catch (err) {
      return res.status(403).json({ error: 'CORS error' });
    }
    // Add security headers
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    return handler(req, res);
  };
} 