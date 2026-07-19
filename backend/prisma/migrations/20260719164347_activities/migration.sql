-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "xpAwarded" INTEGER NOT NULL,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
