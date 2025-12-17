const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const encryptFile = (videoFile, method, key) => {
  // Hash key menjadi 32 bytes menggunakan SHA-256 dengan encoding UTF-8
  const hashedKey = crypto.createHash("sha256").update(key, "utf8").digest();
  
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
    throw new Error("Metode enkripsi tidak valid");
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
  const outputPath = `uploads/encrypted_${Date.now()}.enc`;
  fs.writeFileSync(outputPath, result);

  return outputPath;
};

module.exports = {
  encryptFile,
};
