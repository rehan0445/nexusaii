import { supabase } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";
import { scanBuffer } from "../utils/avScanner.js";

// Creates a new character in the database
export const createCharacter = async (req, res) => {
  try {
    const { user_id } = req.body;
    const characterRaw = req.body.character;

    if (!user_id || !characterRaw) {
      return res.status(400).json({
        success: false,
        message: "User ID and character data are required",
      });
    }

    const character = JSON.parse(characterRaw);

    if (!character.name) {
      return res.status(400).json({
        success: false,
        message: "Character name is required",
      });
    }

    let imageUrl = null;

    // Handle avatar upload if file exists
    if (req.file) {
      const file = req.file;
      const allowed = ['jpg','jpeg','png','gif','webp'];
      const fileExt = (file.originalname.split(".").pop() || '').toLowerCase();
      if (!allowed.includes(fileExt)) {
        return res.status(400).json({ success: false, message: 'Invalid file type' });
      }
      const av = await scanBuffer(file.buffer, file.originalname, file.mimetype);
      if (!av.clean) return res.status(400).json({ success: false, message: 'File failed antivirus scan' });
      const fileName = `avatars/${uuidv4()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("nexus-character-image")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (uploadError) {
        console.error("Image upload failed:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload avatar image",
          error: uploadError.message,
        });
      }

      // Create signed URL
      const { data: signed } = await supabase.storage
        .from("nexus-character-image")
        .createSignedUrl(fileName, 60 * 10);
      imageUrl = signed?.signedUrl || null;
    }

    const { data, error } = await supabase
      .from("character_data")
      .insert([
        {
          name: character.name,
          description: character.description || null,
          user_id,
          tags: character.tags || [],
          role: character.role || null,
          image: imageUrl,
          languages: character.languages || null,
          personality: character.personality || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error inserting character:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create character",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Character created successfully",
      data,
    });
  } catch (error) {
    console.error("Error in createCharacter:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

// Gets all characters for a specific user
export const getUserCharacters = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const { data, error } = await supabase
      .from("character_data")
      .select("id, name, image, role, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const charactersMap = data.reduce((acc, character) => {
      acc[character.id] = character;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: charactersMap,
    });
  } catch (error) {
    console.error("Error in getUserCharacters:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch characters",
      error: error.message,
    });
  }
};

// Gets a specific character by ID
export const getCharacterById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid character ID is required",
      });
    }

    const { data, error } = await supabase
      .from("character_data")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error in getCharacterById:", error.message);
    return res
      .status(error.message === "Character not found" ? 404 : 500)
      .json({
        success: false,
        message:
          error.message === "Character not found"
            ? "Character not found"
            : "An unexpected error occurred",
        error: error.message,
      });
  }
};

// Get likes for a specific character
export const getCharacterLikes = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid character ID is required",
      });
    }

    // Get like count with timeout handling
    const { count: likeCount, error: countError } = await Promise.race([
      supabase
        .from("character_likes")
        .select("*", { count: "exact", head: true })
        .eq("character_id", id),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]).catch(error => {
      // Return graceful fallback on error instead of crashing
      console.error("Error fetching like count:", error.message || error);
      return { count: 0, error: null };
    });

    if (countError) {
      console.error("Count error:", countError.message || countError);
    }

    // Check if user has liked this character
    let userLiked = false;
    if (user_id) {
      const { data: userLike, error: userLikeError } = await Promise.race([
        supabase
          .from("character_likes")
          .select("id")
          .eq("character_id", id)
          .eq("user_id", user_id)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database query timeout')), 5000)
        )
      ]).catch(error => {
        console.error("Error checking user like:", error.message || error);
        return { data: null, error: null };
      });

      if (!userLikeError && userLike) {
        userLiked = true;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        likeCount: likeCount || 0,
        userLiked,
      },
    });
  } catch (error) {
    // Improved error logging with full error details
    console.error("Error in getCharacterLikes:", {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n')[0],
    });
    
    // Return graceful response instead of 500 error
    return res.status(200).json({
      success: true,
      data: {
        likeCount: 0,
        userLiked: false,
      },
    });
  }
};

// Toggle like for a character
export const toggleCharacterLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid character ID is required",
      });
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check if user already liked this character
    const { data: existingLike, error: checkError } = await supabase
      .from("character_likes")
      .select("id")
      .eq("character_id", id)
      .eq("user_id", user_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    let action = "";
    let likeCount = 0;

    if (existingLike) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from("character_likes")
        .delete()
        .eq("character_id", id)
        .eq("user_id", user_id);

      if (deleteError) throw deleteError;
      action = "unliked";
    } else {
      // Like: Add the like
      const { error: insertError } = await supabase
        .from("character_likes")
        .insert([
          {
            character_id: id,
            user_id: user_id,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) throw insertError;
      action = "liked";
    }

    // Get updated like count
    const { count, error: countError } = await supabase
      .from("character_likes")
      .select("*", { count: "exact", head: true })
      .eq("character_id", id);

    if (countError) throw countError;
    likeCount = count || 0;

    return res.status(200).json({
      success: true,
      message: `Character ${action} successfully`,
      data: {
        action,
        likeCount,
        userLiked: action === "liked",
      },
    });
  } catch (error) {
    console.error("Error in toggleCharacterLike:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to toggle character like",
      error: error.message,
    });
  }
};

// Get like count for a character
export const getLikeCount = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Valid character ID is required",
      });
    }

    const { count, error } = await supabase
      .from("character_likes")
      .select("*", { count: "exact", head: true })
      .eq("character_id", id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: {
        likeCount: count || 0,
      },
    });
  } catch (error) {
    console.error("Error in getLikeCount:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch like count",
      error: error.message,
    });
  }
};

// Get reactions for multiple characters (bulk operation for performance)
export const getBulkCharacterReactions = async (req, res) => {
  try {
    const { character_ids, user_id } = req.body;

    if (!character_ids || !Array.isArray(character_ids) || character_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Character IDs array is required",
      });
    }

    const reactionsMap = {};

    // Process each character ID
    for (const characterId of character_ids) {
      try {
        // Get like count
        const { count: likeCount, error: countError } = await supabase
          .from("character_likes")
          .select("*", { count: "exact", head: true })
          .eq("character_id", characterId);

        if (countError) throw countError;

        // Check if user has liked this character
        let userLiked = false;
        if (user_id) {
          const { data: userLike, error: userLikeError } = await supabase
            .from("character_likes")
            .select("id")
            .eq("character_id", characterId)
            .eq("user_id", user_id)
            .single();

          if (!userLikeError && userLike) {
            userLiked = true;
          }
        }

        // Initialize reaction types with default values
        const reactionTypes = ['love', 'amazing', 'funny', 'epic', 'fire', 'magical'];
        const characterReactions = {};

        reactionTypes.forEach(type => {
          // For now, use like count as a base for all reactions
          // In a real implementation, you'd have separate reaction tables
          characterReactions[type] = {
            count: Math.floor(likeCount * 0.3), // Distribute likes across reactions
            userReacted: userLiked && Math.random() > 0.7 // Randomly assign user reactions
          };
        });

        reactionsMap[characterId] = characterReactions;
      } catch (error) {
        console.error(`Error getting reactions for character ${characterId}:`, error.message);
        // Return empty reactions for failed characters
        reactionsMap[characterId] = {};
      }
    }

    return res.status(200).json({
      success: true,
      data: reactionsMap,
    });
  } catch (error) {
    console.error("Error in getBulkCharacterReactions:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bulk character reactions",
      error: error.message,
    });
  }
};
