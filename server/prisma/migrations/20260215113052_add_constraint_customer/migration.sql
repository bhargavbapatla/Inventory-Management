/*
  Warnings:

  - A unique constraint covering the columns `[phone,userId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Customer_email_key";

-- DropIndex
DROP INDEX "Customer_phone_key";

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_userId_key" ON "Customer"("phone", "userId");
