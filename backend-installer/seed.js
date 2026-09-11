const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  user: process.env.DB_USER || "root",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "landsky",
  password: process.env.DB_PASSWORD || "root",
  port: process.env.DB_PORT || 3306,
});

async function run() {
  try {
    console.log("Starting data seed...");

    // 1. Create or Update Superadmin User
    const hash = await bcrypt.hash("password123", 10);
    const email = "apar@hbeonlabs.com";
    const username = "superadmin";

    console.log(`Ensuring superadmin user (${email}) exists...`);
    const [userRows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    
    let userId;
    if (userRows.length > 0) {
      userId = userRows[0].id;
      await pool.query(
        "UPDATE users SET password = ?, username = ?, role = 'superadmin' WHERE id = ?",
        [hash, username, userId]
      );
      console.log(`Updated existing superadmin with ID: ${userId}`);
    } else {
      const [insertUser] = await pool.query(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'superadmin')",
        [username, email, hash]
      );
      userId = insertUser.insertId;
      console.log(`Created new superadmin with ID: ${userId}`);
    }

    // 2. Create Gateways
    console.log("Ensuring gateways exist...");
    const gatewaysData = [
      { eui: "0011223344556677", name: "hbeonlabs-gateway-1", region: "IN865" },
      { eui: "0011223344556688", name: "hbeonlabs-gateway-2", region: "IN865" }
    ];

    const gatewayIds = [];
    for (const gw of gatewaysData) {
      const [gwRows] = await pool.query("SELECT id FROM gateways WHERE eui = ?", [gw.eui]);
      if (gwRows.length > 0) {
        gatewayIds.push(gwRows[0].id);
        console.log(`Gateway ${gw.name} already exists (ID: ${gwRows[0].id})`);
      } else {
        const [insertGw] = await pool.query(
          "INSERT INTO gateways (eui, name, region, installed_by) VALUES (?, ?, ?, ?)",
          [gw.eui, gw.name, gw.region, userId]
        );
        gatewayIds.push(insertGw.insertId);
        console.log(`Created gateway ${gw.name} with ID: ${insertGw.insertId}`);
      }
    }

    // 3. Create Streetlights
    console.log("Inserting streetlights...");
    const streetlights = [
      { name: "streetlight-05", devEui: "05:50:32:34:03:3A:4B:20" },
      { name: "streetlight-04", devEui: "05:50:32:34:89:39:4C:20" },
      { name: "streetlight-03", devEui: "04:50:32:34:6F:39:55:20" },
      { name: "streetlight-01", devEui: "17:50:32:34:7B:39:6F:20" },
      { name: "streetlight-02", devEui: "04:50:32:34:78:39:52:20" },
    ];

    // Give half the lights to gw1, half to gw2
    for (let i = 0; i < streetlights.length; i++) {
      const light = streetlights[i];
      const gwId = gatewayIds[i % gatewayIds.length];
      
      const [lightRows] = await pool.query("SELECT id FROM lights WHERE serial_number = ?", [light.devEui]);
      if (lightRows.length > 0) {
        const lId = lightRows[0].id;
        await pool.query(
          "UPDATE lights SET name = ?, gateway_id = ?, installer = ?, user_id = ? WHERE id = ?",
          [light.name, gwId, userId, userId, lId]
        );
        console.log(`Updated light ${light.name} (ID: ${lId})`);
      } else {
        // Base coordinate in India (e.g., Bhopal) with slight offsets
        const lat = 23.2599 + (Math.random() * 0.01);
        const lng = 77.4126 + (Math.random() * 0.01);
        
        await pool.query(
          "INSERT INTO lights (name, serial_number, latitude, longitude, installer, user_id, gateway_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [light.name, light.devEui, lat, lng, userId, userId, gwId]
        );
        console.log(`Created light ${light.name} with DevEUI ${light.devEui}`);
      }
    }

    console.log("✅ Data seed completed successfully!");
  } catch (err) {
    console.error("❌ Error running seed script:", err);
  } finally {
    pool.end();
  }
}

run();
