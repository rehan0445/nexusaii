import { supabase } from "../config/supabase.js";

// Track a character view
export const trackCharacterView = async (req, res) => {
  try {
    const { character_id, user_id, session_id } = req.body;
    const ip_address = req.ip || req.connection.remoteAddress;

    if (!character_id) {
      return res.status(400).json({
        success: false,
        message: "Character ID is required",
      });
    }

    // Check if this user/session has already viewed this character recently (within 5 seconds)
    // Very short window to prevent accidental double-clicks while counting each real visit
    const fiveSecondsAgo = new Date(Date.now() - 5 * 1000).toISOString();
    
    let duplicateCheck = false;
    if (user_id) {
      // Check for authenticated user
      const { data: existingView } = await supabase
        .from("character_views")
        .select("id")
        .eq("character_id", character_id)
        .eq("user_id", user_id)
        .gte("viewed_at", fiveSecondsAgo)
        .limit(1);
      
      duplicateCheck = existingView && existingView.length > 0;
      console.log(`🔍 Duplicate check for user ${user_id} on character ${character_id}:`, duplicateCheck ? 'DUPLICATE (within 5 sec)' : 'NEW VIEW');
    } else if (session_id) {
      // Check for anonymous user by session
      const { data: existingView } = await supabase
        .from("character_views")
        .select("id")
        .eq("character_id", character_id)
        .eq("session_id", session_id)
        .gte("viewed_at", fiveSecondsAgo)
        .limit(1);
      
      duplicateCheck = existingView && existingView.length > 0;
      console.log(`🔍 Duplicate check for session ${session_id} on character ${character_id}:`, duplicateCheck ? 'DUPLICATE (within 5 sec)' : 'NEW VIEW');
    }

    // If not a duplicate view, record it
    if (!duplicateCheck) {
      console.log(`✅ Recording new view for character ${character_id}`);
      
      // Insert new view record
      const { error: viewError } = await supabase
        .from("character_views")
        .insert([
          {
            character_id,
            user_id: user_id || null,
            ip_address,
            session_id: session_id || null,
            viewed_at: new Date().toISOString(),
          },
        ]);

      if (viewError) {
        console.error("❌ Error inserting view:", viewError);
        throw viewError;
      }

      // Update aggregated view counts
      await updateViewCounts(character_id);
      console.log(`📊 Updated aggregated counts for character ${character_id}`);
    } else {
      console.log(`⏭️ Skipping duplicate view for character ${character_id}`);
    }

    // Get current view count
    const { data: viewCount } = await supabase
      .from("character_view_counts")
      .select("total_views, unique_views")
      .eq("character_id", character_id)
      .single();

    return res.status(200).json({
      success: true,
      data: {
        character_id,
        total_views: viewCount?.total_views || 0,
        unique_views: viewCount?.unique_views || 0,
        was_counted: !duplicateCheck,
      },
    });
  } catch (error) {
    console.error("Error in trackCharacterView:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to track character view",
      error: error.message,
    });
  }
};

// Update aggregated view counts for a character
const updateViewCounts = async (character_id) => {
  try {
    // Count total views
    const { count: totalViews } = await supabase
      .from("character_views")
      .select("*", { count: "exact", head: true })
      .eq("character_id", character_id);

    // Count unique views (unique user_ids + unique session_ids for anonymous)
    const { data: uniqueUserViews } = await supabase
      .from("character_views")
      .select("user_id")
      .eq("character_id", character_id)
      .not("user_id", "is", null);

    const { data: uniqueSessionViews } = await supabase
      .from("character_views")
      .select("session_id")
      .eq("character_id", character_id)
      .is("user_id", null)
      .not("session_id", "is", null);

    const uniqueUsers = new Set(uniqueUserViews?.map(v => v.user_id) || []);
    const uniqueSessions = new Set(uniqueSessionViews?.map(v => v.session_id) || []);
    const uniqueViews = uniqueUsers.size + uniqueSessions.size;

    // Upsert view counts
    const { error } = await supabase
      .from("character_view_counts")
      .upsert(
        {
          character_id,
          total_views: totalViews || 0,
          unique_views: uniqueViews,
          last_viewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "character_id" }
      );

    if (error) {
      console.error("Error updating view counts:", error);
      throw error;
    }
  } catch (error) {
    console.error("Error in updateViewCounts:", error);
    throw error;
  }
};

