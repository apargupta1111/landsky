/**
 * Light Routes — Full CRUD for lights table.
 */

const express = require("express");
const {
  getAllLights,
  getLightById,
  createLight,
  updateLight,
  deleteLight,
} = require("../controllers/lightController");

const router = express.Router();

router.get("/", getAllLights);
router.get("/:id", getLightById);
router.post("/", createLight);
router.put("/:id", updateLight);
router.delete("/:id", deleteLight);

module.exports = router;