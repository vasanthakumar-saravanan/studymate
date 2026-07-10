# ⚡ Quick Setup - Planner v2.0 (PDF + Email + Daily Tasks)

## 🎯 What's New (30 seconds summary)

✅ **PDF Download** - Export schedule as beautiful PDF
✅ **Daily Task Tracker** - "Finish Day" buttons for each task
✅ **Email Notifications** - Get notified when you complete tasks
✅ **Progress Tracking** - See your daily completion automatically

---

## 🚀 5-Minute Setup

### Step 1: Gmail Configuration (2 min)

**Go to**: https://myaccount.google.com/

1. Click **Security** → Enable **2-Step Verification** (if not done)
2. Look for **App passwords** (appears after 2-Step enabled)
3. Select: App = **Mail**, Device = **Windows PC**
4. Click **Generate** → Copy 16-char password
5. Note it down: `xxxx xxxx xxxx xxxx`

### Step 2: Update .env File (1 min)

In `backend/.env`, add:

```
GMAIL_EMAIL=your.email@gmail.com
GMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```

**Full example**:
```
GROQ_API_KEY=gsk_xyz...
SUPABASE_URL=https://...
SUPABASE_KEY=eyJ...
GMAIL_EMAIL=john.doe@gmail.com
GMAIL_PASSWORD=abcd efgh ijkl mnop
```

### Step 3: Install & Run (2 min)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.server:app --reload
```

### Step 4: Open & Test (30 sec)

```
http://localhost:8000/planner.html
```

---

## 🎯 How to Use

### 1️⃣ Create Planner
```
Fill in:
- Exam Name: "Final Exam - Math"
- Subject: "Mathematics"
- Exam Date: Pick future date
- Email: your.email@gmail.com  ← NEW!
- PDF: Upload (optional)

Click: 🚀 Generate Study Plan
```

### 2️⃣ Daily Tasks
```
For each daily task:
1. Study the topic (2-3 hours)
2. Click: ✓ Finish Day
   → Button changes to ✅ Finished
   → Email sent automatically
   → Progress updates
3. Move to next topic
```

### 3️⃣ Download PDF
```
Click: 📥 Download as PDF
→ Professional PDF downloaded
→ Can print or view offline
```

---

## 📧 Email Example

When you click "Finish Day", you get:

```
Subject: ✅ Task Completed! - Calculus

Your email receives:
✅ Task Completed!
📚 Topic: Calculus
📅 Date: June 1, 2024
🎓 Exam: Final Exam - Mathematics

"Keep up the great work! 🚀"
```

---

## 🧪 Quick Test

### Test 1: Email via cURL
```bash
curl -X POST http://localhost:8000/planner/send-notification/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your.email@gmail.com",
    "subject": "Test: Complete!",
    "topic": "Test",
    "date": "2024-06-01",
    "exam_name": "Test Exam"
  }'
```

### Test 2: In Browser
1. Go to http://localhost:8000/planner.html
2. Create plan with your email
3. Click "Finish Day"
4. Check email (check spam folder too!)

---

## 🎨 UI Changes

### Form (New Field)
```
Exam Name: [________________]
Subject: [________________]
Exam Date: [calendar]
Your Email: [your.email@gmail.com] ← NEW!
Upload PDF: [drag & drop]
[🚀 Generate Study Plan]
```

### Schedule (New Button)
```
Week 1: May 25 - May 31

☐ Calculus (2h/day)     [✓ Finish Day] ← NEW!
☐ Algebra (2h/day)      [✓ Finish Day] ← NEW!

Progress: ▓▓░░░░ 30%
```

### Download
```
[📥 Download as PDF] ← Changed from JSON
[➕ Create New]
```

---

## 📁 What Changed

### Files Modified
```
✅ frontend/planner.html   - Added email input
✅ frontend/planner.js     - Added PDF + email logic
✅ frontend/planner.css    - Added task completion styles
✅ backend/app/server.py   - Added email endpoint
✅ backend/requirements.txt - Added smtplib
```

### New Files
```
✅ GMAIL_SETUP.md          - Detailed Gmail guide
✅ PLANNER_V2_FEATURES.md  - Full feature list
```

---

## ✅ Verification Checklist

- [ ] Gmail credentials added to .env
- [ ] Backend started without errors
- [ ] Planner opens in browser
- [ ] Can create study plan
- [ ] Can click "Finish Day"
- [ ] Email received in inbox
- [ ] Can download PDF
- [ ] PDF opens correctly
- [ ] Progress bar updates

---

## 🆘 Troubleshooting

### "Gmail credentials not configured"
→ Add GMAIL_EMAIL & GMAIL_PASSWORD to .env

### "Email not received"
→ Check spam/junk folder
→ Verify email address is correct

### "Login failed"
→ Use **App Password**, not regular password
→ Enable 2-Step Verification on Gmail

### "PDF won't download"
→ Check browser download permissions
→ Try different browser

---

## 🔗 More Help

- **Full Setup**: See `GMAIL_SETUP.md`
- **Features**: See `PLANNER_V2_FEATURES.md`
- **Original Planner**: See `PLANNER_FEATURE.md`

---

## 🎉 You're All Set!

### Start Using:
1. Create your first exam plan
2. Track daily progress
3. Get email confirmations
4. Download PDF schedule

### That's it! Enjoy! 🚀📚✉️

---

**Setup Time**: ~5 minutes
**Status**: ✅ Ready to Go!
