import { Router } from 'express';
import {
  getQuestions
} from '../controllers/questionController.ts';

const router = Router();

router.get('/', getQuestions);

export default router;
