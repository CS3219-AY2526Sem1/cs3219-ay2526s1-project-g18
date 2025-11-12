import { PrismaClient, QuestionAttempt, UserAttemptSummary } from '@prisma/client';

const prisma = new PrismaClient();

// Adds a new question attempt record