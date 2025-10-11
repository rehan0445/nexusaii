export interface StepProgressPayload {
  userId?: string;
  flow: "create_companion";
  currentStep: number;
  totalSteps: number;
  completed?: boolean;
  updatedAt: string; // ISO
}

const LOCAL_KEY = "create_companion_progress";

export function saveProgressLocal(payload: StepProgressPayload) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

export async function saveProgressRemote(payload: StepProgressPayload) {
  try {
    const res = await fetch("/api/v1/progress/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to persist progress");
  } catch {
    // swallow - local is enough as fallback
  }
}

export async function trackStepProgress(step: number, total: number, userId?: string) {
  const payload: StepProgressPayload = {
    userId,
    flow: "create_companion",
    currentStep: step,
    totalSteps: total,
    completed: step >= total,
    updatedAt: new Date().toISOString(),
  };
  saveProgressLocal(payload);
  await saveProgressRemote(payload);
} 