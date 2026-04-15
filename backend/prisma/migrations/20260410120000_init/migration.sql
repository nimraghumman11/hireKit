-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'hiring_manager',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_kits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "experience_level" TEXT NOT NULL,
    "work_mode" TEXT NOT NULL DEFAULT 'remote',
    "team_size" TEXT,
    "generated_output" JSONB,
    "pdf_url" TEXT,
    "docx_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_kits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_logs" (
    "id" TEXT NOT NULL,
    "kit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "request_payload" JSONB NOT NULL,
    "response_payload" JSONB,
    "status" TEXT NOT NULL,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "interview_kits" ADD CONSTRAINT "interview_kits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_logs" ADD CONSTRAINT "ai_logs_kit_id_fkey" FOREIGN KEY ("kit_id") REFERENCES "interview_kits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
