import type { Request, Response, NextFunction } from 'express';
import { PrismaClient, QuestionTopic, QuestionDifficulty } from '@prisma/client';
import type { Question } from '@prisma/client';

const prisma = new PrismaClient()

// Retrieves all questions with optional topic and difficulty filtering
export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topic, difficulty, limit } = req.query;
    
    // Build dynamic SQL query with proper NULL handling
    let sqlQuery = `
      SELECT * FROM "Question" 
      WHERE published = true
    `;
    
    // Add difficulty filter if provided
    if (difficulty && typeof difficulty === 'string') {
      const difficultyValue = difficulty.toUpperCase();
      if (Object.values(QuestionDifficulty).includes(difficultyValue as QuestionDifficulty)) {
        sqlQuery += ` AND difficulty = '${difficultyValue}'::"QuestionDifficulty"`;
      }
    }
    
    // Add topic filter if provided  
    if (topic && typeof topic === 'string') {
      const topicValue = topic.toUpperCase();
      if (Object.values(QuestionTopic).includes(topicValue as QuestionTopic)) {
        sqlQuery += ` AND topics @> ARRAY['${topicValue}']::"QuestionTopic"[]`;
      }
    }
    
    sqlQuery += ` ORDER BY RANDOM() LIMIT ${limit ? Number(limit) : 10}`;
    
    const questions = await prisma.$queryRawUnsafe(sqlQuery)
    
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

export const getQuestionTopics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const topics = Object.values(QuestionTopic);
    res.json(topics);
  } catch (error) {
    next(error);
  }
};

export const getQuestionDifficulties = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const difficulties = Object.values(QuestionDifficulty);
    res.json(difficulties);
  } catch (error) {
    next(error);
  }
};