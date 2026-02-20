// server/src/modules/auth/routes/auth.routes.ts
import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import {
  customerAuthMiddleware,
  adminAuthMiddleware,
} from "../middleware/auth.middleware";
import passport from "../../../config/passport";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication & profile APIs
 */

/* =========================================================
 * Register
 * =======================================================*/

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account (also sends a Welcome email after successful registration)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               name:
 *                 type: string
 *                 example: John Doe
 *               address:
 *                 type: string
 *                 example: 123 Main St, City, State
 *               height:
 *                 type: number
 *                 example: 5.6
 *                 description: Height in feet (e.g. 5.6 ≈ 5 ft 7 in)
 *               weight:
 *                 type: number
 *                 example: 65
 *                 description: Weight in kilograms
 *     responses:
 *       201:
 *         description: User successfully registered (welcome email is sent)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", authController.register);

/* =========================================================
 * Customer Login
 * =======================================================*/

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user and return JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", authController.login);

/* =========================================================
 * Forgot / Reset Password
 * =======================================================*/

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Sends password reset link to email (always returns success to prevent user enumeration)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Reset link sent (if user exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: If that email exists, a reset link has been sent
 */
router.post("/forgot-password", authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Resets password using token from reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *                 example: 9c4f5d...
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/reset-password", authController.resetPassword);

/* =========================================================
 * Google (App-side upsert) + OAuth flow
 * =======================================================*/

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login or register with Google
 *     description: Upsert user using Google account data and return JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, name, providerId]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@gmail.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               providerId:
 *                 type: string
 *                 example: 112233445566778899000
 *               avatar:
 *                 type: string
 *                 format: uri
 *                 example: https://lh3.googleusercontent.com/a-/AOh14Gj...
 *     responses:
 *       200:
 *         description: Login with Google successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login with Google successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid Google user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already used for password login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/google", authController.googleLogin);

/**
 * @swagger
 * /api/auth/google/oauth:
 *   get:
 *     summary: Start Google OAuth login
 *     description: Redirects to Google for authentication
 *     tags: [Auth]
 */
router.get(
  "/google/oauth",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: Google redirects here after login; backend logs user in, sets cookie, then redirects to frontend
 *     tags: [Auth]
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: process.env.CLIENT_BASE_URL || "http://localhost:3000/login",
  }),
  authController.googleCallback
);

/* =========================================================
 * Customer Logout + Session
 * =======================================================*/

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout customer
 *     description: Logout the currently authenticated customer (clears ONLY customer cookie/token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/logout", customerAuthMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current customer
 *     description: Get the currently authenticated customer's information (including size recommendations)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/me", customerAuthMiddleware, authController.getMe);

/* =========================================================
 * Delete Account (Customer) ✅ NEW
 * =======================================================*/

/**
 * @swagger
 * /api/auth/account:
 *   delete:
 *     summary: Delete customer account (soft delete)
 *     description: Soft delete the currently authenticated customer account (marks isDeleted=true, anonymizes email, clears customer cookie)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden (admin/superadmin cannot delete from customer portal)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/account", customerAuthMiddleware, authController.deleteMyAccount);

/* =========================================================
 * Superadmin init + Admin auth
 * =======================================================*/

/**
 * @swagger
 * /api/auth/init-superadmin:
 *   post:
 *     summary: Initialize superadmin
 *     description: Create the first superadmin user. Can only be called if no superadmin exists.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: superadmin@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: superadmin123
 *               name:
 *                 type: string
 *                 example: Super Admin
 *     responses:
 *       201:
 *         description: Superadmin initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Superadmin initialized successfully
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Superadmin already exists or email is taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/init-superadmin", authController.initSuperAdmin);

/**
 * @swagger
 * /api/auth/admin/login:
 *   post:
 *     summary: Admin & Superadmin login
 *     description: Authenticate an admin-level user (role = admin or superadmin) and return JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@ufo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Admin login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid admin credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not admin/superadmin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/admin/login", authController.adminLogin);

/**
 * @swagger
 * /api/auth/admin/logout:
 *   post:
 *     summary: Logout admin/superadmin
 *     description: Logout the currently authenticated admin (clears ONLY admin cookie/token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is not admin/superadmin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/admin/logout", adminAuthMiddleware, authController.adminLogout);

/* =========================================================
 * Profile (Customer)
 * =======================================================*/

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Update current customer profile
 *     description: Update name, address, height and weight. This will also recompute recommended clothing sizes.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               address:
 *                 type: string
 *                 example: 123 Main St, City, State
 *               height:
 *                 type: number
 *                 example: 5.6
 *                 description: Height in feet
 *               weight:
 *                 type: number
 *                 example: 65
 *                 description: Weight in kilograms
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/profile", customerAuthMiddleware, authController.updateProfile);

export default router;
