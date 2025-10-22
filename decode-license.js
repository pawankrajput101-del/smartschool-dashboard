// decode-license.js
const fs = require('fs');
const arg = process.argv[2] || '';
if(!arg){ console.log("Usage: node decode-license.js <base64-license-string>"); process.exit(1); }
try{
  const json = JSON.parse(Buffer.from(arg, 'base64').toString('utf8'));
  console.log(">>> payload:");
  console.log(JSON.stringify(json.payload, null, 2));
  console.log(">>> signature present:", !!json.signature);
} catch(e){
  console.error("Decode error:", e.message);
}
