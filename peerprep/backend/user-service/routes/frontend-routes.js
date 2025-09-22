import express from "express";
import { apiEditAccount, apiLogin, apiSignup } from "../controller/frontend-controller.js";
import { verifyAccessToken } from "../middleware/basic-access-control.js";

const router = express.Router();

router.post("/login", apiLogin);
router.post("/signup", apiSignup);
router.patch("/edit-account/:id", verifyAccessToken, apiEditAccount);

export default router;


