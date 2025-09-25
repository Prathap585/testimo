import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { signupSchema, loginSchema } from "@shared/schema";
import type { IStorage } from "./storage";

// Enforce JWT secret in production for security
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}
const JWT_SECRET = process.env.JWT_SECRET || "development_secret_change_in_production";
const JWT_EXPIRES_IN = "1h";
const BCRYPT_ROUNDS = 12;

export function createAuthRoutes(storage: IStorage) {
  
  // POST /api/auth/signup
  const signup = async (req: Request, res: Response) => {
    try {
      
      // Validate request body
      const validationResult = signupSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("Signup validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      const { firstName, lastName, email, password } = validationResult.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const userData = {
        firstName,
        lastName,
        email,
        passwordHash,
        subscriptionPlan: "free" as const,
        subscriptionStatus: "active" as const,
      };

      const user = await storage.createUser(userData);
      console.log("User created successfully:", { id: user.id, email: user.email });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return user data (without password) and token
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      res.status(201).json({
        message: "Account created successfully",
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  };

  // POST /api/auth/login
  const login = async (req: Request, res: Response) => {
    try {
      console.log("Login attempt for email:", req.body.email);
      
      // Validate request body
      const validationResult = loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        console.log("Login validation failed:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Invalid request data", 
          errors: validationResult.error.errors 
        });
      }

      const { email, password } = validationResult.data;

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      console.log("Login successful for user:", { id: user.id, email: user.email });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Return user data (without password) and token
      const { passwordHash: _, ...userWithoutPassword } = user;
      
      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  };

  return {
    signup,
    login
  };
}