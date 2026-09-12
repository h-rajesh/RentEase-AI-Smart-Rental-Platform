import {
  hashPassword,
  verifyPassword,
} from "../lib/auth/password";

async function main() {
  const password = "TestPassword123!";

  const hash = await hashPassword(password);

  console.log("Original password:", password);
  console.log("Generated hash:", hash);

  const correctPassword = await verifyPassword(
    password,
    hash
  );

  const wrongPassword = await verifyPassword(
    "WrongPassword123!",
    hash
  );

  console.log("Correct password:", correctPassword);
  console.log("Wrong password:", wrongPassword);
}

main().catch((error) => {
  console.error("Password test failed:", error);
  process.exit(1);
});