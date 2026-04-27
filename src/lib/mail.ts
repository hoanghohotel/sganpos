import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string, tenantId: string, origin?: string) => {
  const appUrl = origin || process.env.APP_URL || 'http://localhost:3000';
  const verificationLink = `${appUrl}/api/auth/verify?token=${token}&tenantId=${tenantId}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || 'support@monday.com.vn',
    to: email,
    subject: 'Xác thực tài khoản Monday POS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 12px;">
        <h2 style="color: #059669; text-align: center;">Chào mừng đến với Monday POS!</h2>
        <p>Vui lòng nhấn vào nút bên dưới để xác thực email và kích hoạt tài khoản của bạn:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Xác thực tài khoản</a>
        </div>
        <p>Nếu nút trên không hoạt động, bạn có thể sao chép liên kết này và dán vào trình duyệt:</p>
        <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${verificationLink}</p>
        <hr style="border: 0; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};
