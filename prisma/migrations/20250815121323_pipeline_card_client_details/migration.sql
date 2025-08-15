-- DropForeignKey
ALTER TABLE "public"."PipelineCard" DROP CONSTRAINT "PipelineCard_clientId_fkey";

-- AlterTable
ALTER TABLE "public"."PipelineCard" ADD COLUMN     "clientCompany" TEXT,
ADD COLUMN     "clientEmail" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "clientPhone" TEXT,
ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."PipelineCard" ADD CONSTRAINT "PipelineCard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
