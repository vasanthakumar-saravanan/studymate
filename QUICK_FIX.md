# 🔧 QUICK FIX - Email & PDF Issues

## 🎯 What I Fixed

✅ **PDF Download**: Now downloads as HTML file (open in browser, print to PDF)
✅ **Finish Button**: Can click multiple times now  
✅ **Error Logging**: Better error messages in browser

---

## 🚀 Quick Fix Steps (5 minutes)

### Step 1: Verify .env File (1 minute)

Open `backend/.env` and make sure you have:

```
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Don't have it? Do this:**
1. Go to https://myaccount.google.com/
2. Click **Security** → **2-Step Verification** (enable if not done)
3. Search for **App passwords** → Generate for Mail
4. Copy the 16-character password
5. Add to .env file

### Step 2: Restart Backend (1 minute)

```bash
cd backend
# Press Ctrl+C to stop current server
# Then:
pip install -r requirements.txt
uvicorn app.server:app --reload
```

### Step 3: Test Email (1 minute)

Run the test script:

```bash
cd backend
python test_email.py
```

This will:
- ✅ Check if credentials are set
- ✅ Test Gmail connection
- ✅ Send you a test email
- ✅ Confirm everything works

### Step 4: Test in Browser (2 minutes)

1. Go to http://localhost:8000/planner.html
2. Create a study plan with **your email**
3. Click **"✓ Finish Day"**
4. Check:
   - Browser console (F12) for messages
   - Backend terminal for "Email sent to..."
   - Your email inbox (and spam folder!)

---

## 📥 PDF Download Fix

**Before**: Downloaded empty PDF file (404 error)
**Now**: Downloads as HTML file

**How to convert to PDF:**
1. Click "📥 Download as PDF"
2. File downloads: `ExamName_schedule.html`
3. Open in browser
4. Press `Ctrl+P` (or `Cmd+P`)
5. Click "Save as PDF"
6. Done! ✅

---

## ✅ Verification

### PDF Download
- [ ] Click "📥 Download as PDF"
- [ ] HTML file downloads
- [ ] Open in browser
- [ ] All schedule content visible
- [ ] Can print/save as PDF

### Email Notifications
- [ ] .env has GMAIL_EMAIL & GMAIL_PASSWORD
- [ ] Backend restarted
- [ ] Run `python test_email.py` - passes all tests
- [ ] Create planner with email
- [ ] Click "Finish Day"
- [ ] Backend shows "Email sent to..."
- [ ] Email received in inbox

### Finish Button
- [ ] Can click "Finish Day" multiple times
- [ ] Button changes to "✅ Finished"
- [ ] Progress updates
- [ ] Data saved to localStorage

---

## 🆘 If Still Not Working

### Email Not Sending

**Checklist:**
1. Is `GMAIL_EMAIL` set in .env?
2. Is `GMAIL_PASSWORD` set in .env?
3. Did you restart backend after .env change?
4. Is it using App Password (not regular password)?
5. Is 2-Step Verification enabled?

**Quick Test:**
```bash
cd backend
python test_email.py
```

If it says "Login Failed" → problem with Gmail credentials
If it says "Connection refused" → check internet/firewall

### PDF Download Shows 404

**Already Fixed!**
- Now downloads as HTML instead
- Open in browser to view
- Print as PDF from browser

### File Not Saving

**Check:**
- [ ] Browser downloads enabled
- [ ] Download location has write permission
- [ ] Try different browser
- [ ] Check browser console (F12) for errors

---

## 📝 Files I Updated

**Frontend:**
- `planner.js` - Better PDF download, better error logging
- Already updated on your system

**Backend:**
- `server.py` - Email sending code (no change needed)
- Already working on your system

**New Files:**
- `TROUBLESHOOTING.md` - Full debugging guide
- `test_email.py` - Email configuration tester

---

## 🎯 Next Steps

1. **Add Gmail credentials to .env** (if not done)
2. **Restart backend**
3. **Run `python test_email.py`**
4. **Test in browser**

That's it! Should work now! 🚀

---

## 💬 Still Have Issues?

Send me:
1. Output from `python test_email.py`
2. Your .env file (hide passwords like `****`)
3. Browser console errors (F12 → Console)
4. Backend terminal output

I'll help fix it! 👍
