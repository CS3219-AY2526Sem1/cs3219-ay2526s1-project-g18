-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('OUT_OF_TIME', 'SOLVED', 'DISCONNECTED');

-- CreateTable
CREATE TABLE "QuestionAttempt" (
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "connectedAtTime" TIMESTAMP(3) NOT NULL,
    "sharedCode" TEXT,
    "qnData" JSONB NOT NULL,
    "completedStatus" "AttemptStatus" NOT NULL,
    "userNames" TEXT[],

    CONSTRAINT "QuestionAttempt_pkey" PRIMARY KEY ("attemptId")
);

-- CreateTable
CREATE TABLE "UserAttemptSummary" (
    "userId" TEXT NOT NULL,
    "totalAttempted" INTEGER NOT NULL DEFAULT 0,
    "totalSolved" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserAttemptSummary_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_idx" ON "QuestionAttempt"("userId");

-- CreateIndex
CREATE INDEX "QuestionAttempt_userId_connectedAtTime_idx" ON "QuestionAttempt"("userId", "connectedAtTime");
