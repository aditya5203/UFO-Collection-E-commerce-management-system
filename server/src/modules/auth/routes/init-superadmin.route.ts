import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import { User } from "../../../models/User.model";
import { config } from "../../../config";
import { AppError } from "../../../middleware/error.middleware";

const router = Router();

/**
 * Create FIRST superadmin in the system.
 * Can only be executed when NO superadmin exists.
 */
router.post("/", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new AppError("Email, password, and name are required", 400);
    }

    // Check if any superadmin already exists
    const superAdminExists = await User.findOne({ role: "superadmin" });
    if (superAdminExists) {
      return res.status(409).json({
        success: false,
        message: "Superadmin already exists",
      });
    }

    // Check if this email is already used by any user
    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create the superadmin user
    const admin = await User.create({
      email: email.toLowerCase(),
      name,
      password: hashed,
      role: "superadmin",
      provider: "credentials",
    });

    // Generate JWT (matching your service JWT structure)
    const token = jwt.sign(
      {
        userId: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      },
      config.jwt.secret as Secret, // 👈 cast so TS is happy
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    return res.status(201).json({
      success: true,
      message: "Superadmin initialized successfully",
      token,
      user: admin.toJSON(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
