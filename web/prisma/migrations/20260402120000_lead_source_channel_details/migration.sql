-- Optional channel detail fields (website name, Meta/Facebook profile name)
ALTER TABLE "Lead" ADD COLUMN "sourceWebsiteName" TEXT;
ALTER TABLE "Lead" ADD COLUMN "sourceMetaProfileName" TEXT;
