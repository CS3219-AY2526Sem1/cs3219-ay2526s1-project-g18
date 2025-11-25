-- CreateTable
CREATE TABLE "public"."Question" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "difficulty" VARCHAR(50),
    "topics" VARCHAR(100)[],
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuestionSolution" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSolution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuestionSolution_questionId_idx" ON "public"."QuestionSolution"("questionId");

-- AddForeignKey
ALTER TABLE "public"."QuestionSolution" ADD CONSTRAINT "QuestionSolution_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "public"."Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
