import express from 'express';
import { runTriage } from '../agents/triageAgent.js';
import { runResolutionPlanner } from '../agents/resolutionPlannerAgent.js';
import { runEvidenceAnalysis } from '../agents/evidenceAgent.js';
import { runResolution } from '../agents/resolutionAgent.js';

const router = express.Router();

router.post('/triage', async (req, res) => {
  try {
    const { grievance } = req.body;
    if (!grievance) return res.status(400).json({ error: 'Grievance data required' });
    
    const triageData = await runTriage(grievance);
    res.json(triageData);
  } catch (error) {
    console.error('Triage Agent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/plan', async (req, res) => {
  try {
    const { grievance, triageData } = req.body;
    if (!grievance || !triageData) return res.status(400).json({ error: 'Grievance and triage data required' });
    
    const plan = await runResolutionPlanner(grievance, triageData);
    res.json(plan);
  } catch (error) {
    console.error('Resolution Planner Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/evidence', async (req, res) => {
  try {
    const { grievance, beforeDesc, afterDesc, officerNote, afterImageUrl } = req.body;
    if (!grievance) return res.status(400).json({ error: 'Grievance data required' });
    
    const report = await runEvidenceAnalysis(grievance, beforeDesc, afterDesc, officerNote, afterImageUrl);
    res.json(report);
  } catch (error) {
    console.error('Evidence Agent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/resolve', async (req, res) => {
  try {
    const { grievance, evidenceReport } = req.body;
    if (!grievance || !evidenceReport) return res.status(400).json({ error: 'Grievance and evidence report required' });
    
    const resolution = await runResolution(grievance, evidenceReport);
    res.json(resolution);
  } catch (error) {
    console.error('Resolution Agent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
