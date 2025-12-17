const encryptionService = require("../services/encryptionService");
const decryptionService = require("../services/decryptionService");
const fs = require("fs");
const path = require("path");

const home = (req, res) => {
  res.render("index");
};

const encryptVideo = async (req, res) => {
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

    console.log(
      `[ENCRYPT] Processing ${videoFile.originalname} with ${method.toUpperCase()}`
    );

    // Call service to encrypt
    outputPath = encryptionService.encryptFile(videoFile, method, key);

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
    // Note: outputPath cleanup is handled if it was created, but for consistency we check here too if needed
    // In our service flow, outputPath is returned only if successful,
    // but if we had partial writes (not handled in service ideally), we might want to cleanup.
    // Since service writes synchronously fully, we rely on the catch there or here.
    // Code below preserved from original logic slightly adapted.
    
    // We don't have access to intermedite service state, but if outputPath was set, clean it.
     if (outputPath && fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      console.log(`[ENCRYPT] Cleaned up output: ${outputPath}`);
    }

    res.status(500).json({
      error: "Enkripsi gagal",
      detail: error.message || "Terjadi kesalahan saat memproses enkripsi",
    });
  }
};

const decryptVideo = async (req, res) => {
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

    console.log(
      `[DECRYPT] Processing ${encryptedFile.originalname} with ${method.toUpperCase()}`
    );

    // Call service to decrypt
    outputPath = decryptionService.decryptFile(encryptedFile, method, key);

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

    // Determine status code based on error message usually, but 500 is safe default unless specific validation error
    // The original code returned 400 for password/method mismatch, let's try to maintain that if possible,
    // but the service throws generic Errors. We can check error message content.
    let status = 500;
    if (error.message.includes("Password salah") || 
        error.message.includes("Metode dekripsi salah") ||
        error.message.includes("File tidak valid")) {
        status = 400;
    }

    res.status(status).json({
      error: "Dekripsi gagal",
      detail: error.message || "Terjadi kesalahan saat memproses dekripsi",
    });
  }
};

module.exports = {
  home,
  encryptVideo,
  decryptVideo,
};
