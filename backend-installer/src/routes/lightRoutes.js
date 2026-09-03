/**
 * Light Routes — Full CRUD for lights table.
 */

const express = require("express");
const {
  getAllLights,
  getLightById,
  createLight,
  updateLight,
  patchLightLocation,
  deleteLight,
} = require("../controllers/lightController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", getAllLights);
router.get("/:id", getLightById);
router.post("/", createLight);
router.put("/:id", updateLight);
router.patch("/:id/location", patchLightLocation);
router.delete("/:id", deleteLight);

module.exports = router;