const crypto = require("crypto");
const fs = require("fs");

const decryptFile = (encryptedFile, method, key) => {
  // Hash key menjadi 32 bytes menggunakan SHA-256 dengan encoding UTF-8
  const hashedKey = crypto.createHash("sha256").update(key, "utf8").digest();

  const encryptedData = fs.readFileSync(encryptedFile.path);

  // Validasi ukuran file minimum (1 byte method + 32 bytes HMAC + 16 bytes IV minimum)
  if (encryptedData.length <= 49) {
    throw new Error("File tidak valid: terlalu kecil atau corrupt");
  }

  // Baca metadata
  const methodByte = encryptedData[0];
  const actualMethod =
    methodByte === 0x01 ? "aes" : methodByte === 0x02 ? "chacha20" : null;

  // Validasi method byte
  if (!actualMethod) {
    throw new Error("File tidak valid: bukan hasil enkripsi dari aplikasi ini");
  }

  // Validasi method yang dipilih vs method yang digunakan saat enkripsi
  if (actualMethod !== method) {
    throw new Error(
      `Metode dekripsi salah: File ini dienkripsi dengan ${actualMethod.toUpperCase()}, tapi Anda memilih ${method.toUpperCase()}`
    );
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
    throw new Error("Password salah");
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
  const outputPath = `uploads/decrypted_${Date.now()}.mp4`;
  fs.writeFileSync(outputPath, decryptedData);

  return outputPath;
};

module.exports = {
  decryptFile,
};
