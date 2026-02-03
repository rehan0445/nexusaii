import { supabase } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";
import { scanBuffer } from "../utils/avScanner.js";

/**
 * GET /api/v1/profile/:uid - Get display name for user or guest.
 * For guest_xxx returns the name they used in guest session (from guest_sessions).
 * For registered users returns profile from userProfileData.
 * Used so feed and companion can show/store the name they used (guest or user).
 */
export const getProfileOrGuestByUid = async (req, res) => {
  try {
    const uid = req.params?.uid;
    if (!uid || typeof uid !== 'string') {
      return res.status(400).json({ success: false, message: 'uid required' });
    }
    if (uid.startsWith('guest_')) {
      const { data: guestRow, error } = await supabase
        .from('guest_sessions')
        .select('name')
        .eq('session_id', uid)
        .single();
      if (error || !guestRow) {
        return res.status(200).json({
          success: true,
          data: { displayName: 'Guest', username: 'Guest' },
        });
      }
      const name = guestRow.name || 'Guest';
      return res.status(200).json({
        success: true,
        data: { displayName: name, username: name },
      });
    }
    const { data, error } = await supabase
      .from('userProfileData')
      .select('name, username')
      .eq('id', uid)
      .single();
    if (error || !data) {
      return res.status(200).json({
        success: true,
        data: { displayName: null, username: null },
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        displayName: data.name || data.username,
        username: data.username || data.name,
      },
    });
  } catch (err) {
    console.error('getProfileOrGuestByUid error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Server error' });
  }
};

export const getProfileInfo = async (req, res) => {
  const { uid } = req.body;
  const { data, error } = await supabase
    .from("userProfileData")
    .select("*")
    .eq("id", uid);

  if (error) {
    console.error("Error fetching profile data:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Profile Data",
      error: error.message,
    });
  }

  return res.status(200).json({
    success: true,
    data,
  });
};

