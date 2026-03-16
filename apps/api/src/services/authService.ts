import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { cacheAside } from "../utils/cache";

// Helper function to guarantee a unique Cashtag
const generateUniqueCashtag = async (baseName: string): Promise<string> => {
  // 1. Clean the string: "Alex.Smith" -> "alexsmith"
  let base = baseName.toLowerCase().replace(/[^a-z0-9]/g, "");
  
  // Fallback just in case the email prefix was purely symbols
  if (!base) base = "user"; 

  let cashtag = base;
  let isUnique = false;

  // 2. The Collision Loop
  while (!isUnique) {
    const existing = await prisma.user.findUnique({ where: { cashtag } });
    
    if (!existing) {
      isUnique = true; // We found an empty slot!
    } else {
      // Collision detected! Append a random 3-to-4 digit number and try again
      const randomSuffix = Math.floor(100 + Math.random() * 9000);
      cashtag = `${base}${randomSuffix}`;
    }
  }

  return cashtag;
};

export const registerUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // 1. Check for existing Email
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) throw new Error("Email already exists");

  // 2. Auto-Generate the Cashtag from the email prefix
  // "johndoe@gmail.com" -> splits at '@' -> takes "johndoe"
  const emailPrefix = email.split('@')[0];
  const uniqueCashtag = await generateUniqueCashtag(emailPrefix);

  // 3. Hash password
  const hashed = await bcrypt.hash(password, 10);

  // 4. Create the User & Wallet atomically
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      cashtag: uniqueCashtag, // Assigned automatically in the background!
      wallet: { create: {} }
    }
  });

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid password");

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  return token;
};


export const getUserProfile = async (userId: string) => {
  return cacheAside(
    `user:${userId}`,
    300,
    () =>
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, cashtag: true },
      })
  );
};
