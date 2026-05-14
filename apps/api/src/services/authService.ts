import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { cacheAside } from "../utils/cache";
import crypto from 'crypto';
import { sendOtpMail } from "../utils/email";

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

// Helper to generate a 6-digit code
const generateOTP = () => crypto.randomInt(100000, 999999).toString();

export const initiateRegistration = async (email: string, password: string) => {
  if (!email || !password) throw new Error("Email and password are required");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  const otpCode = generateOTP();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  if (existingUser) {
    if (existingUser.isVerified) {
      throw new Error("Email is already registered and verified.");
    }
    // If they registered but didn't verify, update their password and send a fresh OTP
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashed, otpCode, otpExpiresAt }
    });
  } else {
    // 1. Brand new user - Auto-Generate Cashtag
    const emailPrefix = email.split('@')[0];
    const uniqueCashtag = await generateUniqueCashtag(emailPrefix);
    const hashed = await bcrypt.hash(password, 10);

    // 2. Create unverified User & Wallet
    await prisma.user.create({
      data: {
        email,
        password: hashed,
        cashtag: uniqueCashtag,
        isVerified: false,
        otpCode,
        otpExpiresAt,
        wallet: { create: {} }
      }
    });
  }

  // 3. Send the OTP via your Gmail transporter
  try {
    await sendOtpMail(
      email, 
      "Your Novus Verification Code", 
      "Verify your email", 
      "You're almost there! Use the code below to complete your registration for Novus.", 
      otpCode
    );
  } catch (emailError) {
    throw new Error("Failed to send verification email. Please check your address and try again.");
  }
  return { message: "OTP sent to your email. Please verify to continue." };
};

export const verifyUserOtp = async (email: string, otp: string) => {
  if (!email || !otp) throw new Error("Email and OTP are required");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) throw new Error("User not found");
  if (user.isVerified) throw new Error("Account is already verified.");
  
  // Check OTP validity
  if (user.otpCode !== otp) throw new Error("Invalid OTP code.");
  if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new Error("OTP has expired. Please request a new one.");
  }

  // Success: Mark as verified and clear the OTP fields
  await prisma.user.update({
    where: { email },
    data: {
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null
    }
  });

  return { message: "Email verified successfully. You can now log in." };
};

// 1. Request Password Reset: Generate OTP and send email
export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("If an account exists, a reset code has been sent.");

  const otp = crypto.randomInt(100000, 999999).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.user.update({
    where: { email },
    data: { otpCode: otp, otpExpiresAt: expires }
  });

  try {
    await sendOtpMail(
      email,
      "Novus Password Reset", 
      "Reset your password", 
      "We received a request to reset your password. Use the code below to create a new one.", 
      otp
    );
  } catch (emailError) {
    throw new Error("Failed to send reset email. Please check your address and try again.");
  }

  return { message: "Reset code sent." };
};

// 2. Complete Reset: Verify OTP and update password
export const resetPassword = async (email: string, otp: string, newPass: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.otpCode !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw new Error("Invalid or expired reset code.");
  }

  const hashed = await bcrypt.hash(newPass, 10);

  await prisma.user.update({
    where: { email },
    data: {
      password: hashed,
      otpCode: null, // Clear the code after use
      otpExpiresAt: null
    }
  });

  return { message: "Password updated successfully." };
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email }});
  if (!user) throw new Error("User not found");

  if (!user.isVerified) {
    throw new Error("UNVERIFIED_ACCOUNT"); 
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid password");

  const token = jwt.sign(
    { userId: user.id, role: user.role },
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
