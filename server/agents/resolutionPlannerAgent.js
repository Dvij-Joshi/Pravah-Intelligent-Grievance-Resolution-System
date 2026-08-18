import Groq from 'groq-sdk';
import { supabase } from '../index.js';
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function runResolutionPlanner(grievance, triageData) {
  const prompt = `You are a municipal operations planner. Generate a step-by-step action plan to resolve this grievance.
Output a JSON object exactly matching this structure:
{
  "tasks": [
    { "id": "1", "title": "Task title", "department": "Dept Name" }
  ],
  "primary_department": "String",
  "sla_deadline": "ISO String date based on triage SLA"
}

Grievance: ${grievance.title}
Description: ${grievance.description}
Triage SLA: ${triageData.estimated_sla_hours} hours`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You output only valid JSON. Calculate the sla_deadline from the current time plus the estimated_sla_hours." },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const rawJson = completion.choices[0]?.message?.content;
  const plan = JSON.parse(rawJson);

  // Update Supabase
  await supabase
    .from('grievances')
    .update({ 
      ai_workflow: plan
    })
    .eq('id', grievance.id);

  return plan;
}
