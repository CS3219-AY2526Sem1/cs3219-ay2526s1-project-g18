import express from "express";

import { 
  joinQueue,
  leaveQueue, 
  matchUsers
 } from "../controllers/queue-controller.js";

const router = express.Router();

router.post("/requests" , joinQueue);

router.delete("/requests" , leaveQueue);

router.delete("/matches" , matchUsers);

export default router;
