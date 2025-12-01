# 🚀 QUICK SETUP - Real SMS & Email Notifications

Your forgot password feature is now deployed and ready! Follow these steps to enable real-time notifications:

## Step 1: Setup Gmail (5 minutes - FREE)

### Generate App Password:
1. Open: https://myaccount.google.com/apppasswords
2. If not enabled, first enable 2-Step Verification at: https://myaccount.google.com/security
3. Return to App passwords and select:
   - **App**: Mail
   - **Device**: Other → Type "Harvester App"
4. Click **Generate**
5. **Copy the 16-character password** (format: xxxx xxxx xxxx xxxx)

### Add to Vercel:
1. Go to: https://vercel.com/siva-nagi-reddy-munagalas-projects/munagala-harvestors-api/settings/environment-variables
2. Add these variables:
   ```
   EMAIL_USER = sivanagi318@gmail.com
   EMAIL_PASSWORD = [paste your 16-char password without spaces]
   ```
3. Click **Save**

---

## Step 2: Setup Twilio SMS (10 minutes - FREE TRIAL $15-20)

### Create Account:
1. Go to: https://www.twilio.com/try-twilio
2. Sign up and verify phone: 9542477945
3. You'll get **FREE trial credits** ($15-20 = ~2000 SMS)

### Get Credentials:
1. Go to: https://console.twilio.com
2. Copy from dashboard:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)
3. Get phone number:
   - Click "Get a trial number" (FREE)
   - Copy your Twilio number (format: +1234567890)

### Verify Recipient (Trial Requirement):
1. In Twilio Console → Phone Numbers → Verified Caller IDs
2. Add: +919542477945
3. Verify via SMS code

### Add to Vercel:
1. Go to: https://vercel.com/siva-nagi-reddy-munagalas-projects/munagala-harvestors-api/settings/environment-variables
2. Add these variables:
   ```
   TWILIO_ACCOUNT_SID = AC... [your account SID]
   TWILIO_AUTH_TOKEN = [your auth token]
   TWILIO_PHONE_NUMBER = +1... [your Twilio number]
   ```
3. Click **Save**

---

## Step 3: Redeploy

After adding ALL environment variables:
1. Go to: https://vercel.com/siva-nagi-reddy-munagalas-projects/munagala-harvestors-api
2. Click **Deployments** tab
3. Find latest deployment → Click **...** → **Redeploy**
4. Wait 30 seconds for deployment

---

## ✅ Test It!

1. Go to: https://munagala-agritech.vercel.app/login
2. Click "Forgot Password?"
3. Enter username: **admin**
4. Check:
   - 📱 **SMS on 9542477945**
   - 📧 **Email at sivanagi318@gmail.com**
5. Enter the 6-digit OTP
6. Set new password

---

## 💰 Costs

- **Gmail**: FREE (500 emails/day limit)
- **Twilio Trial**: FREE $15-20 credits (~2000 SMS)
- **Twilio Paid**: ₹0.56 per SMS in India (~$0.0075)

---

## 🔧 Troubleshooting

### Email not received:
- Check spam/junk folder
- Verify App Password is correct (no spaces)
- Check Gmail allows "Less secure app access"

### SMS not received:
- Verify 9542477945 is added to Verified Caller IDs
- Check trial credits balance in Twilio console
- Ensure phone number has +91 prefix

### Check Logs:
1. Go to Vercel deployment
2. Click **Functions** tab
3. Check logs for "✓ SMS sent" or "✓ Email sent"

---

## 📝 Current Status

✅ Code deployed and ready
⏳ Waiting for credentials in Vercel
🎯 Once credentials added → Real-time notifications enabled!

**Backend**: https://munagala-harvestors-api.vercel.app
**Frontend**: https://munagala-agritech.vercel.app
