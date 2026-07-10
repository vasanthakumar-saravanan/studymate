# StudyMate Exam Planner Feature

## 📋 Overview

The Exam Planner is a new feature for StudyMate that helps students create and manage personalized study schedules for upcoming exams. It uses AI to auto-generate study plans based on exam date and subject topics.

## ✨ Features

1. **Exam Planning**: Enter exam name, subject, and exam date
2. **PDF Upload** (Optional): Upload study materials to extract relevant topics
3. **AI-Generated Schedule**: Uses Groq LLM to create a week-by-week study plan
4. **Progress Tracking**: Mark topics as completed to track study progress
5. **Browser Notifications**: Get reminders for upcoming study sessions
6. **Data Persistence**: Save planners to both localStorage and Supabase database
7. **Schedule Export**: Download study schedule as JSON

## 🗂️ File Structure

### Frontend Files
```
frontend/
├── planner.html       # Planner UI (form + schedule display)
├── planner.js         # Planner logic (API calls, state management)
└── planner.css        # Planner styling
```

### Backend Files
```
backend/
└── app/
    ├── server.py      # NEW: Planner API endpoints
    └── ai_engine.py   # NEW: Schedule generation function
```

## 🔌 New API Endpoints

### 1. Create Planner
```
POST /planner/create/
Content-Type: application/json

Request Body:
{
  "exam_name": "Final Exam - Mathematics",
  "subject": "Mathematics",
  "exam_date": "2024-05-15",
  "pdf_topics": ["Calculus", "Linear Algebra", "Trigonometry"] (optional)
}

Response:
{
  "planner_id": "uuid-string",
  "exam_name": "Final Exam - Mathematics",
  "subject": "Mathematics",
  "exam_date": "2024-05-15",
  "schedule": {
    "weeks": [
      {
        "week_number": 1,
        "start_date": "2024-05-01",
        "end_date": "2024-05-07",
        "topics": ["Calculus", "Linear Algebra"],
        "daily_hours": 2,
        "activities": ["reading", "quiz", "practice"]
      },
      ...
    ],
    "total_days": 14,
    "recommendation": "Study 2-3 hours daily..."
  }
}
```

### 2. Get Planner
```
POST /planner/get/
Content-Type: application/json

Request Body:
{
  "planner_id": "uuid-string"
}

Response:
{
  "id": "uuid-string",
  "exam_name": "Final Exam - Mathematics",
  "subject": "Mathematics",
  "exam_date": "2024-05-15",
  "schedule": {...},
  "created_at": "2024-04-20T10:30:00"
}
```

### 3. Update Study Session
```
POST /planner/session-update/
Content-Type: application/json

Request Body:
{
  "planner_id": "uuid-string",
  "session_date": "2024-05-01",
  "topic": "Calculus",
  "completed": true
}

Response:
{
  "message": "Session updated successfully",
  "completed": true
}
```

## 💾 Database Schema (Supabase)

### exam_planners table
```sql
CREATE TABLE exam_planners (
  id UUID PRIMARY KEY,
  exam_name VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  exam_date DATE NOT NULL,
  schedule JSONB NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### study_sessions table
```sql
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY,
  planner_id UUID REFERENCES exam_planners(id),
  session_date DATE NOT NULL,
  topic VARCHAR NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP
);
```

## 🚀 How to Use

### 1. Navigate to Planner
- Click the "📅 Planner" button in the app navigation

### 2. Create a Study Plan
- **Exam Name**: Enter the name of your exam (e.g., "Final Exam - Mathematics")
- **Subject**: Specify the subject being examined
- **Exam Date**: Select the exam date using the date picker
- **PDF Upload** (Optional): Upload study materials to auto-detect topics

### 3. Generate Schedule
- Click "🚀 Generate Study Plan"
- Wait for AI to create personalized schedule
- Schedule will display week-by-week breakdown

### 4. Track Progress
- Mark topics as complete by clicking the checkbox
- View overall completion percentage
- Study tips are provided to help you prepare

### 5. Enable Notifications
- Click "🔔 Enable Notifications"
- Get daily reminders about your exam
- Browser must have notifications permission

### 6. Download Schedule
- Click "📥 Download Schedule" to export as JSON
- Save for offline reference

## 🔧 Backend Implementation Details

### Schedule Generation Algorithm
1. Receives exam date and topics from request
2. Calls `generate_study_schedule()` which uses Groq LLM
3. LLM returns JSON with week-by-week schedule
4. Fallback to default schedule if JSON parsing fails
5. Saves to Supabase if database configured

### Data Flow
```
Frontend Form
    ↓
    → POST /planner/create/
    ↓
