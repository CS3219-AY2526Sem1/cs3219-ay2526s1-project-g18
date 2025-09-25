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

export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, difficulty, topics, published } = req.body;
    const newQuestion: Question = await prisma.question.create({
      data: { title, description, difficulty, topics, published },
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    next(error);
  }
}

export const updateQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, description, difficulty, topics, published } = req.body;

    const updatedQuestion: Question | null = await prisma.question.update({
      where: { id: Number(id) },
      data: { title, description, difficulty, topics, published },
    });

    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json(updatedQuestion);
  } catch (error) {
    next(error);
  }
}