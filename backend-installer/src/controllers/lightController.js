const pool = require("../config/db");

const getAllLights = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM lights ORDER BY id"
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error"
    });
  }
};

module.exports = { getAllLights };