Backend Receives Request
    ↓
    → Validate date & fields
    → Call generate_study_schedule()
    → LLM generates schedule
    → Save to Supabase
    ↓
Return Schedule to Frontend
    ↓
Display & Store in localStorage
```

## 🛠️ Installation & Setup

### 1. Ensure Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Required packages (already in requirements.txt):
- fastapi
- uvicorn
- pydantic
- groq
- supabase
- python-dotenv

### 2. Environment Variables (.env)
```
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 3. Create Supabase Tables
Run the SQL schema commands above in Supabase SQL editor

### 4. Start Backend
```bash
cd backend
uvicorn app.server:app --reload
```

### 5. Open Planner
```
Local: http://localhost:8000/planner.html
Production: https://studymate-f2bw.onrender.com/planner.html
```

## 🎯 Feature Walkthrough

### Example Usage Flow
1. **User logs in** → Navigates to Planner
2. **Fills form**: 
   - Exam: "Chemistry Final Exam"
   - Subject: "Chemistry"
   - Date: "2024-06-15"
   - Uploads Chemistry textbook PDF
3. **Clicks Generate** → Backend extracts topics from PDF and LLM creates 4-week schedule
4. **Schedule displayed** with topics like:
   - Week 1: Atomic Structure, Bonding, Reactions
   - Week 2: Thermodynamics, Kinetics, Equilibrium
   - Week 3: Revision of key concepts
   - Week 4: Practice tests & final review
5. **Marks topics done** as they study
6. **Enables notifications** for daily reminders
7. **Downloads schedule** for offline reference

## 📊 Sample Generated Schedule

```json
{
  "weeks": [
    {
      "week_number": 1,
      "start_date": "2024-05-01",
      "end_date": "2024-05-07",
      "topics": ["Calculus - Limits", "Calculus - Derivatives", "Linear Algebra - Vectors"],
      "daily_hours": 2,
      "activities": ["reading", "practice problems", "summary notes"]
    },
    {
      "week_number": 2,
      "start_date": "2024-05-08",
      "end_date": "2024-05-14",
      "topics": ["Linear Algebra - Matrices", "Trigonometry - Functions"],
      "daily_hours": 2.5,
      "activities": ["quiz", "practice", "group discussion"]
    },
    {
      "week_number": 3,
      "start_date": "2024-05-15",
      "end_date": "2024-05-21",
      "topics": ["Revision - All topics", "Practice exams"],
      "daily_hours": 3,
      "activities": ["review", "full practice tests", "weak area focus"]
    }
  ],
  "total_days": 21,
  "recommendation": "You have 21 days to prepare. Study 2-3 hours daily for optimal retention."
}
```

## ⚠️ Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Exam date must be in the future" | Date in past | Select future date |
| "Database not configured" | Supabase not setup | Configure .env variables |
| "Planner not found" | Invalid ID | Generate new planner |
| "PDF extract failed" | Bad PDF file | Use valid PDF |
| "Invalid date format" | Wrong format | Use YYYY-MM-DD format |

## 🔄 Integration with Existing Features

The Planner integrates with:
- **Quiz System**: Users can take quizzes on scheduled topics
- **AI Tutor**: Ask about topics in their study plan
- **Feynman Technique**: Practice explaining scheduled topics
- **Mind Maps**: Visualize topic relationships
- **Dashboard**: Track study statistics

## 📱 Mobile Responsiveness

- Optimized for all screen sizes
- Touch-friendly date picker
- Responsive card layout
- Mobile-optimized notifications

## 🔐 Data Security

- Planners stored with user ID (when auth implemented)
- LocalStorage only stores current plan (not sensitive data)
- Supabase handles encrypted database storage
- No personal data in exported JSON

## 🚀 Future Enhancements

1. **Email Reminders**: Send study session reminders to email
2. **Collaborative Planning**: Share plans with study group
3. **AI Adaptive Scheduling**: Adjust schedule based on progress
4. **Study Analytics**: Charts showing study patterns
5. **Integration with Calendar**: Add to Google Calendar/Outlook
6. **Mobile App**: Native iOS/Android app
7. **Pomodoro Timer Integration**: Built-in timer for sessions
8. **Resource Recommendations**: AI suggests study materials

## 📞 Support

For issues or feature requests:
1. Check this documentation
2. Review console logs (browser DevTools)
3. Check backend logs
4. Contact development team

## 📝 Notes

- Schedule data is cached in localStorage for offline access
- Large PDFs may take longer to process
- LLM may occasionally return non-JSON in edge cases (fallback provided)
- Notifications require user permission
- Database is optional (works without Supabase)

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready ✅
