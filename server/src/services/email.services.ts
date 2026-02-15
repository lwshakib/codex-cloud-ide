import { config } from "dotenv";
import nodemailer from "nodemailer";
import { SendMailEnum } from "../constants";

// Import email templates
import {
  resetPasswordTemplate,
  verifyEmailTemplate,
} from "./templates/index.js";

config();

const isDevelopment = process.env.NODE_ENV === "development";

const transporter = nodemailer.createTransport(
  isDevelopment
    ? {
        host: process.env.MAILHOG_SMTP_HOST || "localhost",
        port: Number(process.env.MAILHOG_SMTP_PORT) || 1025,
        secure: false,
        tls: {
          rejectUnauthorized: false,
        },
      }
    : {
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      }
);

export const sendEmail = async (purpose: SendMailEnum, context: any) => {
  try {
    let subject = "";
    let html = "";
    let text = "";

    if (purpose === SendMailEnum.VERIFY_EMAIL) {
      subject = "Verify Your Email Address - Codex";
      const template = verifyEmailTemplate(context);
      html = template.html;
      text = template.text;
    } else if (purpose === SendMailEnum.RESET_PASSWORD) {
      subject = "Password Reset Request - Codex";
      const template = resetPasswordTemplate(context);
      html = template.html;
      text = template.text;
    } else {
      throw new Error("Unsupported email purpose");
    }

    const mailOptions = {
      from: `Codex <${process.env.GMAIL_USER || "noreply@codex.com"}>`,
      to: context.to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.messageId);

    if (isDevelopment) {
      console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};

// Verify transporter configuration on startup
export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email server is ready to send messages");
    return true;
  } catch (error) {
    console.error("❌ Email server configuration error:", error);
    return false;
  }
};
