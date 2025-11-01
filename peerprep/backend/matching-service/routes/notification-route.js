import express from "express";

import { registerSSEClient } from "../controllers/notification-controller.js";

const router = express.Router();

router.get("/notifications" , registerSSEClient);

export default router;