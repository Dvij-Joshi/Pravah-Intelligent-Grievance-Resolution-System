import Groq from 'groq-sdk';
import { supabase } from '../index.js';
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function runTriage(grievance) {
  const prompt = `You are a municipal triage agent. Analyze the following grievance and output a JSON object exactly matching this structure:
{
  "priority": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "category": "String (best fit)",
  "estimated_sla_hours": Number,
  "summary": "Short 1 sentence summary",
  "tags": ["tag1", "tag2"]
}

Grievance Title: ${grievance.title}
Description: ${grievance.description}
Reported Category: ${grievance.category}`;

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "You output only valid JSON. No markdown formatting or extra text." },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    response_format: { type: "json_object" }
  });

  const rawJson = completion.choices[0]?.message?.content;
  const triageData = JSON.parse(rawJson);

  // Update Supabase
  await supabase
    .from('grievances')
    .update({ 
      ai_triage_data: triageData,
      priority: triageData.priority
    })
    .eq('id', grievance.id);

  return triageData;
}
