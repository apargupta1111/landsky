/**
 * Light Routes — DB-backed light operations.
 */

const express = require("express");
const { getAllLights } = require("../controllers/lightController");
const router = express.Router();


router.get("/", getAllLights);

module.exports = router;