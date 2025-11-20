import { Router } from 'express';
import {
  addQuestionAttempt,
  getQuestionAttemptsByUserId,
  getTotalAttemptSummaryByUserId,
  getQuestionAttemptById
} from '../controllers/attemptController.js';

const router = Router();

router.post('/', addQuestionAttempt);

router.get('/summary/:userId', getTotalAttemptSummaryByUserId);
router.get('/attempt/:attemptId', getQuestionAttemptById);


router.get('/:userId', getQuestionAttemptsByUserId);

export default router;
