const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true }); // CORS enabled
admin.initializeApp();

exports.createUserByAdmin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }
    try {
      const { name, email, password, role, class: className, userId, schoolId } = req.body;
      if (!email || !password || !role || !schoolId) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({ email, password });
      // Add user to Firestore
      await admin.firestore().collection("users").doc(userRecord.uid).set({
        name,
        email,
        role,
        class: className,
        userId,
        schoolId,
        status: "active",
        joinDate: new Date().toISOString().slice(0, 10),
      });
      return res.status(200).json({ success: true, uid: userRecord.uid });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });
});


exports.sendPasswordResetEmail = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Missing email" });
      }
      // Generate password reset link
      const link = await admin.auth().generatePasswordResetLink(email);
      // Optionally: Send the link via your own email service, or just return it
      // For now, just return the link (the user will receive the official Firebase email as well)
      return res.status(200).json({ success: true, link });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });
});

exports.adminSetUserPassword = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
      }
      try {
        const { email, password } = req.body;
        if (!email || !password) {
          return res.status(400).json({ error: "Missing email or password" });
        }
        // Get user by email
        const userRecord = await admin.auth().getUserByEmail(email);
        // Set new password
        await admin.auth().updateUser(userRecord.uid, { password });
        return res.status(200).json({ success: true });
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    });
  });

exports.deleteUsersByAdmin = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }
    try {
      const { userIds } = req.body;
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: "userIds must be an array" });
      }
      const results = [];
      for (const uid of userIds) {
        try {
          await admin.auth().deleteUser(uid);
          results.push({ uid, status: "deleted" });
        } catch (e) {
          results.push({ uid, status: "error", error: e.message });
        }
      }
      return res.status(200).json({ success: true, results });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });
});