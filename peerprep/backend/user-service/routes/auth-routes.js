import express from "express";

import { handleLogin, handleSignup, handleVerifyToken } from "../controller/auth-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";

const router = express.Router();

router.post("/login", handleLogin);
router.post("/signup", handleSignup);
router.get("/verify-token", verifyAccessToken, handleVerifyToken);

export default router;
