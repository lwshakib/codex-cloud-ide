export const verifyEmailTemplate = (context: any) => ({
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email Address</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up for Frequency! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${context.url}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${context.url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account with Frequency, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Frequency. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `Verify Your Email Address\n\nThank you for signing up for Frequency! Please verify your email address by clicking the link below:\n\n${context.url}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account with Frequency, you can safely ignore this email.`,
});

export const resetPasswordTemplate = (context: any) => ({
  html: `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your Frequency account. Click the button below to reset it:</p>
            <div style="text-align: center;">
              <a href="${context.url}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${context.url}</p>
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour for security reasons.
            </div>
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Frequency. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `,
  text: `Reset Your Password\n\nWe received a request to reset your password for your Frequency account. Click the link below to reset it:\n\n${context.url}\n\nThis link will expire in 1 hour for security reasons.\n\nIf you didn't request a password reset, please ignore this email or contact support if you have concerns.`,
});
