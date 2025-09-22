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

export async function apiLogin(req, res) {
  try {
    const { usernameOrEmail, password } = req.body || {};
    if (!usernameOrEmail || !password) {
      console.error('[401] /api/login -> Wrong credentials (missing usernameOrEmail or password)');
      return res.status(401).json({ message: "Wrong credentials" });
    }

    const user = await _findUserByUsernameOrEmail(usernameOrEmail, usernameOrEmail);
    if (!user) {
      console.error('[401] /api/login -> Wrong credentials (user not found)');
      return res.status(401).json({ message: "Wrong credentials" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.error('[401] /api/login -> Wrong credentials (password mismatch)');
      return res.status(401).json({ message: "Wrong credentials" });
    }

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return res.status(200).json({ data: { accessToken, ...formatUserResponse(user) } });
  } catch (err) {
    console.error(`[500] /api/login -> ${err?.message || 'Unexpected error'}`);
    return res.status(500).json({ message: err.message || "Unexpected error" });
  }
}

export async function apiSignup(req, res) {
  try {
    const { email, username, password, confirmPassword } = req.body || {};
    const errors = {};

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

    // Early return if format validations failed
    if (Object.keys(errors).length > 0) {
      console.error('[400] /api/signup -> Validation errors:', errors);
      return res.status(400).json({ errors });
    }

    // Duplicate checks
    const existingByUsernameOrEmail = await _findUserByUsernameOrEmail(username, email);
    if (existingByUsernameOrEmail) {
      if (existingByUsernameOrEmail.username === username) {
        errors.username = "This username has been taken. Please choose a different one.";
      }
      if (existingByUsernameOrEmail.email === email) {
        errors.email = "An account with this email has already been registered.";
      }
      if (Object.keys(errors).length > 0) {
        console.error('[400] /api/signup -> Duplicate errors:', errors);
        return res.status(400).json({ errors });
      }
    }

    // Create user
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const createdUser = await _createUser(username, email, hashedPassword);
    const accessToken = jwt.sign({ id: createdUser.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    return res.status(200).json({ data: { accessToken, ...formatUserResponse(createdUser) } });
  } catch (err) {
    console.error(`[500] /api/signup -> ${err?.message || 'Unexpected error'}`);
    return res.status(500).json({ message: err.message || "Unexpected error" });
  }
}

export async function apiEditAccount(req, res) {
  try {
    const userId = req.params.id;
    const { email, username } = req.body || {};
    const errors = {};

    const user = await _findUserById(userId);
    if (!user) {
      console.error('[500] /api/edit-account -> User not found during update');
      return res.status(500).json({ message: "Unexpected error" });
    }

    // Require at least one field; if both empty strings, surface required on both
    if ((email === undefined || email === "") && (username === undefined || username === "")) {
      errors.email = "Email is required.";
      errors.username = "Username is required.";
    }

    // Email validations (if provided)
    if (email !== undefined) {
      if (email === "") {
        errors.email = "Email is required.";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.email = "Invalid email format.";
        }
      }
    }

    // Username validations (if provided)
    if (username !== undefined) {
      if (username === "") {
        errors.username = "Username is required.";
      } else {
        const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
        if (!usernameRegex.test(username)) {
          errors.username = "Username should have 3 to 20 characters and should be alphanumeric.";
        }
      }
    }

    // Early return if format validations failed
    if (Object.keys(errors).length > 0) {
      console.error('[400] /api/edit-account -> Validation errors:', errors);
      return res.status(400).json({ errors });
    }

    // Duplicates (exclude self)
    if (email !== undefined && email !== user.email) {
      const existingEmail = await _findUserByEmail(email);
      if (existingEmail && existingEmail.id !== userId) {
        errors.email = "An account with this email has already been registered.";
      }
    }
    if (username !== undefined && username !== user.username) {
      const existingUsername = await _findUserByUsername(username);
      if (existingUsername && existingUsername.id !== userId) {
        errors.username = "This username has been taken. Please choose a different one.";
      }
    }
    if (Object.keys(errors).length > 0) {
      console.error('[400] /api/edit-account -> Duplicate errors:', errors);
      return res.status(400).json({ errors });
    }

    const finalEmail = email !== undefined ? email : user.email;
    const finalUsername = username !== undefined ? username : user.username;
    const updatedUser = await _updateUserById(userId, finalUsername, finalEmail, undefined);
    return res.status(200).json({ data: formatUserResponse(updatedUser) });
  } catch (err) {
    console.error(`[500] /api/edit-account -> ${err?.message || 'Unexpected error'}`);
    return res.status(500).json({ message: err.message || "Unexpected error" });
  }
}


