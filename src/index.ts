import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import thesisRoutes from './routes/thesis.routes';
import pitchRoutes from './routes/pitch.routes';

const app = express();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Raw Swagger JSON Spec
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Swagger Documentation UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'DealFlow AI - API Documentation',
  })
);

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'dealflow-ai-backend',
    timestamp: new Date().toISOString(),
  });
});

// Auth Routes
app.use('/api/auth', authRoutes);

// Thesis Routes
app.use('/api/thesis', thesisRoutes);

// Pitch Routes
app.use('/api/pitches', pitchRoutes);

// Root route redirect to docs
app.get('/', (_req: Request, res: Response) => {
  res.redirect('/api-docs');
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const DEFAULT_PORT = Number(process.env.PORT) || 5000;

export const startServer = (port: number = DEFAULT_PORT) => {
  const server = app
    .listen(port, () => {
      console.log(`\n🚀 DealFlow AI Backend running on http://localhost:${port}`);
      console.log(`📑 Swagger Documentation available at http://localhost:${port}/api-docs`);
      console.log(`🩺 Health check endpoint at http://localhost:${port}/api/health\n`);
    })
    .on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`⚠️ Port ${port} is in use (frequently macOS AirPlay Receiver on port 5000).`);
        if (port === 5000) {
          console.log(`🔄 Automatically falling back to port 5001...`);
          startServer(5001);
        } else {
          console.error(`❌ Port ${port} is occupied. Please free it or set a different PORT in .env.`);
        }
      } else {
        console.error('❌ Server failed to start:', err);
      }
    });

  return server;
};

startServer(DEFAULT_PORT);

export default app;
