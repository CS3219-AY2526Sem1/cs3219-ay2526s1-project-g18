import { Router } from 'express';
import {
  getQuestions,
  createQuestion,
  updateQuestion
} from '../controllers/questionController.ts';

const router = Router();

router.get('/', getQuestions);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);

export default router;
