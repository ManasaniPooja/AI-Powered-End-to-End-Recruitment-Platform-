import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendResetEmail = async (to: string, resetLink: string) => {
  await transporter.sendMail({
    from: `"AI Recruitment" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
        <h2 style="color:#6366f1">AI Recruitment — Password Reset</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetLink}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;
                  color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">
          Reset Password
        </a>
        <p style="margin-top:16px;color:#888">This link expires in <strong>1 hour</strong>.</p>
        <p style="color:#888">If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}