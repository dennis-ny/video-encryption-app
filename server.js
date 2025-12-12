// server.js
const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const app = express();

// Konfigurasi Multer 2.x
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Render halaman utama
app.get("/", (req, res) => {
  res.render("index");
});

// Enkripsi video
app.post("/encrypt", upload.single("video"), async (req, res) => {
  let uploadedFilePath = null;
  let outputPath = null;

  try {
    const { method, key } = req.body;
    const videoFile = req.file;

    // Validasi input
    if (!videoFile) {
      return res.status(400).json({
        error: "File video tidak ditemukan",
        detail: "Silakan upload file video terlebih dahulu",
      });
    }

    if (!method) {
      return res.status(400).json({
        error: "Metode enkripsi tidak dipilih",
        detail: "Pilih metode AES-256-CBC atau ChaCha20",
      });
    }

    if (!key || key.trim() === "") {
      return res.status(400).json({
        error: "Password tidak boleh kosong",
        detail: "Masukkan password untuk enkripsi",
      });
    }

    uploadedFilePath = videoFile.path;

    // Hash key menjadi 32 bytes menggunakan SHA-256 dengan encoding UTF-8
    const hashedKey = crypto.createHash("sha256").update(key, "utf8").digest();

    console.log(
      `[ENCRYPT] Processing ${
        videoFile.originalname
      } with ${method.toUpperCase()}`
    );

    const videoData = fs.readFileSync(videoFile.path);
    let encryptedData;
    let iv;

    if (method === "aes") {
      iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", hashedKey, iv);
      encryptedData = Buffer.concat([cipher.update(videoData), cipher.final()]);
    } else if (method === "chacha20") {
      iv = crypto.randomBytes(16); // ChaCha20 memerlukan 16 bytes nonce
      const cipher = crypto.createCipheriv("chacha20", hashedKey, iv);
      encryptedData = Buffer.concat([cipher.update(videoData), cipher.final()]);
    } else {
      return res.status(400).json({
        error: "Metode enkripsi tidak valid",
        detail: "Pilih AES-256-CBC atau ChaCha20",
      });
    }

    // Generate HMAC untuk verifikasi password (SHA-256)
    const hmac = crypto.createHmac("sha256", hashedKey);
    hmac.update(iv);
    hmac.update(encryptedData);
    const hmacDigest = hmac.digest(); // 32 bytes

    // Tambahkan metadata (method identifier + HMAC + IV + encrypted data)
    const methodByte = Buffer.from([method === "aes" ? 0x01 : 0x02]);
    const result = Buffer.concat([methodByte, hmacDigest, iv, encryptedData]);

    // Simpan file terenkripsi
    outputPath = `uploads/encrypted_${Date.now()}.enc`;
    fs.writeFileSync(outputPath, result);

    // Hapus file asli
    fs.unlinkSync(videoFile.path);
    uploadedFilePath = null;

    console.log(`[ENCRYPT] Success - sending encrypted file`);

    // Kirim file terenkripsi
    res.download(outputPath, "encrypted_video.enc");

    // Hapus file setelah response selesai
    res.on("finish", () => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`[ENCRYPT] Cleaned up: ${outputPath}`);
      }
    });
  } catch (error) {
    console.error("[ENCRYPT] Error:", error.message);

    // Cleanup files on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
      console.log(`[ENCRYPT] Cleaned up upload: ${uploadedFilePath}`);
    }
    if (outputPath && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      console.log(`[ENCRYPT] Cleaned up output: ${outputPath}`);
    }

    res.status(500).json({
      error: "Enkripsi gagal",
      detail: error.message || "Terjadi kesalahan saat memproses enkripsi",
    });
  }
});

