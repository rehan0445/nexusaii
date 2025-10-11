import { supabase } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";
import { scanBuffer } from "../utils/avScanner.js";

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

    const payload = {
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
      ...(bio !== undefined && { bio }),
      ...(location !== undefined && { location }),
      ...(email !== undefined && { email }),
      ...(phno !== undefined && { phno }),
      ...(profileImage !== undefined && { profileImage }),
      ...(bannerImage !== undefined && { bannerImage }),
      ...(interests !== undefined && { interests }),
    };

    const { data, error } = await supabase
      .from("userProfileData")
      .update(payload)
      .eq("id", uid)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: "Failed to update profile", error: error.message });
    }

    return res.status(200).json({ success: true, message: "Profile updated", data });
  } catch (error) {
    console.error("❌ Error in updateUserProfileJson:", error.message);
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

    // Upload new images if provided
    if (profileImgFile) {
      const fileName = `profile_${uid}_${uuidv4()}.${profileImgFile.originalname.split('.').pop()}`;
      const ext = (profileImgFile.originalname.split('.').pop() || '').toLowerCase();
      const allowed = ['jpg','jpeg','png','gif','webp'];
      if (!allowed.includes(ext)) return res.status(400).json({ success: false, message: 'Invalid file type' });
      const av = await scanBuffer(profileImgFile.buffer, profileImgFile.originalname, profileImgFile.mimetype);
      if (!av.clean) return res.status(400).json({ success: false, message: 'File failed antivirus scan' });
      const { error: uploadErr } = await supabase.storage
        .from("nexus-profile-images")
        .upload(fileName, profileImgFile.buffer, { contentType: profileImgFile.mimetype, upsert: true });
      if (uploadErr) {
        return res.status(500).json({ success: false, message: "Profile image upload failed", error: uploadErr.message });
      }
      const { data: signed } = await supabase.storage.from("nexus-profile-images").createSignedUrl(fileName, 60 * 10);
      profileImageUrl = signed?.signedUrl;
    }

    if (bannerImgFile) {
      const fileName = `banner_${uid}_${uuidv4()}.${bannerImgFile.originalname.split('.').pop()}`;
      const ext = (bannerImgFile.originalname.split('.').pop() || '').toLowerCase();
      const allowed = ['jpg','jpeg','png','gif','webp'];
      if (!allowed.includes(ext)) return res.status(400).json({ success: false, message: 'Invalid file type' });
      const av = await scanBuffer(bannerImgFile.buffer, bannerImgFile.originalname, bannerImgFile.mimetype);
      if (!av.clean) return res.status(400).json({ success: false, message: 'File failed antivirus scan' });
      const { error: uploadErr } = await supabase.storage
        .from("nexus-profile-images")
        .upload(fileName, bannerImgFile.buffer, { contentType: bannerImgFile.mimetype, upsert: true });
      if (uploadErr) {
        return res.status(500).json({ success: false, message: "Banner image upload failed", error: uploadErr.message });
      }
      const { data: signed } = await supabase.storage.from("nexus-profile-images").createSignedUrl(fileName, 60 * 10);
      bannerImageUrl = signed?.signedUrl;
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
