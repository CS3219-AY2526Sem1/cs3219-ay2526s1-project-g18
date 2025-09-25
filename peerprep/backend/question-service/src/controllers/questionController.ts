import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import type { Question } from '../../generated/prisma/index.js';

const prisma = new PrismaClient()

// Retrieves all questions
export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const questions: Question[] = await prisma.question.findMany({
      where: { published: true },
    });
    
    res.json(questions);
  } catch (error) {
    next(error);
  }
};