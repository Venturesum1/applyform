import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error("Usage: npm run hash-password -- \"your-password-here\"");
  process.exit(1);
}

bcrypt.hash(password, 12).then((hash) => {
  const encoded = Buffer.from(hash, "utf8").toString("base64");
  console.log("\nAdd this to your .env.local file:\n");
  console.log(`ADMIN_PASSWORD_HASH_BASE64=${encoded}\n`);
});
