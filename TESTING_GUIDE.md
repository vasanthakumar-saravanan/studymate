# 🧪 TESTING GUIDE - Step by Step

## ❓ Your Questions Answered

### Q1: How to Test Changes?
**Answer**: Follow the 3 tests below (10 minutes total)

### Q2: Can You Upload PDF to Me?
**Answer**: 
- ✅ YES - You can share:
  - Downloaded HTML/PDF file
  - Browser console logs (F12)
  - Backend terminal output
  - Screenshots
- ❌ No need to literally upload PDF to me
- Just describe what happens and share error messages

### Q3: Do I Need venv Activated?
**Answer**: 
- ✅ YES! Always activate venv before running Python commands
- ❌ If you don't, you'll get "command not found" errors

---

## 🚀 STEP 0: Activate venv (DO THIS FIRST!)

### On Windows (VS Code):

**Option A: PowerShell (Recommended)**
```powershell
# Open terminal in VS Code (Ctrl + `)
# Make sure you're in backend folder
cd backend
.\venv\Scripts\Activate.ps1
```

**Option B: Command Prompt (cmd.exe)**
```cmd
cd backend
venv\Scripts\activate.bat
```

**You'll see this when activated:**
```
(venv) C:\Users\vasan\OneDrive\Desktop\COLLEGE PROJECTS\Studymate\studymate\backend>
```

Notice `(venv)` at the start? That means it's activated! ✅

---

## 🧪 TEST 1: Test Email Configuration (2 minutes)

### Step 1: Activate venv
```powershell
cd backend
.\venv\Scripts\Activate.ps1
```

### Step 2: Run Test Script
```powershell
python test_email.py
```

### Step 3: Follow the Prompts

You'll see:
```
============================================================
TESTING GMAIL CONFIGURATION
============================================================

✓ Checking .env file...
  GMAIL_EMAIL: your.email@gmail.com ✓ SET
  GMAIL_PASSWORD: ✓ SET

============================================================
TESTING GMAIL SMTP CONNECTION
============================================================

✓ Connecting to smtp.gmail.com:465...
  ✓ Connection successful!

✓ Logging in with: your.email@gmail.com
  ✓ Login successful!
```

**Expected Results:**
- ✅ All 3 sections say "✓ SUCCESSFUL"
- ✅ Test email sent to your inbox
- ✅ Check SPAM folder if not in Inbox

**If you see ❌ LOGIN FAILED:**
- [ ] Check GMAIL_EMAIL in .env
- [ ] Check GMAIL_PASSWORD (must be App Password, not regular password)
- [ ] Verify 2-Step Verification is enabled on Gmail

---

## 🧪 TEST 2: Test PDF Download (2 minutes)

### Step 1: Open Browser
```
http://localhost:8000/planner.html
```

### Step 2: Create Test Exam Plan

Fill in:
- **Exam Name**: Math Final
- **Exam Date**: Pick a date 7+ days away
- **Subjects**: Math, Physics, Chemistry
- **Email**: your.email@gmail.com
- **Upload PDF**: Any PDF file (or leave empty)

### Step 3: Click "📅 Create Planner"

Wait for schedule to appear (2-5 seconds)

### Step 4: Click "📥 Download as PDF"

**What to expect:**
- File downloads as: `MathFinal_schedule.html`
- Should be ~50KB+ (not empty!)

### Step 5: Convert to Real PDF

1. Open the HTML file in browser
2. Press `Ctrl+P` (Windows) or `Cmd+P` (Mac)
3. Click "Save as PDF"
4. Done! ✅

**Troubleshooting:**
- [ ] File is empty → Check browser console (F12)
- [ ] File won't open → Try different browser
- [ ] Can't print → Try right-click → Print

---

## 🧪 TEST 3: Test Email Notification (3 minutes)

### Step 1: Create Exam Plan (from TEST 2 above)

Make sure you have a schedule displayed

### Step 2: Click "✓ Finish Day" Button

On the first day's task, click the green button

### Step 3: Check Two Places

**Place 1: Browser Console**
```
Press F12 (or right-click → Inspect)
Look for messages like:
- "Sending completion notification..."
- "Notification sent successfully!"
```

**Place 2: Backend Terminal**

In the terminal where backend is running, look for:
```
Email sent to: your.email@gmail.com
Subject: ✅ StudyMate - Day 1 Complete!
```

**Place 3: Your Email Inbox**

Check for email:
- **From**: your.email@gmail.com
- **Subject**: ✅ StudyMate - Day 1 Complete!
- **Message**: Shows your task completion

**Troubleshooting:**
- [ ] No backend message → Email endpoint not called
- [ ] Error in console → Check error message details
- [ ] No email → Check SPAM folder
- [ ] Backend shows 404 → Restart backend with `uvicorn app.server:app --reload`

---

## 📋 TESTING CHECKLIST

### Before Testing
- [ ] venv activated (see `(venv)` in terminal)
- [ ] .env has GMAIL_EMAIL and GMAIL_PASSWORD
- [ ] Backend is running (`uvicorn app.server:app --reload`)
- [ ] Frontend is accessible (`http://localhost:8000/planner.html`)

