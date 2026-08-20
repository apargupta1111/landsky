/**
 * QR Code Routes — CRUD for qr table.
 */

const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// ── POST /api/qr/scan ────────────────────────────────────────────────────────
// Phone submits scanned QR data with installer info + GPS coordinates.
//
// Body:
//   qr_code      — the QR string scanned from the physical label
//   latitude      — GPS lat from the phone
//   longitude     — GPS lng from the phone
//   installer_id  — user id of the installer performing the scan
//   pole_number   — (optional) pole number entered by installer
//   name          — (optional) human-readable light name
//   gateway       — (optional) gateway identifier
//   user_id       — (optional) owner user id
//   light_id      — (optional) specific light id

router.post("/scan", async (req, res) => {
  const { qr_code, latitude, longitude, installer_id, pole_number, name: requestName, gateway, user_id, light_id } = req.body;

  if (!qr_code) {
    return res.status(400).json({ error: "qr_code is required" });
  }
  if (latitude == null || longitude == null) {
    return res.status(400).json({ error: "latitude and longitude are required" });
  }
  if (!installer_id) {
    return res.status(400).json({ error: "installer_id is required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // find installer to determine user_id
    const [userRows] = await connection.query("SELECT id, parent_id FROM users WHERE id = ?", [installer_id]);
    let resolved_user_id = null;
    if (userRows.length > 0) {
      resolved_user_id = userRows[0].parent_id ? userRows[0].parent_id : userRows[0].id;
    }

    // Parse QR Code format if it matches {serialnumber:xxx,name:yyy} or similar
    // Combine them just in case the client app split the string by comma
    // before sending, which would result in qr_code="{SerialNumber:xxx" 
    // and name="Name:yyy}"
    let fullString = qr_code;
    if (requestName) {
      fullString += ',' + requestName;
    }

    const serialMatch = fullString.match(/serialnumber\s*:\s*([^,.\}]+)/i);
    const nameMatch = fullString.match(/name\s*:\s*([^,.\}]+)/i);
    
    if (serialMatch) {
      parsedSerialNumber = serialMatch[1].trim();
    }
    if (nameMatch) {
      parsedName = nameMatch[1].trim();
    }

    // 1. Check if the light already exists using parsedSerialNumber
    const [lightRows] = await connection.query(
      "SELECT id, serial_number FROM lights WHERE serial_number = ?",
      [parsedSerialNumber]
    );

    if (lightRows.length === 0) {
      // 1a. Light not found, create a new light
      let insertQuery, insertValues;
      if (light_id) {
        insertQuery = `
          INSERT INTO lights (id, name, serial_number, pole_number, latitude, longitude, installer, user_id, gateway_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        insertValues = [
          light_id,
          parsedName || null,
          parsedSerialNumber, 
          pole_number || "0000",
          latitude,
          longitude,
          installer_id,
          resolved_user_id || 1,
          gateway || null
        ];
      } else {
        insertQuery = `
          INSERT INTO lights (name, serial_number, pole_number, latitude, longitude, installer, user_id, gateway_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        insertValues = [
          parsedName || null,
          parsedSerialNumber, 
          pole_number || "0000",
          latitude,
          longitude,
          installer_id,
          resolved_user_id || 1,
          gateway || null
        ];
      }

      const [lightResult] = await connection.query(insertQuery, insertValues);
      const newLightId = light_id || lightResult.insertId;

      await connection.commit();
      return res.status(201).json({ message: "Light automatically created", light_id: newLightId });
    }

    // 2. Light exists, update it with installer info + GPS
    const existingLightId = lightRows[0].id;
    const updateFields = [
      "latitude = ?",
      "longitude = ?",
      "installer = ?",
      "updated_at = CURRENT_TIMESTAMP",
    ];
    const updateValues = [latitude, longitude, installer_id];

    if (pole_number) {
      updateFields.push(`pole_number = ?`);
      updateValues.push(pole_number);
    }
    if (parsedName) {
      updateFields.push(`name = ?`);
      updateValues.push(parsedName);
    }
    
    // Add user_id
    if (resolved_user_id !== null) {
      updateFields.push(`user_id = ?`);
      updateValues.push(resolved_user_id);
    }

    // Add gateway_id
    if (gateway) {
      updateFields.push(`gateway_id = ?`);
      updateValues.push(gateway);
    }

    updateValues.push(existingLightId);

    const [lightResult] = await connection.query(`
      UPDATE lights
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `, updateValues);

    if (lightResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Linked light not found in database" });
    }

    await connection.commit();

    const [updatedLightRows] = await connection.query("SELECT * FROM lights WHERE id = ?", [existingLightId]);
    res.json({
      ok: true,
      message: "Light updated successfully via QR scan",
      light: updatedLightRows[0]
    });
  } catch (err) {
    await connection.rollback();
    console.error("❌ QR scan install error:", err.message);
    res.status(500).json({ error: "Failed to process QR scan" });
  } finally {
    connection.release();
  }
});

module.exports = router;
