import { z } from "zod";

const ScoreSchema = z.object({ score: z.number().finite().min(0).max(10), comment: z.string() });

const PaperFeedbackSchema = z.object({
  overall_score: z.number().finite().min(0).max(50),
  scores: z.object({
    research_depth: ScoreSchema,
    policy_alignment: ScoreSchema,
    structure: ScoreSchema,
    persuasiveness: ScoreSchema,
    mun_language: ScoreSchema,
  }),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  line_edits: z.array(z.object({ original: z.string(), suggested: z.string(), why: z.string() })),
  policy_red_flags: z.array(z.string()),
  next_steps: z.array(z.string()),
});

const ConferenceFeedbackSchema = z.object({
  overall_score: z.number().finite().min(0).max(100),
  highlights: z.array(z.string()),
  issues: z.array(z.string()),
  delivery: ScoreSchema,
  content: ScoreSchema,
  engagement: ScoreSchema,
  rewrite_example: z.object({ original: z.string(), improved: z.string(), why: z.string() }),
  next_session_focus: z.array(z.string()),
});

const SavedPaperReviewSchema = z.object({
  id: z.string(),
  kind: z.literal("paper"),
  createdAt: z.number().finite(),
  committee: z.string(),
  country: z.string(),
  topic: z.string(),
  paper: z.string().max(20_000),
  feedback: PaperFeedbackSchema,
});

const SavedConferenceReviewSchema = z.object({
  id: z.string(),
  kind: z.literal("conference"),
  createdAt: z.number().finite(),
  committee: z.string(),
  country: z.string(),
  topic: z.string(),
  durationMs: z.number().finite().nonnegative(),
  speeches: z.array(z.string().max(10_000)).max(500),
  feedback: ConferenceFeedbackSchema,
});

const SavedReviewSchema = z.discriminatedUnion("kind", [
  SavedPaperReviewSchema,
  SavedConferenceReviewSchema,
]);

export type SavedPaperReview = z.infer<typeof SavedPaperReviewSchema>;
export type SavedConferenceReview = z.infer<typeof SavedConferenceReviewSchema>;
export type SavedReview = z.infer<typeof SavedReviewSchema>;

const STORAGE_KEY = "realmun_saved_reviews_v1";
const MAX_SAVED_REVIEWS = 12;
const REVIEWS_UPDATED_EVENT = "realmun:reviews-updated";

function readStoredReviews(): SavedReview[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => SavedReviewSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_SAVED_REVIEWS);
  } catch {
    return [];
  }
}

function saveReview(review: SavedReview): boolean {
  if (typeof window === "undefined") return false;
  try {
    const reviews = [review, ...readStoredReviews().filter((item) => item.id !== review.id)]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, MAX_SAVED_REVIEWS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
    window.dispatchEvent(new Event(REVIEWS_UPDATED_EVENT));
    return true;
  } catch {
    return false;
  }
}

function makeId(prefix: string): string {
  const randomId = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  return `${prefix}-${randomId}`;
}

export function loadSavedReviews(): SavedReview[] {
  return readStoredReviews();
}

export function onSavedReviewsUpdated(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(REVIEWS_UPDATED_EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(REVIEWS_UPDATED_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function savePaperReview(
  review: Omit<SavedPaperReview, "id" | "kind" | "createdAt">
): boolean {
  return saveReview({
    ...review,
    id: makeId("paper"),
    kind: "paper",
    createdAt: Date.now(),
  });
}

export function saveConferenceReview(
  review: Omit<SavedConferenceReview, "kind">
): boolean {
  return saveReview({ ...review, kind: "conference" });
}
