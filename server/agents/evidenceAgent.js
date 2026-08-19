import Groq from 'groq-sdk';
import { supabase } from '../index.js';
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function runEvidenceAnalysis(grievance, beforeDesc, afterDesc, officerNote, afterImageUrl, beforeImageUrl) {
  console.log(`[EvidenceAgent] Analyzing grievance ID: ${grievance.id}`);
  console.log(`[EvidenceAgent] After image URL: ${afterImageUrl}`);
  console.log(`[EvidenceAgent] Before image URL: ${beforeImageUrl}`);

  const prompt = `You are an AI Evidence Verification Agent.
Compare the "before" and "after" descriptions of the grievance site provided by the officer, along with their resolution note.
Output a JSON object exactly matching this structure:
{
  "confidence": Number (0-100),
  "change_detected": Boolean,
  "observations": "String detailing what changed",
  "concerns": ["Array of strings if any issues found, empty if none"],
  "recommendation": "APPROVE" | "REJECT" | "REVIEW"
}

Grievance: ${grievance.title}
Before Scene Description: ${beforeDesc || "Not provided"}
After Scene Description: ${afterDesc || "Not provided"}
Officer Resolution Note: ${officerNote || "Not provided"}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You output ONLY a single valid JSON object with no extra text, no markdown, no explanation. Do not use a thinking block. Output the JSON immediately."
      },
      { role: "user", content: prompt + "\n\n/no_think\n\nRespond with only the JSON object:" }
    ],
    model: "qwen/qwen3.6-27b",
    temperature: 0.1,
    max_tokens: 1024,
  });

  const rawContent = completion.choices[0]?.message?.content || '';
  console.log('[EvidenceAgent] Raw AI response:', rawContent);

  // Extract JSON robustly — strip any <think>...</think> blocks and markdown fences
  let rawJson = rawContent
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Find the first { ... } block
  const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI did not return valid JSON: ' + rawJson.slice(0, 200));
  const report = JSON.parse(jsonMatch[0]);

  if (afterImageUrl) report.afterImageUrl = afterImageUrl;
  if (beforeImageUrl) report.beforeImageUrl = beforeImageUrl;

  console.log('[EvidenceAgent] Saving report to Supabase for grievance ID:', grievance.id);
  const { error } = await supabase
    .from('grievances')
    .update({ ai_evidence_report: report })
    .eq('id', grievance.id);

  if (error) {
    console.error('[EvidenceAgent] Supabase update failed:', error.message);
    throw new Error(`Database update failed: ${error.message}`);
  }

  console.log('[EvidenceAgent] Report saved successfully. Recommendation:', report.recommendation);
  return report;
}
