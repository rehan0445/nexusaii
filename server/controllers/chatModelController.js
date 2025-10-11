import { supabase } from "../config/supabase.js";

// Get all models
export const getAllChatModels = async (req, res) => {
    const { data, error } = await supabase
        .from("chatbot_models")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("Error fetching chat models:", error.message);
        return res.status(500).json({ error: "Failed to fetch chatbot models" });
    }

    return res.json(data);
};

// Get one model by ID
export const getChatModelById = async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabase
        .from("chatbot_models")
        .select("*")
        .eq("id", id)
        .limit(1);

    if (error) {
        console.error(`Error fetching model with id ${id}:`, error.message);
        return res.status(500).json({ error: "Server error while fetching chatbot model" });
    }

    if (!data || data.length === 0) {
        return res.status(404).json({ error: `No chatbot model found with id ${id}` });
    }

    return res.json(data[0]);
};