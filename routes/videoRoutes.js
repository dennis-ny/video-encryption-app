const express = require("express");
const router = express.Router();
const videoController = require("../controllers/videoController");
const upload = require("../config/multer");

router.get("/", videoController.home);
router.post("/encrypt", upload.single("video"), videoController.encryptVideo);
router.post("/decrypt", upload.single("encrypted"), videoController.decryptVideo);

module.exports = router;
