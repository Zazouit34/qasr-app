-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'VENUE_ADMIN', 'STAFF', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "ClientSource" AS ENUM ('WALK_IN', 'REFERRAL', 'SOCIAL_MEDIA', 'PHONE', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WEDDING', 'ENGAGEMENT', 'BIRTHDAY', 'CORPORATE', 'BAPTISM', 'ANNIVERSARY', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('INQUIRY', 'QUOTE_SENT', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('CATERING', 'MUSIC', 'PHOTO_VIDEO', 'DECORATION', 'CAKE', 'FLOWERS', 'LIGHTING', 'TRANSPORT', 'BEAUTY', 'HOSTING', 'SECURITY', 'CLEANING', 'OTHER');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('FIXED', 'PER_PERSON', 'PER_HOUR', 'NEGOTIABLE');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('INCLUDED', 'CONFIRMED', 'CANCELLED', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'INSTALLMENT', 'FINAL_BALANCE', 'REFUND', 'PENALTY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'CCP', 'MOBILE_PAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('STAFF_SALARY', 'UTILITIES', 'MAINTENANCE', 'SUPPLIES', 'MARKETING', 'RENT', 'TAXES', 'VENDOR_PAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'CONTRACT', 'RECEIPT', 'QUOTE', 'INVOICE', 'PHOTO', 'OTHER');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('PAYMENT_DUE', 'CONTRACT_SIGNING', 'FINAL_HEADCOUNT', 'MENU_CONFIRMATION', 'GENERAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "avatar" TEXT,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "venueId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "wilaya" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "capacity" INTEGER NOT NULL,
    "description" TEXT,
    "bankAccount" TEXT,
    "taxId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueSettings" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "defaultDepositPct" INTEGER NOT NULL DEFAULT 30,
    "cancellationPolicyDays" INTEGER NOT NULL DEFAULT 30,
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '23:00',
    "currency" TEXT NOT NULL DEFAULT 'DZD',
    "language" TEXT NOT NULL DEFAULT 'fr',
    "notifyOnNewBooking" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnPayment" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VenueSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hall" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pricePerHour" DOUBLE PRECISION,
    "pricePerDay" DOUBLE PRECISION,
    "description" TEXT,
    "photos" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phone2" TEXT,
    "email" TEXT,
    "address" TEXT,
    "wilaya" TEXT,
    "nationalId" TEXT,
    "notes" TEXT,
    "source" "ClientSource" NOT NULL DEFAULT 'WALK_IN',
    "isVIP" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "hallId" TEXT,
    "eventNumber" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'INQUIRY',
    "title" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "guestCount" INTEGER NOT NULL,
    "groomName" TEXT,
    "brideName" TEXT,
    "groomPhone" TEXT,
    "bridePhone" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountReason" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "contractDate" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "priceType" "PriceType" NOT NULL DEFAULT 'FIXED',
    "unit" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventService" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "status" "ServiceStatus" NOT NULL DEFAULT 'INCLUDED',

    CONSTRAINT "EventService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "icon" TEXT,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,
    "extraPrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAmenity" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "EventAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "minGuests" INTEGER,
    "maxGuests" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageItem" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isIncluded" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "PaymentType" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "vendor" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "salary" DOUBLE PRECISION,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAssignment" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "EventAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "templateId" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "eventId" TEXT,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL,
    "message" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "category" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Venue_slug_key" ON "Venue"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VenueSettings_venueId_key" ON "VenueSettings"("venueId");

-- CreateIndex
CREATE UNIQUE INDEX "Event_eventNumber_key" ON "Event"("eventNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymentNumber_key" ON "Payment"("paymentNumber");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueSettings" ADD CONSTRAINT "VenueSettings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hall" ADD CONSTRAINT "Hall_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventService" ADD CONSTRAINT "EventService_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventService" ADD CONSTRAINT "EventService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amenity" ADD CONSTRAINT "Amenity_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAmenity" ADD CONSTRAINT "EventAmenity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAmenity" ADD CONSTRAINT "EventAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageItem" ADD CONSTRAINT "PackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignment" ADD CONSTRAINT "EventAssignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAssignment" ADD CONSTRAINT "EventAssignment_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

