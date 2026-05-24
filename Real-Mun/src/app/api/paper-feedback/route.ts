import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatJson } from "@/lib/llm";
import { recordPaper } from "@/lib/store";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const Schema = z.object({
  committee: z.string().min(2),
  country: z.string().min(2),
  topic: z.string().min(2),
  paper: z.string().min(50).max(20000),
});

const RUBRIC = `You are an experienced Model UN judge and head delegate with 10+ years of conference experience.
You are reviewing a delegate's position paper. Your job is to give honest, structured, actionable feedback.

You score on five dimensions, each out of 10:

1. RESEARCH DEPTH — Does the paper cite real treaties, resolutions, statistics, named bodies? Or is it vague?
2. POLICY ALIGNMENT — Does the country position actually match that country's real-world foreign policy? Red-flag any positions that contradict the country's actual stance.
3. STRUCTURE — Is there a clear topic background, country position, past action, and proposed solutions? Are the sections balanced?
4. PERSUASIVENESS — Does the paper make specific, defensible proposals? Or just list problems?
5. MUN LANGUAGE — Uses diplomatic register ("the delegation of X believes"), avoids first person, avoids opinion-loaded language.

You ALWAYS return your response in this exact JSON shape:

{
  "overall_score": <number 0-50>,
  "scores": {
    "research_depth": { "score": <0-10>, "comment": "<one sentence>" },
    "policy_alignment": { "score": <0-10>, "comment": "<one sentence>" },
    "structure": { "score": <0-10>, "comment": "<one sentence>" },
    "persuasiveness": { "score": <0-10>, "comment": "<one sentence>" },
    "mun_language": { "score": <0-10>, "comment": "<one sentence>" }
  },
  "strengths": ["<specific quoted line or behavior>", "..."],
  "weaknesses": ["<specific quoted line or issue>", "..."],
  "line_edits": [
    { "original": "<exact phrase from paper>", "suggested": "<rewrite>", "why": "<short reason>" }
  ],
  "policy_red_flags": ["<any positions that contradict the country's real policy>"],
  "next_steps": ["<concrete action the delegate should take before conference>", "..."]
}

Be specific. Quote actual lines from the paper. Do not invent positions the paper did not take.
Return ONLY the JSON object.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { committee, country, topic, paper } = parsed.data;

  const userPrompt = `Committee: ${committee}
Country represented: ${country}
Topic: ${topic}

---POSITION PAPER START---
${paper}
---POSITION PAPER END---

Return only the JSON object as specified.`;

  try {
    const feedback = await chatJson({
      system: RUBRIC,
      user: userPrompt,
      maxTokens: 2500,
      temperature: 0.4,
    });

    const session = await getSession();
    recordPaper({
      username: session?.username ?? "anonymous",
      committee,
      country,
      topic,
      paperPreview: paper.slice(0, 300),
      feedback,
    });

    return NextResponse.json({ feedback });
  } catch (err) {
    const message = err instanceof Error ? err.message : "LLM request failed";
    console.error("[paper-feedback]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