### PDF Download Test
- [ ] Can create exam plan
- [ ] Can see schedule displayed
- [ ] "📥 Download as PDF" button visible
- [ ] Clicking downloads HTML file (not empty)
- [ ] File opens in browser
- [ ] Can print/save as PDF

### Email Test
- [ ] Run `python test_email.py` - all tests pass
- [ ] Can click "Finish Day" button
- [ ] Browser console shows success message
- [ ] Backend terminal shows "Email sent to..."
- [ ] Email received in inbox within 1-2 minutes

### Multiple Days Test
- [ ] Click "Finish Day" on Day 1 ✅
- [ ] Can click "Finish Day" on Day 2 ✅
- [ ] Buttons don't get stuck
- [ ] Each sends separate email

---

## 🎬 Live Testing Session (10 minutes)

**Timeline:**
- 0:00 - Activate venv
- 1:00 - Run `python test_email.py`
- 3:00 - Open browser, create plan
- 5:00 - Click download, check file
- 7:00 - Click "Finish Day"
- 8:00 - Check console logs
- 9:00 - Check email
- 10:00 - All done! ✅

---

## 📸 What to Share with Me If Issues

If something doesn't work, send me:

1. **Screenshot of error** (most helpful!)
2. **Terminal output** (copy-paste text)
3. **Browser console logs** (F12 → Console tab)
4. **Your .env file** (hide passwords like `****`)
5. **Description**: What you clicked, what happened

Example:
```
I clicked "Download as PDF" and got this error:
[Error in console]

Backend showed:
[Terminal error]

The file downloaded was empty (0 KB)
```

---

## 💡 Pro Tips

1. **Keep terminal visible**: Resize window to see backend logs while testing
2. **Use Dark Mode**: Easier to read error messages
3. **Test one thing at a time**: Don't try everything at once
4. **Refresh page**: Press F5 between tests
5. **Check SPAM folder**: First place to check for emails

---

## 🆘 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `command not found: python` | venv not activated |
| File downloads empty | Refresh page, try different browser |
| Email not received | Check SPAM, verify Gmail credentials |
| "404 error" in console | Restart backend |
| Button stuck | Refresh page (F5) |
| GMAIL_PASSWORD not recognized | Use App Password, not regular password |

---

## ✅ Success Looks Like

**PDF Download:**
```
✅ File downloads as HTML
✅ Opens in browser showing full schedule
✅ Can print to PDF
✅ PDF has all content
```

**Email Notification:**
```
✅ Browser console: "Notification sent successfully!"
✅ Backend terminal: "Email sent to: your.email@gmail.com"
✅ Email arrives in inbox within 2 minutes
✅ Email shows day completed with tasks
```

**Overall:**
```
✅ Can create plans
✅ Can download schedules
✅ Can mark days complete
✅ Receive notification emails
✅ Everything works! 🎉
```

---

Good luck with testing, bro! Let me know how it goes! 💪
