import nodemailer from "nodemailer";

// Create the transporter using standard SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // e.g., "your.email@gmail.com"
    pass: process.env.EMAIL_APP_PASSWORD, // An App Password, NOT your real password
  },
});

export const sendClaimEmail = async (
  recipientEmail: string, 
  amount: number, 
  claimToken: string
) => {
  const claimUrl = `${process.env.FRONTEND_URL}/claim/${claimToken}`;
  const formattedAmount = (amount / 100).toFixed(2); // Assuming amount is in cents

  const mailOptions = {
    from: `"Novus Wallet" <${process.env.EMAIL_USER}>`,
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
            <a href="${claimUrl}" style="background-color: #ffffff; color: #030712; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block; transition: background-color 0.3s;">
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

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email Sent] Claim link sent to ${recipientEmail}`);
  } catch (error) {
    console.error("Failed to send claim email:", error);
    // Note: We usually don't throw an error here because the database transaction 
    // already succeeded. We just log it or send it to an error tracking service.
  }
};