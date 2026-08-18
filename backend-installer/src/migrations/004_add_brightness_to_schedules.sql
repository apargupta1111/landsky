-- Add brightness setting to schedules
ALTER TABLE schedules ADD COLUMN brightness INT DEFAULT 100;
