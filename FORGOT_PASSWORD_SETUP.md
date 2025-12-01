# Forgot Password Setup Guide - PRODUCTION READY

## Overview
The forgot password feature sends OTP (One-Time Password) to registered phone and email for password reset.

## Current Configuration
- **Phone**: 9542477945
- **Email**: sivanagi318@gmail.com
- **OTP Validity**: 10 minutes

## ✅ PRODUCTION READY
The code is now configured to automatically send real SMS and Email when credentials are provided!

## Quick Start - Enable Real Notifications

### 1. SMS Integration (Twilio)

#### A. Create Twilio Account (FREE TRIAL):
1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your phone number
4. You'll get **FREE TRIAL CREDITS** ($15-20)

#### B. Get Twilio Credentials:
1. Go to Twilio Console: https://console.twilio.com
2. Copy **Account SID** and **Auth Token**
3. Go to Phone Numbers → Get a trial number (FREE)
4. Copy your Twilio phone number (format: +1234567890)

#### C. Add to Vercel Environment Variables:
1. Go to https://vercel.com/siva-nagi-reddy-munagalas-projects/munagala-harvestors-api
2. Click **Settings** → **Environment Variables**
3. Add these three variables:
```
TWILIO_ACCOUNT_SID = your_account_sid_here
TWILIO_AUTH_TOKEN = your_auth_token_here
TWILIO_PHONE_NUMBER = +your_twilio_number
```
4. Click **Save**

**Note**: Trial accounts can only send to verified numbers. Add 9542477945 as a verified number in Twilio Console.

---

### 2. Email Integration (Gmail - FREE)

#### A. Generate Gmail App Password:
1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Search for "App passwords" or go to: https://myaccount.google.com/apppasswords
5. Select **App**: Mail
6. Select **Device**: Other (Custom name) → Type "Harvester App"
7. Click **Generate**
8. Copy the **16-character password** (format: xxxx xxxx xxxx xxxx)

#### B. Add to Vercel Environment Variables:
1. Go to Vercel project settings
2. Add these two variables:
```
EMAIL_USER = sivanagi318@gmail.com
EMAIL_PASSWORD = your_16_char_app_password (remove spaces)
```
3. Click **Save**

**Important**: Use the App Password, NOT your regular Gmail password!

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

## 🚀 Final Step: Redeploy

After adding environment variables in Vercel:
1. Go to Deployments tab
2. Click on the latest deployment → **Redeploy**
3. Or push any commit to trigger auto-deployment

The system will automatically detect the credentials and start sending real SMS/Email!

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
