import express from "express";
import { updateUser, handleSignup, handleLogin } from "../controller/frontend-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";

const router = express.Router();

router.post("/login", handleLogin);
router.post("/signup", handleSignup);
router.patch("/edit-account/:id", verifyAccessToken, updateUser);

export default router;


