import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { findUserByUsernameOrEmail as _findUserByUsernameOrEmail } from "../model/repository.js";
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

export async function handleVerifyToken(req, res) {
  try {
    const verifiedUser = req.user;
    return res.status(200).json({ message: "Token verified", data: verifiedUser });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}
