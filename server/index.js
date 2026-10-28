import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import authRoutes from './routes/authRoutes.js';
import authorRoutes from './routes/authorRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { sseService } from './services/sseService.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BookLeaf Portal API',
    timestamp: new Date().toISOString(),
    aiEngine: config.openaiApiKey ? 'OpenAI GPT-4o-mini' : 'BookLeaf Heuristic Knowledge Engine (Active Fallback)',
  });
});

// Server-Sent Events (SSE) stream for real-time ticket & message updates
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (Nginx/Render)
  res.flushHeaders?.();

  const clientId = sseService.addClient(res, {
    token: req.query.token,
    ip: req.ip,
  });

  // Heartbeat ping every 25 seconds
  const heartbeatTimer = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
  });
});

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/ai', aiRoutes);

// Centralized error handling
app.use(errorHandler);

// Start Server
const server = app.listen(config.port, '127.0.0.1', () => {
  console.log(`🚀 BookLeaf Portal API server running on http://127.0.0.1:${config.port}`);
  console.log(`🤖 AI Engine: ${config.openaiApiKey ? 'OpenAI API Connected' : 'Resilient Policy-Grounded Fallback Active'}`);
});

export default app;