export const createUserProfile = async (req, res) => {
  try {
    const { uid, name, username, bio, location, email, phno, date_of_birth, gender } = req.body;
    const interests = req.body.interests ? JSON.parse(req.body.interests) : [];

    const profileImgFile = req.files?.profileImg?.[0] || null;
    const bannerImgFile = req.files?.bannerImg?.[0] || null;

    let profileImage =
      "https://i.pinimg.com/736x/d9/7b/bb/d97bbb08017ac2309307f0822e63d082.jpg";
    let bannerImage = "https://via.placeholder.com/800x200";

    // 1️⃣ Upload profile image (JPEG only)
    if (profileImgFile) {
      try {
        console.log("Uploading profile image...");
        const ext = (profileImgFile.originalname.split(".").pop() || '').toLowerCase();
        const allowed = ['jpg','jpeg'];
        if (!allowed.includes(ext)) throw new Error('Only JPEG images are allowed for profile pictures');
        const av = await scanBuffer(profileImgFile.buffer, profileImgFile.originalname, profileImgFile.mimetype);
        if (!av.clean) throw new Error('File failed antivirus scan');
        
        // Always save as .jpg extension
        const profileFileName = `profile_${uid}_${Date.now()}.jpg`;
        const { error: profileUploadError } = await supabase.storage
          .from("nexus-profile-images")
          .upload(profileFileName, profileImgFile.buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (profileUploadError) throw profileUploadError;

        // Get public URL for the uploaded image
        const { data: publicUrl } = supabase.storage
          .from("nexus-profile-images")
          .getPublicUrl(profileFileName);
        profileImage = publicUrl?.publicUrl || profileImage;
      } catch (err) {
        console.error("❌ Profile image upload failed:", err.message);
        return res.status(500).json({
          success: false,
          message: "Profile image upload failed",
          error: err.message,
        });
      }
    }

    // 2️⃣ Upload banner image (JPEG only)
    if (bannerImgFile) {
      try {
        console.log("Uploading banner image...");
        const ext = (bannerImgFile.originalname.split(".").pop() || '').toLowerCase();
        const allowed = ['jpg','jpeg'];
        if (!allowed.includes(ext)) throw new Error('Only JPEG images are allowed for banner images');
        const av = await scanBuffer(bannerImgFile.buffer, bannerImgFile.originalname, bannerImgFile.mimetype);
        if (!av.clean) throw new Error('File failed antivirus scan');
        
        // Always save as .jpg extension
        const bannerFileName = `banner_${uid}_${Date.now()}.jpg`;
        const { error: bannerUploadError } = await supabase.storage
          .from("nexus-profile-images")
          .upload(bannerFileName, bannerImgFile.buffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (bannerUploadError) throw bannerUploadError;

        // Get public URL for the uploaded image
        const { data: publicUrl } = supabase.storage
          .from("nexus-profile-images")
          .getPublicUrl(bannerFileName);
        bannerImage = publicUrl?.publicUrl || bannerImage;
      } catch (err) {
        console.error("❌ Banner image upload failed:", err.message);
        return res.status(500).json({
          success: false,
          message: "Banner image upload failed",
          error: err.message,
        });
      }
    }

    // 3️⃣ Create user_stats
    console.log("Inserting into user_stats...");
    const { data: statsData, error: statsError } = await supabase
      .from("user_stats")
      .insert([
        {
          user_id: uid,
          posts: 0,
          following: 0,
          followers: 0,
          numofchar: 0,
        },
      ])
      .select()
      .single();

    if (statsError) {
      console.error("❌ Error inserting user_stats:", statsError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to create user stats",
        error: statsError.message,
      });
    }

    // 4️⃣ Insert into userProfileData
    const currentDate = new Date().toISOString();
    console.log("Inserting into userProfileData...");

    const { data: profileData, error: profileError } = await supabase
      .from("userProfileData")
      .insert([
        {
          id: uid,
          name: name || "",
          username,
          bio: bio || "",
          location: location || "",
          email,
          phno: phno || null,
          profileImage,
          bannerImage,
          creationDate: currentDate,
          streak: "0",
          interests,
          stats_id: statsData.id,
          date_of_birth: date_of_birth || null,
          gender: gender || null,
        },
      ])
      .select()
      .single();

    if (profileError) {
      console.error(
        "❌ Error inserting userProfileData:",
        profileError.message
      );

      // Rollback user_stats if profile fails
      await supabase.from("user_stats").delete().eq("id", statsData.id);

      return res.status(500).json({
        success: false,
        message: "Failed to create user profile",
        error: profileError.message,
      });
    }

    console.log("✅ Profile created successfully!");
    return res.status(201).json({
      success: true,
      message: "User profile created successfully",
      data: {
        profile: profileData,
        stats: statsData,
      },
    });
  } catch (error) {
    console.error(
      "❌ Error in createUserProfile (outer catch):",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

// Simple JSON-based update endpoint (no image upload required)
export const updateUserProfileJson = async (req, res) => {
  try {
    const { uid, name, username, bio, location, email, phno, profileImage, bannerImage, interests } = req.body;

    if (!uid) {
      return res.status(400).json({ success: false, message: "uid is required" });
    }

    // Username uniqueness check: another user with same username
    if (username) {
      const { data: existing, error: existError } = await supabase
        .from("userProfileData")
        .select("id, username")
        .eq("username", username)
        .neq("id", uid)
        .maybeSingle();

      if (existError) {
        console.error("❌ Username check error:", existError);
        return res.status(500).json({ success: false, message: "Username check failed", error: existError.message });
      }
      if (existing) {
        return res.status(409).json({ success: false, message: "Username already taken" });
      }
    }

    // Prepare payload - handle interests as array or string
    let processedInterests = interests;
    if (interests !== undefined) {
      if (typeof interests === 'string') {
        try {
          processedInterests = JSON.parse(interests);
        } catch (e) {
          // If it's not valid JSON, treat as array
          processedInterests = Array.isArray(interests) ? interests : [interests];
        }
      }
    }

    const payload = {
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(email !== undefined && { email }),
      ...(phno !== undefined && { phno }),
      ...(profileImage !== undefined && { profileImage }),
      ...(bannerImage !== undefined && { bannerImage }),
      ...(processedInterests !== undefined && { interests: processedInterests }),
    };

    console.log("📝 Updating profile for uid:", uid, "Payload:", { ...payload, interests: processedInterests });

    const { data, error } = await supabase
      .from("userProfileData")
      .update(payload)
      .eq("id", uid)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", error);
      return res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
    }

    if (!data) {
      console.error("❌ No data returned from update");
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    console.log("✅ Profile updated successfully:", data.id);
    return res.status(200).json({ success: true, message: "Profile updated", data });
  } catch (error) {
    console.error("❌ Error in updateUserProfileJson:", error);
    return res.status(500).json({ success: false, message: "Unexpected error", error: error.message });
  }
};

// Multipart (files) update with username uniqueness validation
export const updateUserProfile = async (req, res) => {
  try {
    const { uid, name, username, bio, location, email, phno } = req.body;
    const interests = req.body.interests ? JSON.parse(req.body.interests) : undefined;

    if (!uid) {
      return res.status(400).json({ success: false, message: "uid is required" });
    }

    // Username uniqueness: another user with same username
    if (username) {
      const { data: existing, error: existError } = await supabase
        .from("userProfileData")
        .select("id, username")
        .eq("username", username)
        .neq("id", uid)
        .maybeSingle();

      if (existError) {
        return res.status(500).json({ success: false, message: "Username check failed", error: existError.message });
      }
      if (existing) {
        return res.status(409).json({ success: false, message: "Username already taken" });
      }
    }

    const profileImgFile = req.files?.profileImg?.[0] || null;
    const bannerImgFile = req.files?.bannerImg?.[0] || null;

    let profileImageUrl;
    let bannerImageUrl;

    // Upload new images if provided - always save as .jpg
    if (profileImgFile) {
      const ext = (profileImgFile.originalname.split('.').pop() || '').toLowerCase();
      const allowed = ['jpg','jpeg','png','gif','webp'];
      if (!allowed.includes(ext)) return res.status(400).json({ success: false, message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
      const av = await scanBuffer(profileImgFile.buffer, profileImgFile.originalname, profileImgFile.mimetype);
      if (!av.clean) return res.status(400).json({ success: false, message: 'File failed antivirus scan' });
      
      // Always save as .jpg extension
      const fileName = `profile_${uid}_${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("nexus-profile-images")
        .upload(fileName, profileImgFile.buffer, { 
          contentType: 'image/jpeg', 
          upsert: true 
        });
      if (uploadErr) {
        return res.status(500).json({ success: false, message: "Profile image upload failed", error: uploadErr.message });
      }
      
      // Get public URL (using public bucket)
      const { data: publicUrlData } = supabase.storage
        .from("nexus-profile-images")
        .getPublicUrl(fileName);
      profileImageUrl = publicUrlData?.publicUrl;
    }

    if (bannerImgFile) {
      const ext = (bannerImgFile.originalname.split('.').pop() || '').toLowerCase();
      const allowed = ['jpg','jpeg','png','gif','webp'];
      if (!allowed.includes(ext)) return res.status(400).json({ success: false, message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' });
      const av = await scanBuffer(bannerImgFile.buffer, bannerImgFile.originalname, bannerImgFile.mimetype);
      if (!av.clean) return res.status(400).json({ success: false, message: 'File failed antivirus scan' });
      
      // Always save as .jpg extension
      const fileName = `banner_${uid}_${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("nexus-profile-images")
        .upload(fileName, bannerImgFile.buffer, { 
          contentType: 'image/jpeg', 
          upsert: true 
        });
      if (uploadErr) {
        return res.status(500).json({ success: false, message: "Banner image upload failed", error: uploadErr.message });
      }
      
      // Get public URL (using public bucket)
      const { data: publicUrlData } = supabase.storage
        .from("nexus-profile-images")
        .getPublicUrl(fileName);
      bannerImageUrl = publicUrlData?.publicUrl;
    }

    const updatePayload = {
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(email !== undefined && { email }),
      ...(phno !== undefined && { phno }),
      ...(interests !== undefined && { interests }),
      ...(profileImageUrl && { profileImage: profileImageUrl }),
      ...(bannerImageUrl && { bannerImage: bannerImageUrl }),
    };

    const { data: updated, error } = await supabase
      .from("userProfileData")
      .update(updatePayload)
      .eq("id", uid)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
    }

    return res.status(200).json({ success: true, message: "Profile updated", data: updated });
  } catch (error) {
    console.error("❌ Error in updateUserProfile:", error.message);
    return res.status(500).json({ success: false, message: "Unexpected error", error: error.message });
  }
};
