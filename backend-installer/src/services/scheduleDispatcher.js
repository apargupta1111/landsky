const cron = require("node-cron");
const pool = require("../config/db");
const { sendDownlink } = require("./ttsApiService");

const POWER_ON_HEX = "64"; // 100%
const POWER_OFF_HEX = "00";

async function logAction(lightId, action, dimValue) {
  try {
    await pool.query(
      "INSERT INTO light_action_logs (light_id, action, dim_value) VALUES (?, ?, ?)",
      [lightId, action, dimValue]
    );
  } catch (err) {
    console.error(`⚠️  Failed to log action for light ${lightId}:`, err.message);
  }
}

function initScheduleDispatcher() {
  console.log("⏰ Schedule dispatcher initialized (running every minute)");

  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTime = `${currentHours}:${currentMinutes}`;
      
      const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)

      const [schedules] = await pool.query(`
        SELECT s.*, l.name AS device_id, l.id AS db_light_id
        FROM schedules s
        JOIN lights l ON s.light = l.id
        WHERE s.is_active = 1 AND s.deleted_at IS NULL
      `);

      for (const schedule of schedules) {
        // Check days of week if specified
        if (schedule.days_of_week) {
          try {
            const days = typeof schedule.days_of_week === 'string' 
              ? JSON.parse(schedule.days_of_week) 
              : schedule.days_of_week;
            
            if (Array.isArray(days) && days.length > 0 && !days.includes(currentDay)) {
              continue; // Not scheduled for today
            }
          } catch (e) {
            console.error("Invalid days_of_week format for schedule", schedule.id);
          }
        }

        const startTime = schedule.start_time.substring(0, 5); // "HH:mm"
        const stopTime = schedule.stop_time.substring(0, 5);

        if (currentTime === startTime) {
          console.log(`⏰ Schedule trigger: ON for ${schedule.device_id} (schedule ${schedule.id})`);
          try {
            await sendDownlink(schedule.device_id, POWER_ON_HEX, 1);
            await logAction(schedule.db_light_id, "powerOn", 100);
          } catch (err) {
            console.error(`❌ Schedule ON failed for ${schedule.device_id}:`, err.message);
          }
        } else if (currentTime === stopTime) {
          console.log(`⏰ Schedule trigger: OFF for ${schedule.device_id} (schedule ${schedule.id})`);
          try {
            await sendDownlink(schedule.device_id, POWER_OFF_HEX, 1);
            await logAction(schedule.db_light_id, "powerOff", 0);
          } catch (err) {
            console.error(`❌ Schedule OFF failed for ${schedule.device_id}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error("❌ Schedule dispatcher error:", err.message);
    }
  });
}

module.exports = {
  initScheduleDispatcher,
};
