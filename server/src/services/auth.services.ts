import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../services/prisma.services";
import { WEB_URL } from "../env";
import { sendEmail } from "./email.services";
import { SendMailEnum } from "../constants";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  baseURL: `http://localhost:${process.env.PORT || 4000}`,
  emailVerification: {
    redirectTo: WEB_URL || "http://localhost:3000/",
    sendVerificationEmail: async ({ user, url, token }, request) => {
      void sendEmail(SendMailEnum.VERIFY_EMAIL, {
        to: user.email,
        url,
        token,
        user,
      });
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url, token }, request) => {
      void sendEmail(SendMailEnum.RESET_PASSWORD, {
        to: user.email,
        url,
        token,
        user,
      });
    },
    onPasswordReset: async ({ user }, request) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    },
  },
  socialProviders: {
    google: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  trustedOrigins: [WEB_URL || "http://localhost:3000"],
});
