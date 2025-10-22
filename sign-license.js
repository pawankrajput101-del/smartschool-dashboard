const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Read private key
console.log("Looking for key at:", path.join(__dirname, "private.pem"));

const keyPath = path.join(__dirname, "private.pem");
console.log("Trying to read:", keyPath);
if (!fs.existsSync(keyPath)) {
  console.error("❌ File missing at this exact path!");
  process.exit(1);
}
//const privateKey = fs.readFileSync(keyPath, "utf8");
const privateKey = fs.readFileSync(path.join(__dirname, "private.pem"), "utf8");

// Get CLI args
const installationId = process.argv[2];
const modulesArg = process.argv[3] || "";
const expiresAt = process.argv[4] || "";

// Split module names
const modules = modulesArg.split(",");

// Prepare payload
const issuedAt = new Date().toISOString();
const payload = { installationId, modules, issuedAt, expiresAt };

// Sign payload
const signer = crypto.createSign("RSA-SHA256");
signer.update(JSON.stringify(payload));
const signature = signer.sign(privateKey, "base64");

// Final license string
const license = Buffer.from(JSON.stringify({ payload, signature })).toString("base64");

console.log("\n===== LICENSE STRING =====\n");
console.log(license);
console.log("\n===========================\n");
