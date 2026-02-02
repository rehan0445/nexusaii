import { supabase } from "../config/supabase.js";

// Upserts user wizard progress. This is optional and safe: if table doesn't exist, it will silently fail upstream.
export const saveProgress = async (req, res) => {
  try {
    const { userId, flow, currentStep, totalSteps, completed, updatedAt } = req.body || {};
    if (!flow || !currentStep || !totalSteps) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    // Attempt to upsert; table schema suggestion:
    // wizard_progress(id uuid default gen_random_uuid(), user_id text, flow text, current_step int, total_steps int, completed boolean, updated_at timestamptz)
    const { error } = await supabase
      .from("wizard_progress")
      .upsert({ user_id: userId || null, flow, current_step: currentStep, total_steps: totalSteps, completed: !!completed, updated_at: updatedAt || new Date().toISOString() }, { onConflict: "user_id,flow" });

    if (error) {
      // Log but don't expose details
      // eslint-disable-next-line no-console
      console.error("saveProgress error:", error.message);
      return res.status(200).json({ success: true, message: "Progress received (not persisted)." });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("saveProgress exception:", e?.message);
    return res.status(200).json({ success: true, message: "Progress received (not persisted)." });
  }
}; 