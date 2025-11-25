/*
  Warnings:

  - The `topics` column on the `Question` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."QuestionTopic" AS ENUM ('ARRAYS', 'STRINGS', 'LINKED_LISTS', 'STACKS', 'QUEUES', 'TREES', 'GRAPHS', 'DYNAMIC_PROGRAMMING', 'GREEDY', 'BACKTRACKING', 'BINARY_SEARCH', 'SORTING', 'HASHING', 'HEAP', 'TRIE', 'RECURSION', 'SLIDING_WINDOW', 'TWO_POINTERS', 'MATH', 'BIT_MANIPULATION');

-- AlterTable
ALTER TABLE "public"."Question" DROP COLUMN "topics",
ADD COLUMN     "topics" "public"."QuestionTopic"[];
