const cron = require("node-cron");
const pool = require("../config/db");
const { sendDownlink } = require("./ttsApiService");

const POWER_ON_HEX = "64"; // Default 100%
const POWER_OFF_HEX = "00";

/** Encode brightness level (0-100) as a single hex byte */
function encodeBrightness(level) {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  return clamped.toString(16).padStart(2, "0").toUpperCase();
}

async function getLastBrightnessAndColor(lightId) {
  try {
    const [rows] = await pool.query(
      "SELECT dim_value, color FROM light_action_logs WHERE light_id = ? ORDER BY created_at DESC LIMIT 1",
      [lightId]
    );
    if (rows.length > 0) {
      return {
        dim_value: (rows[0].dim_value && rows[0].dim_value > 0) ? rows[0].dim_value : 100,
        color: rows[0].color || "white"
      };
    }
  } catch (err) {
    console.error(`⚠️ Error fetching last state for light ${lightId}:`, err.message);
  }
  return { dim_value: 100, color: "white" }; // Default
}

const WARM_LIGHT_HEX = "6F";
const WHITE_LIGHT_HEX = "70";

async function logAction(lightId, action, dimValue, color = null) {
  try {
    const [existing] = await pool.query("SELECT id FROM light_action_logs WHERE light_id = ?", [lightId]);
    if (existing.length > 0) {
      await pool.query(
        "UPDATE light_action_logs SET action = ?, dim_value = COALESCE(?, dim_value), color = COALESCE(?, color), created_at = CURRENT_TIMESTAMP WHERE light_id = ?",
        [action, dimValue, color, lightId]
      );
    } else {
      await pool.query(
        "INSERT INTO light_action_logs (light_id, action, dim_value, color) VALUES (?, ?, ?, ?)",
        [lightId, action, dimValue, color]
      );
    }
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
        SELECT s.id, s.light as db_light_id, s.start_time, s.stop_time, 
               s.days_of_week, s.is_active, s.brightness, l.name AS device_id
        FROM schedules s
        JOIN lights l ON s.light = l.id
        WHERE s.deleted_at IS NULL AND s.is_active = 1
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
            const lastState = await getLastBrightnessAndColor(schedule.db_light_id);
            const targetBrightness = schedule.brightness !== null ? schedule.brightness : lastState.dim_value;
            const hexPayload = encodeBrightness(targetBrightness);

            // 1. Send Brightness Command
            await sendDownlink(schedule.device_id, hexPayload, 1);
            await logAction(schedule.db_light_id, "powerOn", targetBrightness, null);
            console.log(`   -> Powered ON at ${targetBrightness}% (Hex: ${hexPayload})`);
            
            // 2. Wait 2 seconds and send Color Command to avoid flooding
            setTimeout(async () => {
              const colorHex = lastState.color === "warm" ? WARM_LIGHT_HEX : WHITE_LIGHT_HEX;
              await sendDownlink(schedule.device_id, colorHex, 1);
              await logAction(schedule.db_light_id, lastState.color === "warm" ? "setWarmLight" : "setWhiteLight", null, lastState.color);
              console.log(`   -> Set Color to ${lastState.color} (Hex: ${colorHex})`);
            }, 2000);
            
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
