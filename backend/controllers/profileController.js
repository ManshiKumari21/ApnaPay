const db = require("../config/db");

// Fallback demo user ID
const USER_ID = 1;

// Auto-seed demo user 1 if not present
async function ensureDefaultUser() {
    try {
        const [users] = await db.execute("SELECT id FROM users WHERE id = ?", [USER_ID]);
        if (users.length === 0) {
            await db.execute(`
                INSERT INTO users (id, full_name, email, phone, status, password_hash)
                VALUES (1, 'Rahul Sharma', 'rahul.sharma@apnapay.com', '9876543210', 'active', 'dummy_hash')
                ON DUPLICATE KEY UPDATE status = 'active'
            `);
            await db.execute(`
                INSERT INTO user_profiles (user_id, date_of_birth, address, city, state, postal_code, profile_image_url)
                VALUES (1, '1995-08-15', 'Flat 402, Sunshine Heights, MG Road', 'Mumbai', 'Maharashtra', '400001', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80')
                ON DUPLICATE KEY UPDATE city = 'Mumbai'
            `);
            console.log("Demo user 1 ensured.");
        }
    } catch (err) {
        // silent fallback
    }
}
ensureDefaultUser();

// =================================
// GET USER PROFILE
// =================================
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || req.query.userId || USER_ID;
        const [users] = await db.execute(
            `SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.status,
                u.email_verified_at,
                u.phone_verified_at,
                u.created_at,
                u.updated_at,
                p.date_of_birth,
                p.address,
                p.city,
                p.state,
                p.postal_code,
                p.profile_image_url
            FROM users u
            LEFT JOIN user_profiles p
                ON u.id = p.user_id
            WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            user: users[0]
        });

    } catch (error) {
        console.error("Get Profile Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// =================================
// UPDATE USER PROFILE
// =================================
exports.updateProfile = async (req, res) => {
    let connection;

    try {
        const userId = req.user?.userId || req.user?.id || req.body.userId || USER_ID;
        const {
            full_name,
            email,
            phone,
            date_of_birth,
            address,
            city,
            state,
            postal_code,
            profile_image_url
        } = req.body;

        // Allowed fields for users table
        const userFields = {
            full_name,
            email,
            phone
        };

        // Allowed fields for user_profiles table
        const profileFields = {
            date_of_birth,
            address,
            city,
            state,
            postal_code,
            profile_image_url
        };

        const userUpdates = [];
        const userValues = [];

        const profileUpdates = [];
        const profileValues = [];

        // Validate full name
        if (full_name !== undefined) {
            if (
                typeof full_name !== "string" ||
                full_name.trim().length < 2
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Full name must contain at least 2 characters"
                });
            }
            userUpdates.push("full_name = ?");
            userValues.push(full_name.trim());
        }

        // Validate email
        if (email !== undefined) {
            if (
                typeof email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid email"
                });
            }
            userUpdates.push("email = ?");
            userValues.push(email.trim());
        }

        // Validate phone
        if (phone !== undefined) {
            if (
                typeof phone !== "string" ||
                !/^\+?[0-9]{10,15}$/.test(phone.trim())
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid phone number"
                });
            }
            userUpdates.push("phone = ?");
            userValues.push(phone.trim());
        }

        if (date_of_birth !== undefined) {
            if (date_of_birth === "" || date_of_birth === null) {
                profileUpdates.push("date_of_birth = ?");
                profileValues.push(null);
            } else {
                const dobPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
                const match = date_of_birth.match(dobPattern);

                if (!match) {
                    return res.status(400).json({
                        success: false,
                        message: "Date must be in YYYY-MM-DD format"
                    });
                }

                const year = Number(match[1]);
                const month = Number(match[2]);
                const day = Number(match[3]);

                const dob = new Date(Date.UTC(year, month - 1, day));
                const today = new Date();

                const validDate =
                    dob.getUTCFullYear() === year &&
                    dob.getUTCMonth() === month - 1 &&
                    dob.getUTCDate() === day;

                const todayUTC = Date.UTC(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate()
                );

                if (!validDate || dob.getTime() > todayUTC) {
                    return res.status(400).json({
                        success: false,
                        message: "Please enter a valid date of birth"
                    });
                }

                profileUpdates.push("date_of_birth = ?");
                profileValues.push(date_of_birth);
            }
        }

        // Other profile fields
        for (const [field, value] of Object.entries(profileFields)) {
            if (
                field !== "date_of_birth" &&
                value !== undefined
            ) {
                if (
                    value !== null &&
                    typeof value !== "string"
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be text`
                    });
                }

                let finalValue = value;

                if (typeof value === "string") {
                    finalValue = value.trim() || null;
                }

                // Validate profile image URL
                if (
                    field === "profile_image_url" &&
                    finalValue !== null
                ) {
                    try {
                        const imageUrl = new URL(finalValue);

                        if (
                            !["http:", "https:"].includes(imageUrl.protocol)
                        ) {
                            throw new Error("Invalid URL");
                        }
                    } catch {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid profile image URL"
                        });
                    }
                }

                profileUpdates.push(`${field} = ?`);
                profileValues.push(finalValue);
            }
        }

        if (
            userUpdates.length === 0 &&
            profileUpdates.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide at least one field to update"
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check user exists
        const [existingUsers] = await connection.execute(
            "SELECT id FROM users WHERE id = ?",
            [userId]
        );

        if (existingUsers.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update users table
        if (userUpdates.length > 0) {
            await connection.execute(
                `UPDATE users
                 SET ${userUpdates.join(", ")}
                 WHERE id = ?`,
                [...userValues, userId]
            );
        }

        // Insert or update user_profiles table
        if (profileUpdates.length > 0) {
            const columns = profileUpdates.map(
                item => item.split(" = ")[0]
            );

            const placeholders = columns.map(() => "?");

            const updateParts = columns.map(
                column => `${column} = VALUES(${column})`
            );

            await connection.execute(
                `INSERT INTO user_profiles
                    (user_id, ${columns.join(", ")})
                 VALUES
                    (?, ${placeholders.join(", ")})
                 ON DUPLICATE KEY UPDATE
                    ${updateParts.join(", ")}`,
                [userId, ...profileValues]
            );
        }

        await connection.commit();

        // Fetch updated profile
        const [updatedUsers] = await db.execute(
            `SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.status,
                u.email_verified_at,
                u.phone_verified_at,
                u.created_at,
                u.updated_at,
                p.date_of_birth,
                p.address,
                p.city,
                p.state,
                p.postal_code,
                p.profile_image_url
            FROM users u
            LEFT JOIN user_profiles p
                ON u.id = p.user_id
            WHERE u.id = ?`,
            [userId]
        );

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUsers[0]
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Update Profile Error:", error.message);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Email or phone number already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// =================================
// 3. GET ALL USERS (LIST & SEARCH)
// =================================
exports.getAllUsers = async (req, res) => {
    try {
        await ensureDefaultUser();
        const { search, status } = req.query;

        let sql = `
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.status,
                u.email_verified_at,
                u.phone_verified_at,
                u.created_at,
                p.date_of_birth,
                p.address,
                p.city,
                p.state,
                p.postal_code,
                p.profile_image_url
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE 1=1
        `;

        const values = [];

        if (status && status !== 'all') {
            sql += " AND u.status = ?";
            values.push(status);
        }

        if (search) {
            sql += " AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)";
            const s = `%${search.trim()}%`;
            values.push(s, s, s);
        }

        sql += " ORDER BY u.id DESC";

        const [users] = await db.execute(sql, values);

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("Get All Users Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// =================================
// 4. UPDATE USER STATUS (BLOCK/ACTIVATE)
// =================================
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["active", "blocked", "suspended"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status must be active, blocked, or suspended"
            });
        }

        const [result] = await db.execute(
            "UPDATE users SET status = ? WHERE id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `User status updated to ${status}`
        });

    } catch (error) {
        console.error("Update User Status Error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
