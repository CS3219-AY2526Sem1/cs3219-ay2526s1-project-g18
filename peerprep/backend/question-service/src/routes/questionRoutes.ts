import { Router } from 'express';
import {
  getQuestions,
  createQuestion,
  updateQuestion,
  getQuestionTopics,
  getQuestionDifficulties
} from '../controllers/questionController.ts';

const router = Router();

router.get('/', getQuestions);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);

router.get('/topic', getQuestionTopics);
router.get('/difficulty', getQuestionDifficulties);

export default router;
