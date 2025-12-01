# Forgot Password Setup Guide

## Overview
The forgot password feature sends OTP (One-Time Password) to registered phone and email for password reset.

## Current Configuration
- **Phone**: 9542477945
- **Email**: sivanagi318@gmail.com
- **OTP Validity**: 10 minutes

## Development Mode
Currently running in **development mode** - notifications are logged to console only.

## Production Setup

### 1. SMS Integration (Twilio)

#### Install Twilio SDK:
```bash
cd backend
npm install twilio
```

#### Setup Twilio Account:
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token
3. Get a Twilio phone number

#### Add Environment Variables:
Add to your `.env` file or Vercel environment variables:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Enable in Code:
Edit `backend/utils/notifications.js` and uncomment the Twilio code block in the `sendSMS` function.

---

### 2. Email Integration (NodeMailer with Gmail)

#### Install NodeMailer:
```bash
cd backend
npm install nodemailer
```

#### Setup Gmail App Password:
1. Go to Google Account Settings
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Copy the 16-character password

#### Add Environment Variables:
```
EMAIL_USER=sivanagi318@gmail.com
EMAIL_PASSWORD=your_app_password_here
```

#### Enable in Code:
Edit `backend/utils/notifications.js` and uncomment the NodeMailer code block in the `sendEmail` function.

---

### 3. Alternative: SendGrid for Email

If you prefer SendGrid over Gmail:

```bash
npm install @sendgrid/mail
```

Add to `.env`:
```
SENDGRID_API_KEY=your_api_key
```

---

## Testing

### Test Forgot Password Flow:
1. Navigate to login page
2. Click "Forgot Password?"
3. Enter username: `admin`
4. Check console for OTP (dev mode) or phone/email (production)
5. Enter OTP
6. Set new password

### Test API Endpoints:

```bash
# Request OTP
curl -X POST http://localhost:5001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin"}'

# Verify OTP
curl -X POST http://localhost:5001/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","otp":"123456"}'

# Reset Password
curl -X POST http://localhost:5001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","otp":"123456","newPassword":"newpass123"}'
```

---

## Security Notes

1. **OTP Storage**: Currently using in-memory Map. For production with multiple servers, use Redis or database.
2. **Rate Limiting**: Consider adding rate limiting to prevent OTP spam.
3. **Account Lockout**: Implement account lockout after multiple failed attempts.
4. **Secure Environment**: Never commit `.env` files with real credentials.

---

## Vercel Deployment

### Add Environment Variables in Vercel:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add all variables listed above
4. Redeploy the application

---

## Troubleshooting

### OTP Not Sending:
- Check console logs in development
- Verify Twilio credentials in production
- Check Gmail App Password is correct
- Ensure environment variables are set in Vercel

### OTP Expired:
- OTP is valid for 10 minutes only
- Request a new OTP if expired

### Invalid OTP:
- Ensure OTP is entered correctly (6 digits)
- Check for typos
- OTP is case-sensitive in some implementations

---

## Cost Estimates

### Twilio SMS:
- ~$0.0075 per SMS in India
- ~$1 for 100 SMS
- Free trial credits available

### SendGrid Email:
- 100 emails/day free forever
- $14.95/month for 40,000 emails

### Gmail (NodeMailer):
- Free (with rate limits)
- Max 500 recipients per day
- Good for small to medium applications
