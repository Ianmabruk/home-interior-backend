-- Make project title and description optional so projects can be created
-- with only a video upload (no text required).
ALTER TABLE "projects" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "projects" ALTER COLUMN "description" DROP NOT NULL;
