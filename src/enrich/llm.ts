import {
  DEEPSEEK_API_KEY,
  DEEPSEEK_BASE_URL,
  DEEPSEEK_MODEL,
} from "../config.js";

/**
 * Minimal DeepSeek (OpenAI-compatible) chat call. Returns the assistant text,
 * or null on any failure (missing key, network error, bad response). Callers
 * treat null as "AI unavailable" and degrade gracefully.
 */
async function chat(
  system: string,
  user: string,
  maxTokens: number,
): Promise<string | null> {
  if (!DEEPSEEK_API_KEY) return null;
  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Rate how well the base CV fits a job description. Returns a short report
 * (fit score, matching skills, gaps, tailoring advice), or null on failure.
 */
export async function analyzeJobFit(
  baseCV: string,
  jobDescription: string,
  companyName: string,
): Promise<string | null> {
  const system =
    "You are a concise career advisor. Given a CV and a job description, " +
    "rate the fit from 1-10, list the candidate's matching skills, identify " +
    "the main gaps, and give exactly 3 specific, actionable advice points for " +
    "tailoring the application. Keep it short and skimmable.";
  const user =
    `Company: ${companyName}\n\n` +
    `=== JOB DESCRIPTION ===\n${jobDescription}\n\n` +
    `=== CV ===\n${baseCV}`;
  return chat(system, user, 400);
}

/**
 * Rewrite the base CV tailored for a specific role. Returns only the rewritten
 * CV text, or null on failure.
 */
export async function tailorCV(
  baseCV: string,
  jobDescription: string,
  companyName: string,
  position: string,
): Promise<string | null> {
  const system =
    "You are a CV editor. Rewrite the provided CV tailored for the target " +
    "role. Reorder sections to match the role's emphasis, rewrite the " +
    "summary/objective, and weave in keywords from the job description. Keep " +
    "all factual content true — do not invent experience, employers, or dates. " +
    "Return only the CV text, with no commentary.";
  const user =
    `Target role: ${position} at ${companyName}\n\n` +
    `=== JOB DESCRIPTION ===\n${jobDescription}\n\n` +
    `=== CV TO REWRITE ===\n${baseCV}`;
  return chat(system, user, 1500);
}
