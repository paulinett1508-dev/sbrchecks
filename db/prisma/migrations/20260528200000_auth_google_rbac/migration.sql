-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('GDD', 'GERENTE', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'GDD';
COMMIT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
ADD COLUMN     "googleId" TEXT NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'GDD';

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
