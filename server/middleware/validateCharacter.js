export const validateCreateCharacter = (req, res, next) => {
  try {
    const characterRaw = req.body?.character;
    if (!characterRaw || typeof characterRaw !== "string") {
      return res.status(400).json({ success: false, message: "Character payload missing" });
    }

    let parsed;
    try {
      parsed = JSON.parse(characterRaw);
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid character JSON" });
    }

    const errors = [];
    if (!parsed.name || typeof parsed.name !== "string" || parsed.name.trim().length < 2) {
      errors.push("Name is required and must be at least 2 characters.");
    }
    if (parsed.tags && !Array.isArray(parsed.tags)) {
      errors.push("Tags must be an array.");
    }
    if (parsed.languages && typeof parsed.languages !== "object") {
      errors.push("Languages must be an object.");
    }
    if (parsed.personality && typeof parsed.personality !== "object") {
      errors.push("Personality must be an object.");
    }
    if (errors.length) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // Attach parsed for downstream use if needed
    req.characterParsed = parsed;
    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: "Validation error" });
  }
}; 