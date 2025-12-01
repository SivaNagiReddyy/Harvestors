const crypto = require('crypto');

const sendSMS = async (phone, message) => {
  try {
    console.log(`SMS to ${phone}: ${message}`);
    
    // Check if Twilio credentials are configured
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone.startsWith('+') ? phone : `+91${phone}` // Add India country code if not present
      });
      
      console.log('✓ SMS sent successfully via Twilio');
    } else {
      console.log('⚠ Twilio not configured - SMS logged only');
    }
    
    return { success: true, message: 'SMS sent successfully' };
  } catch (error) {
    console.error('SMS Error:', error);
    return { success: false, error: error.message };
  }
};

const sendEmail = async (email, subject, message) => {
  try {
    console.log(`Email to ${email}: ${subject}\n${message}`);
    
    // Check if email credentials are configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });
      
      await transporter.sendMail({
        from: `"Harvester Dealership" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #667eea;">🚜 Harvester Dealership</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #64748b; font-size: 12px;">
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        `
      });
      
      console.log('✓ Email sent successfully via NodeMailer');
    } else {
      console.log('⚠ Email credentials not configured - Email logged only');
    }
    
    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Email Error:', error);
    return { success: false, error: error.message };
  }
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = {
  sendSMS,
  sendEmail,
  generateResetToken,
  generateOTP
};