// Dekripsi video
app.post("/decrypt", upload.single("encrypted"), async (req, res) => {
  let uploadedFilePath = null;
  let outputPath = null;

  try {
    const { method, key } = req.body;
    const encryptedFile = req.file;

    // Validasi input
    if (!encryptedFile) {
      return res.status(400).json({
        error: "File terenkripsi tidak ditemukan",
        detail: "Silakan upload file .enc terlebih dahulu",
      });
    }

    if (!method) {
      return res.status(400).json({
        error: "Metode dekripsi tidak dipilih",
        detail: "Pilih metode yang sama dengan saat enkripsi",
      });
    }

    if (!key || key.trim() === "") {
      return res.status(400).json({
        error: "Password tidak boleh kosong",
        detail: "Masukkan password yang sama dengan saat enkripsi",
      });
    }

    uploadedFilePath = encryptedFile.path;

    // Hash key menjadi 32 bytes menggunakan SHA-256 dengan encoding UTF-8
    const hashedKey = crypto.createHash("sha256").update(key, "utf8").digest();

    console.log(
      `[DECRYPT] Processing ${
        encryptedFile.originalname
      } with ${method.toUpperCase()}`
    );

    const encryptedData = fs.readFileSync(encryptedFile.path);

    // Validasi ukuran file minimum (1 byte method + 32 bytes HMAC + 16 bytes IV minimum)
    if (encryptedData.length <= 49) {
      return res.status(400).json({
        error: "File tidak valid",
        detail: "File terlalu kecil atau corrupt",
      });
    }

    // Baca metadata
    const methodByte = encryptedData[0];
    const actualMethod =
      methodByte === 0x01 ? "aes" : methodByte === 0x02 ? "chacha20" : null;

    // Validasi method byte
    if (!actualMethod) {
      return res.status(400).json({
        error: "File tidak valid",
        detail: "File bukan hasil enkripsi dari aplikasi ini",
      });
    }

    // Validasi method yang dipilih vs method yang digunakan saat enkripsi
    if (actualMethod !== method) {
      return res.status(400).json({
        error: "Metode dekripsi salah",
        detail: `File ini dienkripsi dengan ${actualMethod.toUpperCase()}, tapi Anda memilih ${method.toUpperCase()}`,
      });
    }

    // Extract HMAC, IV, dan encrypted data
    const storedHmac = encryptedData.slice(1, 33); // 32 bytes HMAC
    const iv = encryptedData.slice(33, 49); // 16 bytes IV
    const encrypted = encryptedData.slice(49); // Sisanya adalah encrypted data

    // Verifikasi HMAC (cek apakah password benar)
    const hmac = crypto.createHmac("sha256", hashedKey);
    hmac.update(iv);
    hmac.update(encrypted);
    const computedHmac = hmac.digest();

    // Constant-time comparison untuk mencegah timing attack
    if (!crypto.timingSafeEqual(storedHmac, computedHmac)) {
      return res.status(400).json({
        error: "Password salah",
        detail: "Password yang Anda masukkan tidak sesuai",
      });
    }

    let decryptedData;

    try {
      if (method === "aes") {
        const decipher = crypto.createDecipheriv("aes-256-cbc", hashedKey, iv);
        decryptedData = Buffer.concat([
          decipher.update(encrypted),
          decipher.final(),
        ]);
      } else if (method === "chacha20") {
        const decipher = crypto.createDecipheriv("chacha20", hashedKey, iv);
        decryptedData = Buffer.concat([
          decipher.update(encrypted),
          decipher.final(),
        ]);
      }
    } catch (decryptError) {
      console.error("[DECRYPT] Decryption failed:", decryptError.message);

      // Identifikasi jenis error
      if (
        decryptError.message.includes("bad decrypt") ||
        decryptError.code === "ERR_OSSL_BAD_DECRYPT"
      ) {
        throw new Error("Password salah");
      } else if (decryptError.message.includes("wrong final block length")) {
        throw new Error("File corrupt atau tidak lengkap");
      } else {
        throw new Error("Dekripsi gagal: " + decryptError.message);
      }
    }

    // Simpan file terdekripsi
    outputPath = `uploads/decrypted_${Date.now()}.mp4`;
    fs.writeFileSync(outputPath, decryptedData);

    // Hapus file encrypted
    fs.unlinkSync(encryptedFile.path);
    uploadedFilePath = null;

    console.log(`[DECRYPT] Success - sending decrypted file`);

    // Kirim file terdekripsi
    res.download(outputPath, "decrypted_video.mp4");

    res.on("finish", () => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
        console.log(`[DECRYPT] Cleaned up: ${outputPath}`);
      }
    });
  } catch (error) {
    console.error("[DECRYPT] Error:", error.message);

    // Cleanup files on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
      console.log(`[DECRYPT] Cleaned up upload: ${uploadedFilePath}`);
    }
    if (outputPath && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      console.log(`[DECRYPT] Cleaned up output: ${outputPath}`);
    }

    res.status(500).json({
      error: "Dekripsi gagal",
      detail: error.message || "Terjadi kesalahan saat memproses dekripsi",
    });
  }
});

// Buat folder uploads jika belum ada
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
