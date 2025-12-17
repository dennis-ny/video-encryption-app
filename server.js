// server.js
const express = require("express");
const fs = require("fs");
const videoRoutes = require("./routes/videoRoutes");

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", videoRoutes);

// Buat folder uploads jika belum ada
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
