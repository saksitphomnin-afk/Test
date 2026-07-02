-- ลบช่องว่างหน้า/ท้ายชื่อโครงการของข้อมูลเดิม
-- เพื่อให้ตัวกรอง "เลือกโครงการ" บนหน้ารวมเทียบชื่อได้ตรง
UPDATE "Room"
SET "projectName" = TRIM("projectName")
WHERE "projectName" <> TRIM("projectName");
