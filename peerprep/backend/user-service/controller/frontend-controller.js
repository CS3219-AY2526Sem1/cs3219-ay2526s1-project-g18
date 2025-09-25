import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser as _createUser,
  findUserByEmail as _findUserByEmail,
  findUserById as _findUserById,
  findUserByUsername as _findUserByUsername,
  findUserByUsernameOrEmail as _findUserByUsernameOrEmail,
  updateUserById as _updateUserById,
} from "../model/repository.js";
import { formatUserResponse } from "./user-controller.js";

export async function handleLogin(req, res) {
  try {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) {
      console.error('[401] /api/login -> Wrong credentials (missing usernameOrEmail or password)');
      return res.status(401).json({ message: "Wrong credentials" });
    }

    const user = await _findUserByUsernameOrEmail(usernameOrEmail, usernameOrEmail);
    if (!user) {
      console.error('[401] /api/login -> Incorrect username or email (user not found)');
      return res.status(401).json({ message: "Incorrect username or email" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.error('[401] /api/login -> Incorrect password');
      return res.status(401).json({ message: "Incorrect password" });
    }

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return res.status(200).json({
        message: "User logged in successfully", data: { accessToken, ...formatUserResponse(user) },
      });
  } catch (err) {
    console.error(`[500] /api/login -> ${err?.message || 'Unexpected error'}`);
    return res.status(500).json({ message: err.message || "Unexpected error" });
  }
}

export async function handleSignup(req, res) {
    try {
        const { email, username, password, confirmPassword } = req.body || {};
        const errors = {};
    
        // Duplicate checks
        const existingUser = await _findUserByUsernameOrEmail(username, email);
        if (existingUser) {
          if (existingUser.username === username) {
            errors.username = "This username has been taken. Please choose a different one.";
          }
          if (existingUser.email === email) {
            errors.email = "An account with this email has already been registered.";
          }
        }
    
        // Email validations
        if (!email || email === "") {
          errors.email = "Email is required.";
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            errors.email = "Invalid email format.";
          }
        }
    
        // Username validations
        if (!username || username === "") {
          errors.username = "Username is required.";
        } else {
          const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
          if (!usernameRegex.test(username)) {
            errors.username = "Username should have 3 to 20 characters and should be alphanumeric.";
          }
        }
    
        // Password validations
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
        if (!passwordRegex.test(password || "")) {
          errors.password = "Password requires at least 8 characters with uppercase, lowercase, and numeric digits.";
        }
    
        // Confirm password validations
        if (password !== confirmPassword) {
          errors.confirmPassword = "Password does not match.";
        }
    
        // Early return if any errors found
        if (Object.keys(errors).length > 0) {
          console.error("[400] /api/signup -> Validation/Duplicate errors:", errors);
          return res.status(400).json({ errors });
        }
    
        // Create user
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);
        const createdUser = await _createUser(username, email, hashedPassword);
        const accessToken = jwt.sign({ id: createdUser.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    
        return res.status(201).json({
          message: `Created new user ${username} successfully`,
          data: { accessToken, ...formatUserResponse(createdUser) },
        });
      } catch (err) {
        console.error(`[500] /api/signup -> ${err?.message || "Unknown error when creating new user!"}`);
        return res.status(500).json({ message: err.message || "Unknown error when creating new user!" });
      }
}

export async function updateUser(req, res) {
    try {
      const { username, email, password } = req.body || {};
      const userId = req.params.id;
  
      if (!username && !email && !password) {
        return res.status(400).json({
          message: "No field to update: username, email, and password are all missing!",
        });
      }
  
      if (!isValidObjectId(userId)) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }
  
      const user = await _findUserById(userId);
      if (!user) {
        return res.status(404).json({ message: `User ${userId} not found` });
      }
  
      // Only check duplicates if username or email is provided
      if (username || email) {
        if (username) {
          const existingUsername = await _findUserByUsername(username);
          if (existingUsername && existingUsername.id !== userId) {
            return res.status(409).json({ message: "Username already exists" });
          }
          const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
          if (!usernameRegex.test(username)) {
            return res.status(400).json({
              message: "Username should have 3 to 20 characters and should be alphanumeric.",
            });
          }
        }
  
        if (email) {
          const existingEmail = await _findUserByEmail(email);
          if (existingEmail && existingEmail.id !== userId) {
            return res.status(409).json({ message: "Email already exists" });
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
          }
        }
      }
  
      // Hash password if provided
      let hashedPassword;
      if (password) {
        const salt = bcrypt.genSaltSync(10);
        hashedPassword = bcrypt.hashSync(password, salt);
      }
  
      const finalUsername = username !== undefined ? username : user.username;
      const finalEmail = email !== undefined ? email : user.email;
  
      const updatedUser = await _updateUserById(userId, finalUsername, finalEmail, hashedPassword);
  
      return res.status(200).json({
        message: `Updated data for user ${userId}`,
        data: formatUserResponse(updatedUser),
      });
    } catch (err) {
      console.error(`[500] /api/update-user -> ${err?.message || "Unexpected error"}`);
      return res.status(500).json({ message: err.message || "Unexpected error" });
    }
  }
  


