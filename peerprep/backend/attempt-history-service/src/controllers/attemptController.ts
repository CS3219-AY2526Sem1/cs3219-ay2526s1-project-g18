//AI Assistance Disclosure:
//Tool: Copilot (model: GPT-5 Mini), date: 2025-11-13
//Scope: Used to debug the controller functions + atomize the addQuestionAttempt function such that it uses a transaction for both creating the attempt and updating the summary.
// Prompt summary: "Create an atomic operation using Prisma transactions to add a question attempt and update the user attempt summary accordingly."
//Author review: I validated correctess and made sure the API worked as intended (Tested everything using Postman). Only used AI to implement the atomic operation to add the attempt and update the summary. All schemas and logic were already done by me.


import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import e from 'express';
// import the questionAttempt model from prisma client


const prisma = new PrismaClient();

// Adds a new question attempt record
export const addQuestionAttempt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, sharedCode, completedStatus, connectedAtTime, qnData, userNames } = req.body;

    // Basic validation
    if (!userId || !connectedAtTime || !qnData || !Array.isArray(userNames)) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    const connectedAt = new Date(connectedAtTime);

    const newAttempt = await prisma.$transaction(async (tx) => {
      // 1) create the attempt
      const attempt = await tx.questionAttempt.create({
        data: {
          userId,
          sharedCode: sharedCode ?? null,
          completedStatus,                    // enum string: "SOLVED" | "OUT_OF_TIME" | "DISCONNECTED"
          connectedAtTime: connectedAt,
          qnData,
          userNames,
        },
      });

      // 2) upsert the summary: atomically create-or-increment counters
      await tx.userAttemptSummary.upsert({
        where: { userId },
        update: {
          totalAttempted: { increment: 1 },
          ...(completedStatus === 'SOLVED'
            ? { totalSolved: { increment: 1 } }
            : {}),
        },
        create: {
          userId,
          totalAttempted: 1,
          totalSolved: completedStatus === 'SOLVED' ? 1 : 0,
        },
      });

      return attempt;
    });

    return res.status(201).json(newAttempt);
  } catch (error) {
    next(error);
  }
};

// Gets all the question attempts for a specific userId
export const getQuestionAttemptsByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        // Use Prisma client (safe + parameterized) instead of raw SQL
        const attempts = await prisma.questionAttempt.findMany({
            where: { userId },
            orderBy: { connectedAtTime: 'desc' },
        });

        res.json(attempts);
        console.log('Fetched attempts:');
        console.log(attempts);
    }catch (error) {
    next(error);
  }
};

// Gets the total number of attempts for a specific userId
export const getTotalAttemptSummaryByUserId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const summary = await prisma.userAttemptSummary.findUnique({
            where: { userId },
        });

        res.json({
            totalAttempted: summary?.totalAttempted || 0,
            totalSolved: summary?.totalSolved || 0,
        });
        console.log('Fetched attempt summary:');
        console.log(summary);
    } catch (error) {
    next(error);
    }
};

// Get particular attempt by attemptId
export const getQuestionAttemptById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { attemptId } = req.params;
    if (!attemptId) {
      return res.status(400).json({ error: 'attemptId is required' });
    }

    const attempt = await prisma.questionAttempt.findUnique({
      where: { attemptId },
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    res.json(attempt);
    console.log('Fetched attempt by ID:', attempt);
  } catch (error) {
    next(error);
  }
};