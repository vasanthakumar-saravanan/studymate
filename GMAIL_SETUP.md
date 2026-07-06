# 📧 Gmail SMTP Configuration for StudyMate Planner

## Setup Instructions

### Step 1: Enable Gmail App Password

1. Go to https://myaccount.google.com/
2. Click on **Security** in the left panel
3. Scroll down and enable **2-Step Verification** (if not already enabled)
4. After 2-Step Verification is on, scroll back up and look for **App passwords**
5. In "Select the app and device you want to generate the app password for":
   - Select **Mail**
   - Select **Windows PC** (or your device type)
6. Click **Generate**
7. Google will show you a 16-character password (look like: `xxxx xxxx xxxx xxxx`)
8. Copy this password

### Step 2: Update Backend .env File

In `backend/.env`, add these lines:

```
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Example:**
```
GROQ_API_KEY=gsk_xyz...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...
GMAIL_EMAIL=john.doe@gmail.com
GMAIL_PASSWORD=abcd efgh ijkl mnop
```

### Step 3: Restart Backend Server

```bash
cd backend
uvicorn app.server:app --reload
```

---

## ✨ How It Works

### User Flow
1. User creates study plan and enters email
2. User clicks "Finish Day" after completing daily task
3. Frontend calls `/planner/send-notification/` API
4. Backend sends email via Gmail SMTP
5. User receives email confirmation

### Email Content
The user receives a beautifully formatted email with:
- ✅ Task completion confirmation
- 📚 Topic studied
- 📅 Study date
- 🎓 Exam name
- 💡 Motivational message

---

## 🔧 Troubleshooting

### "Gmail credentials not configured"
- Make sure `.env` file has GMAIL_EMAIL and GMAIL_PASSWORD
- Check spelling and values

### "Login Failed"
- Make sure 2-Step Verification is enabled on Gmail
- Use the **16-character App Password**, not your regular password
- App password includes spaces like: `xxxx xxxx xxxx xxxx`

### "Connection refused"
- Check internet connection
- Verify Gmail SMTP server is accessible
- Try from a different network

### "Email not received"
- Check spam/junk folder
- Verify email address is correct
- Check Gmail account limits (Gmail limits ~500 emails/day)

---

## 🔐 Security Notes

⚠️ **Important**: The Gmail password should be an **App Password**, NOT your main Gmail password.

- Never commit `.env` file to GitHub
- Use different email for production
- App Passwords are specific to your app, can be revoked anytime

---

## 📧 Alternative Email Services

If you don't want to use Gmail, you can use:

### SendGrid
```python
# Install: pip install sendgrid
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

message = Mail(
    from_email='your-email@sendgrid.com',
    to_emails=recipient_email,
    subject=subject,
    html_content=email_body)
sg = SendGridAPIClient(os.getenv('SENDGRID_API_KEY'))
response = sg.send(message)
```

### Mailgun
```python
# Install: pip install requests
import requests

def send_simple_message(recipient_email):
    return requests.post(
        "https://api.mailgun.net/v3/your-domain/messages",
        auth=("api", os.getenv('MAILGUN_API_KEY')),
        data={"from": "StudyMate <noreply@your-domain>",
              "to": recipient_email,
              "subject": subject,
              "html": email_body})
```

---

## ✅ Testing Email Notification

### Test in Browser
1. Go to `http://localhost:8000/planner.html`
2. Create planner with valid email
3. Click "Finish Day" button
4. Check your email inbox (or spam folder)

### Test via cURL
```bash
curl -X POST http://localhost:8000/planner/send-notification/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email@gmail.com",
    "subject": "StudyMate: Task Completed - Calculus",
    "topic": "Calculus",
    "date": "2024-06-01",
    "exam_name": "Final Exam - Mathematics"
  }'
```

---

## 📊 Email Features

### Current Capabilities ✅
- [x] Send completion notifications
- [x] Beautiful HTML formatted email
- [x] Task details included
- [x] Error handling
- [x] Async execution

### Future Enhancements 🚀
- [ ] Daily digest emails (summary of all tasks)
- [ ] Exam day reminder
- [ ] Weekly progress report
- [ ] Personalized study tips
- [ ] Performance analytics

---

## 📝 Env File Template

```bash
# API Keys
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...

# Gmail SMTP Configuration
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# Optional
DEBUG=true
```

---

## 🎯 Production Deployment

### For Render.com (or similar hosting):

1. Go to your app settings on Render
2. Navigate to **Environment** variables
3. Add:
   ```
   GMAIL_EMAIL=your.email@gmail.com
   GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```
4. Redeploy

### For Heroku:
```bash
heroku config:set GMAIL_EMAIL=your.email@gmail.com
heroku config:set GMAIL_PASSWORD=xxxx\ xxxx\ xxxx\ xxxx
```

---

## 📞 Support

If emails aren't sending:

1. ✅ Check backend logs for errors
2. ✅ Verify credentials in `.env`
3. ✅ Check spam folder
4. ✅ Try from different email
5. ✅ Test with cURL command
6. ✅ Check Gmail account security

---

**Happy studying! 📚✉️**
