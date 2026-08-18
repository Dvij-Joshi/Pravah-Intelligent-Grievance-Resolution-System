import Groq from 'groq-sdk';
import { supabase } from '../index.js';
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function runResolution(grievance, evidenceReport) {
  const prompt = `You are the Final Resolution Agent.
Based on the original grievance and the Evidence Agent's report, make a final verdict.
Output a JSON object exactly matching this structure:
{
  "verdict": "VERIFIED" | "FAILED",
  "reason": "String explaining the verdict",
  "citizen_message": "String: Friendly message to send to the citizen explaining the resolution"
}

Original Grievance: ${grievance.title}
Description: ${grievance.description}
Evidence Agent Recommendation: ${evidenceReport.recommendation}
Evidence Agent Confidence: ${evidenceReport.confidence}
Evidence Agent Concerns: ${evidenceReport.concerns?.join(', ') || 'None'}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You output only valid JSON. If the recommendation is APPROVE and confidence > 70, verdict should be VERIFIED. Otherwise FAILED." },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const rawJson = completion.choices[0]?.message?.content;
  const resolution = JSON.parse(rawJson);

  const newStatus = resolution.verdict === 'VERIFIED' ? 'resolved' : 'reopened';

  // Update Supabase
  await supabase
    .from('grievances')
    .update({ 
      ai_verdict: resolution.verdict,
      status: newStatus
    })
    .eq('id', grievance.id);

  return resolution;
}
