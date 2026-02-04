import { supabase } from '../config/supabase.js';

/**
 * Create a new guest session
 * POST /api/guest/create-session
 */
export const createGuestSession = async (req, res) => {
  try {
    const { name, age, gender, sessionId } = req.body;

    // Validation
    if (!name || !age || !gender || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Name, age, gender, and sessionId are required'
      });
    }

    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 64) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 64 characters'
      });
    }

    if (typeof age !== 'number' || age < 18 || age > 100) {
      return res.status(400).json({
        success: false,
        message: 'You must be 18 to 100 years old to use this app'
      });
    }

    if (!['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gender value'
      });
    }

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('guest_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: 'Guest session already exists',
        data: existingSession
      });
    }

    // Create session: 18-100 gets full access (1 year expiry). Stored in guest_sessions.
    const sessionStartTimestamp = new Date().toISOString();
    const oneYearMs = 365 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + oneYearMs).toISOString();

    const insertPayload = {
      name: name.trim(),
      age,
      gender,
      session_id: sessionId,
      session_start_timestamp: sessionStartTimestamp,
      expires_at: expiresAt,
      is_registered: false,
      full_access: true
    };

    let result = await supabase
      .from('guest_sessions')
      .insert(insertPayload)
      .select()
      .single();

    if (result.error) {
      const fallback = await supabase
        .from('guest_sessions')
        .insert({
          name: name.trim(),
          age,
          gender,
          session_id: sessionId,
          session_start_timestamp: sessionStartTimestamp,
          expires_at: expiresAt,
          is_registered: false
        })
        .select()
        .single();
      if (!fallback.error) result = fallback;
    }

    const { data, error } = result;
    if (error) {
      console.error('Error creating guest session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create guest session',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Welcome! You have full access.',
      data: { ...data, full_access: true }
    });
  } catch (error) {
    console.error('Error in createGuestSession:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get guest session by sessionId
 * GET /api/guest/session/:sessionId
 */
export const getGuestSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const { data, error } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          message: 'Guest session not found'
        });
      }
      console.error('Error fetching guest session:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch guest session',
        error: error.message
      });
    }

    // Check if session has expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    if (now > expiresAt && !data.is_registered) {
      return res.status(410).json({
        success: false,
        message: 'Guest session has expired',
        data: { ...data, expired: true }
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error in getGuestSession:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Migrate guest session to registered user
 * POST /api/guest/migrate-to-user
 */
export const migrateGuestToUser = async (req, res) => {
  try {
    const { sessionId, userId } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID and User ID are required'
      });
    }

    // Get guest session
    const { data: guestSession, error: fetchError } = await supabase
      .from('guest_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (fetchError || !guestSession) {
      return res.status(404).json({
        success: false,
        message: 'Guest session not found'
      });
    }

    if (guestSession.is_registered) {
      return res.status(400).json({
        success: false,
        message: 'Guest session already migrated'
      });
    }

    // Update guest session to mark as registered
    const { data: updatedSession, error: updateError } = await supabase
      .from('guest_sessions')
      .update({
        is_registered: true,
        registered_user_id: userId,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating guest session:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to migrate guest session',
        error: updateError.message
      });
    }

    // Optionally, update user profile with guest session data
    // This can be done if you want to preserve the guest's name, age, gender
    // in the user profile

    res.json({
      success: true,
      message: 'Guest session migrated successfully',
      data: updatedSession
    });
  } catch (error) {
    console.error('Error in migrateGuestToUser:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Check if guest session is still valid
 * GET /api/guest/check-session/:sessionId
 */
export const checkGuestSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const { data, error } = await supabase
      .from('guest_sessions')
      .select('id, session_start_timestamp, expires_at, is_registered')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Guest session not found',
        valid: false
      });
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    const isValid = now <= expiresAt && !data.is_registered;

    res.json({
      success: true,
      valid: isValid,
      expired: now > expiresAt,
      isRegistered: data.is_registered,
      expiresAt: data.expires_at
    });
  } catch (error) {
    console.error('Error in checkGuestSession:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

