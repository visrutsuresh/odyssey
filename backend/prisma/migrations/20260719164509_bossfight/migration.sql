-- CreateTable
CREATE TABLE "BossFight" (
    "id" SERIAL NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "BossFight_pkey" PRIMARY KEY ("id")
);
