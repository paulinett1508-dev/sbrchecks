-- AlterTable: lat/lng do PDV passam a ser anuláveis (PDVs importados sem coords)
ALTER TABLE "Pdv" ALTER COLUMN "latitude" DROP NOT NULL;
ALTER TABLE "Pdv" ALTER COLUMN "longitude" DROP NOT NULL;

-- AlterTable: googleId do User passa a ser anulável (pré-cadastro antes do login Google)
ALTER TABLE "User" ALTER COLUMN "googleId" DROP NOT NULL;
