import express from "express";

import { 
  joinQueue,
  manualLeaveQueues, 
  matchUsers
 } from "../controllers/queue-controller.js";

const router = express.Router();

router.post("/requests" , joinQueue);

router.delete("/requests" , manualLeaveQueues);

router.delete("/matches" , matchUsers);

export default router;
