# 🔧 Troubleshooting Guide - PDF & Email Issues

## ❌ Issue 1: PDF Downloaded is Empty

### Cause
The html2pdf.js library from CDN was not loading (404 error)

### ✅ Solution
I've updated the PDF download to use a **simpler HTML-to-file** method:

**What Changed:**
- Instead of trying to load external html2pdf.js library
- Now generates HTML file directly
- User can open in browser and print to PDF
- **File format**: .html (open in browser, then print as PDF)

**How to Use:**
1. Click "📥 Download as PDF"
2. File downloaded: `ExamName_schedule.html`
3. Open file in browser
4. Press Ctrl+P (or Cmd+P on Mac)
5. Select "Save as PDF"
6. Done! ✅

---

## ❌ Issue 2: Email Not Sent to User

### Cause #1: Gmail Credentials Not Set
**Most Common Issue!**

Check your `.env` file in backend folder:

```bash
cat backend/.env
```

**You should see:**
```
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**If NOT there**, add them now!

### Cause #2: Email Configuration Wrong

**Quick Checklist:**
- [ ] Is `GMAIL_EMAIL` a valid Gmail address?
- [ ] Is `GMAIL_PASSWORD` the **App Password** (16 chars with spaces)?
- [ ] NOT your regular Gmail password?
- [ ] Did you enable 2-Step Verification on Gmail?

### Cause #3: Backend Not Restarted

After updating .env, restart backend:

```bash
cd backend
# Press Ctrl+C to stop current server
uvicorn app.server:app --reload
```

### Cause #4: Check Backend Logs

When you click "Finish Day", check backend terminal for messages:

**Good Message:**
```
Email sent to john.doe@gmail.com
```

**Bad Message:**
```
Gmail credentials not configured. Skipping email notification.
Error sending email: [some error]
```

---

## 🔍 How to Test Email

### Test 1: Via Browser Console

Open browser DevTools (F12) → Console → paste:

```javascript
const testEmail = async () => {
  const response = await fetch('http://localhost:8000/planner/send-notification/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      email: 'your.email@gmail.com',
      subject: 'Test Email',
      topic: 'Test Topic',
      date: '2024-06-01',
      exam_name: 'Test Exam'
    })
  });
  const data = await response.json();
  console.log('Response:', data);
};
testEmail();
```

Check console for response. If credentials missing, you'll see:
```
"status": "skipped"
"message": "Email credentials not configured"
```

### Test 2: Via cURL

Open terminal and run:

```bash
curl -X POST http://localhost:8000/planner/send-notification/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email@gmail.com",
    "subject": "Test",
    "topic": "Math",
    "date": "2024-06-01",
    "exam_name": "Final Exam"
  }'
```

Should get response:
```json
{"message": "Email sent successfully", "status": "sent"}
```

Or if error:
```json
{"message": "Gmail credentials not configured", "status": "skipped"}
```

---

## ✅ Step-by-Step Fix

### Step 1: Check .env File

```bash
cat backend/.env
```

**Should contain:**
```
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

### Step 2: If Missing, Add Gmail Credentials

Edit `backend/.env` and add:

```
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Don't have app password? Follow GMAIL_SETUP.md steps**

### Step 3: Restart Backend

```bash
cd backend
# Stop current server (Ctrl+C)
# Then restart
uvicorn app.server:app --reload
```

### Step 4: Test in Browser

1. Go to http://localhost:8000/planner.html
2. Create planner with valid email
3. Click "Finish Day"
4. **Check backend terminal** for "Email sent to..." message
5. **Check email inbox** (and spam folder!)

---

## 🐛 Common Error Messages

### Error: "Gmail credentials not configured"
→ Add GMAIL_EMAIL & GMAIL_PASSWORD to .env
→ Restart backend

### Error: "Login Failed"
→ Using regular Gmail password instead of App Password
→ 2-Step Verification not enabled

### Error: "Connection refused"
→ Gmail SMTP server not accessible
→ Check internet connection
→ Firewall might be blocking port 465

### Error: "Invalid email format"
→ Email address has typo
→ Check email validation

### PDF is empty or shows 404
→ Fixed in latest version
→ Download as HTML instead
→ Open in browser and print to PDF

---

## 📝 .env File Template

Create/update `backend/.env`:

```
# Groq API
GROQ_API_KEY=gsk_...

# Supabase
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...

# Gmail SMTP (for email notifications)
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## ✅ Verification Checklist

After fixing, verify:

- [ ] .env file has all 5 variables
- [ ] Backend restarted after .env change
- [ ] No 404 errors in browser console
- [ ] "Finish Day" button works
- [ ] Can download PDF (as HTML)
- [ ] Email received in inbox
- [ ] Backend logs show "Email sent to..."

---

## 📧 If Email Still Not Working

**Check these:**

1. **Is Gmail address correct?**
   ```
   GMAIL_EMAIL=john.doe@gmail.com  ← Correct
   GMAIL_EMAIL=john.doe@gmail       ← Wrong (missing .com)
   ```

2. **Is App Password correct?**
   - Should have spaces: `xxxx xxxx xxxx xxxx`
   - Should be 16 characters total
   - Not your regular Gmail password

3. **Has 2-Step Verification enabled?**
   - Go to https://myaccount.google.com/
   - Click Security
   - Enable 2-Step Verification (if not done)
   - Then try generating App Password again

4. **Is internet working?**
   - Ping Google: `ping gmail.com`
   - Try from different network

5. **Check Gmail account limits**
   - Gmail limits ~500 emails per day
   - Is your App Password revoked? Check at myaccount.google.com

---

## 🎯 Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| PDF empty | Fixed! Now downloads as HTML, open & print as PDF |
| Email not sent | Add GMAIL_EMAIL & GMAIL_PASSWORD to .env |
| Finish button stuck | Fixed! Can click multiple times now |
| 404 error | Fixed! No longer depends on CDN library |
| Backend logs show error | Check .env credentials, restart backend |

---

## 🆘 Still Stuck?

**Send me the following info:**

1. **Backend .env file** (hide passwords):
   ```
   GMAIL_EMAIL=your.email@gmail.com
   GMAIL_PASSWORD=****
   GROQ_API_KEY=****
   ```

2. **Backend console output** when clicking "Finish Day"

3. **Browser console errors** (F12 → Console tab)

4. **Backend startup logs**

5. **Error message** you're seeing

---

**Try these fixes and let me know if it works! 🚀**
