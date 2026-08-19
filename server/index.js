import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase client (using anon key for now since RLS is permissive/disabled for test)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

// Import routes
import agentRoutes from './routes/agentRoutes.js';

app.use('/api', agentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Pravah AI Agents Backend is running' });
});

app.listen(PORT, () => {
  console.log(`🤖 AI Agent Server running on http://localhost:${PORT}`);
});
