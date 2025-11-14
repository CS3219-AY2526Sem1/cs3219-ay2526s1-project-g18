/*
  Warnings:

  - A unique constraint covering the columns `[userId,connectedAtTime]` on the table `QuestionAttempt` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttempt_userId_connectedAtTime_key" ON "QuestionAttempt"("userId", "connectedAtTime");
