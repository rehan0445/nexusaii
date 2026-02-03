import { supabase } from "../config/supabase.js";

export const saveChat = async (req, res) => {
  const { user_id, character_id, messages, created_at, updated_at } = req.body;

  if (!user_id || !character_id || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields or invalid format",
    });
  }

  try {
    const { data, error } = await supabase.from("ai_chat_history").insert([
      {
        user_id,
        character_id,
        messages,
        created_at,
        updated_at,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

export const getSavedChat = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required in request body",
    });
  }

  try {
    const { data, error } = await supabase
      .from("ai_chat_history")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// DELETE /api/v1/chat/ai/delete-chat
export const deleteSingleChat = async (req, res) => {
  const { chat_id } = req.body;

  if (!chat_id) {
    return res.status(400).json({
      success: false,
      message: "Chat ID is required",
    });
  }

  const { error } = await supabase
    .from("ai_chat_history")
    .delete()
    .eq("id", chat_id);

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete chat",
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Chat deleted successfully",
  });
};

// POST /api/v1/chat/ai/delete-all-chats
export const deleteAllChatsForUser = async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  const { error } = await supabase
    .from("ai_chat_history")
    .delete()
    .eq("user_id", user_id);

  if (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete all chats",
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    message: "All chats deleted successfully for the user",
  });
};

// POST /api/v1/chat/ai/get-character-chat
export const getCharacterChat = async (req, res) => {
  const user_id = req.body.user_id || req.userId;
  const character_id = req.body.character_id;

  if (!user_id || !character_id) {
    return res.status(400).json({
      success: false,
      message: "User ID and Character ID are required (send x-user-id for guest)",
    });
  }

  try {
    const { data, error } = await supabase
      .from("ai_chat_history")
      .select("*")
      .eq("user_id", user_id)
      .eq("character_id", character_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No chat found for this character
        return res.status(200).json({ 
          success: true, 
          data: null,
          message: "No previous chat found for this character"
        });
      }
      console.error("Supabase fetch error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};

// POST /api/v1/chat/ai/update-chat
export const updateChat = async (req, res) => {
  const { chat_id, messages, updated_at } = req.body;

  if (!chat_id || !Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      message: "Chat ID and messages array are required",
    });
  }

  try {
    const { data, error } = await supabase
      .from("ai_chat_history")
      .update({
        messages,
        updated_at: updated_at || new Date().toISOString(),
      })
      .eq("id", chat_id)
      .select();

    if (error) {
      console.error("Supabase update error:", error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