// Get character leaderboard ranked by views
export const getCharacterLeaderboard = async (req, res) => {
  try {
    const { limit = 50, type = 'total' } = req.query;
    
    const orderColumn = type === 'unique' ? 'unique_views' : 'total_views';
    
    // Get ranked characters by view count with timeout handling
    const { data: rankedCharacters, error } = await Promise.race([
      supabase
        .from("character_view_counts")
        .select(`
          character_id,
          total_views,
          unique_views,
          last_viewed_at
        `)
        .order(orderColumn, { ascending: false })
        .limit(parseInt(limit)),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]).catch(error => {
      console.error("Error fetching leaderboard:", error.message || error);
      // Return empty array on error for graceful fallback
      return { data: [], error: null };
    });

    if (error) {
      console.error("Leaderboard query error:", error.message || error);
    }

    // Add ranking numbers
    const leaderboard = (rankedCharacters || []).map((character, index) => ({
      ...character,
      rank: index + 1,
    }));

    return res.status(200).json({
      success: true,
      data: {
        leaderboard,
        total_characters: leaderboard.length,
        ranking_type: type,
      },
    });
  } catch (error) {
    console.error("Error in getCharacterLeaderboard:", {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n')[0],
    });
    
    // Return graceful empty response instead of 500 error
    return res.status(200).json({
      success: true,
      data: {
        leaderboard: [],
        total_characters: 0,
        ranking_type: type,
      },
    });
  }
};

// Get view statistics for a specific character
export const getCharacterViewStats = async (req, res) => {
  try {
    const { character_id } = req.params;

    if (!character_id) {
      return res.status(400).json({
        success: false,
        message: "Character ID is required",
      });
    }

    // Get view counts
    const { data: viewStats } = await supabase
      .from("character_view_counts")
      .select("*")
      .eq("character_id", character_id)
      .single();

    // Get recent view activity (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentViews } = await supabase
      .from("character_views")
      .select("viewed_at")
      .eq("character_id", character_id)
      .gte("viewed_at", thirtyDaysAgo)
      .order("viewed_at", { ascending: false });

    // Group views by day for analytics
    const viewsByDay = {};
    recentViews?.forEach(view => {
      const day = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        character_id,
        total_views: viewStats?.total_views || 0,
        unique_views: viewStats?.unique_views || 0,
        last_viewed_at: viewStats?.last_viewed_at,
        recent_views_30d: recentViews?.length || 0,
        daily_breakdown: viewsByDay,
      },
    });
  } catch (error) {
    console.error("Error in getCharacterViewStats:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch character view statistics",
      error: error.message,
    });
  }
};

// Sync views from frontend localStorage (migration helper)
export const syncViewsFromFrontend = async (req, res) => {
  try {
    const { views_data, user_id, session_id } = req.body;

    if (!views_data || typeof views_data !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Valid views data is required",
      });
    }

    const results = [];
    
    // Process each character's view count
    for (const [character_id, view_count] of Object.entries(views_data)) {
      if (typeof view_count === 'number' && view_count > 0) {
        // Create multiple view records to match the count
        // (simplified approach - in production you might want to batch this)
        for (let i = 0; i < Math.min(view_count, 10); i++) { // Limit to prevent abuse
          await supabase
            .from("character_views")
            .insert([
              {
                character_id,
                user_id: user_id || null,
                session_id: session_id || null,
                viewed_at: new Date(Date.now() - (i * 60000)).toISOString(), // Spread over time
              },
            ]);
        }
        
        // Update aggregated counts
        await updateViewCounts(character_id);
        results.push({ character_id, synced_views: Math.min(view_count, 10) });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Views synced successfully",
      data: results,
    });
  } catch (error) {
    console.error("Error in syncViewsFromFrontend:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to sync views",
      error: error.message,
    });
  }
};
