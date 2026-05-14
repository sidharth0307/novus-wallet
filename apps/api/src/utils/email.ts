import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;

//Gmail API with OAuth2 for secure email 
const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  try {
    // Generate the access token
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GOOGLE_USER_EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken as string,
      },
    });

    return transporter;
  } catch (error) {
    console.error("Error creating transporter:", error);
    throw error;
  }
};

// 
export const sendOtpMail = async (to: string, subject: string, title: string, description: string, otpCode: string) => {
  try {
    const transporter = await createTransporter();
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #F6F9FC; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background-color: #0A2540; color: white; width: 48px; height: 48px; line-height: 48px; font-size: 24px; font-weight: bold; border-radius: 12px; margin: 0 auto;">N</div>
        </div>
        <div style="background-color: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <h2 style="color: #0A2540; font-size: 24px; margin-top: 0; text-align: center;">${title}</h2>
          <p style="color: #4A5568; font-size: 16px; line-height: 24px; text-align: center;">
            ${description}
          </p>
          <div style="background-color: #F8FAFC; border: 2px dashed #E2E8F0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0;">
            <h1 style="color: #635BFF; font-size: 30px; letter-spacing: 8px; margin: 0; font-family: monospace;">${otpCode}</h1>
          </div>
          <p style="color: #718096; font-size: 14px; text-align: center; margin-bottom: 0;">
            This code will expire shortly. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: `Novus Wallet <${process.env.GOOGLE_USER_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw new Error("Failed to send email");
  }
};

// Specialized function for sending claim emails with a unique token
export const sendClaimEmail = async (
  recipientEmail: string,
  amount: number,
  claimToken: string
) => {
  const claimUrl = `${process.env.FRONTEND_URL}/claim/${claimToken}`;
  const formattedAmount = (amount / 100).toFixed(2);

  try {
    // Get the dynamic transporter
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Novus Wallet" <${process.env.GOOGLE_USER_EMAIL}>`,
      to: recipientEmail,
      subject: `You received $${formattedAmount} on Novus.`,
      html: `
        <div style="background-color: #030712; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #0a0f1c; border: 1px solid #1e293b; border-radius: 20px; padding: 40px; text-align: center;">
            <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0 0 40px 0;">
              <span style="color: #ffffff;">NOVUS</span><span style="color: #635BFF;">.</span>
            </h1>
            <p style="font-size: 16px; color: #94a3b8; margin: 0; font-weight: 500;">
              You have pending funds.
            </p>
            <h2 style="font-size: 56px; font-weight: 900; color: #ffffff; margin: 10px 0 30px 0; letter-spacing: -2px;">
              $${formattedAmount}
            </h2>
            <p style="font-size: 16px; color: #94a3b8; line-height: 1.6; margin: 0 0 40px 0; text-align: left;">
              Someone just sent you money via the Novus ledger. Because you don't have a wallet set up yet, we are holding these funds securely in our escrow vault. 
            </p>
            <div style="margin: 30px 0;">
              <a href="${claimUrl}" style="background-color: #ffffff; color: #030712; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">
                Unlock Wallet & Claim
              </a>
            </div>
            <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #1e293b;">
              <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
                <strong style="color: #cbd5e1;">Security Notice:</strong> If these funds are not claimed within 7 days, they will automatically expire and be returned to the sender. <br><br>
                If you aren't expecting this, you can safely delete this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] Claim link sent to ${recipientEmail} via Gmail API`);
  } catch (error) {
    console.error("Failed to send claim email via Gmail API:", error);
  }
};