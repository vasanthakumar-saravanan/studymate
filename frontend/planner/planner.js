// Planner.js - Exam Planner Logic
const API_BASE = "http://localhost:8000";
const PROD_API = "https://studymate-f2bw.onrender.com";

let currentPlannerData = null;
let uploadedFile = null;
let detectedTopics = [];
let userEmail = null;

// Get API base URL
function getApiBase() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return API_BASE;
  }
  return PROD_API;
}
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("pdfFile");

uploadZone.addEventListener("click", () => {
  fileInput.click();
});
// Handle file selection
function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.name.endsWith('.pdf')) {
    showAlert('Only PDF files are supported', 'error');
    return;
  }

  uploadedFile = file;
  document.getElementById('fileName').textContent = `📄 ${file.name}`;
}

// Upload PDF and extract topics
async function uploadPDF() {
  if (!uploadedFile) {
    showAlert('Please select a PDF file', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', uploadedFile);

  try {
    const btn = document.querySelector('button[onclick="uploadPDF()"]');
    btn.disabled = true;
    btn.textContent = '⏳ Uploading...';

    const response = await fetch(`${getApiBase()}/upload-pdf/`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    detectedTopics = data.detected_topics || [];
    
    showAlert(`✅ PDF uploaded! ${detectedTopics.length} topics detected.`, 'success');
    btn.textContent = '⬆ Upload PDF';
    btn.disabled = false;
  } catch (error) {
    console.error('Upload error:', error);
    showAlert('Failed to upload PDF: ' + error.message, 'error');
    document.querySelector('button[onclick="uploadPDF()"]').disabled = false;
    document.querySelector('button[onclick="uploadPDF()"]').textContent = '⬆ Upload PDF';
  }
}

// Create planner
async function createPlanner() {
  const examName = document.getElementById('examName').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const examDate = document.getElementById('examDate').value;
  userEmail = document.getElementById('userEmail').value.trim();

  if (!examName || !subject || !examDate) {
    showAlert('Please fill in all required fields', 'error');
    return;
  }

  if (!userEmail || !userEmail.includes('@')) {
    showAlert('Please enter a valid email address', 'error');
    return;
  }

  // Validate date format
  try {
    exam_date_obj = new Date(examDate);
  } catch (error) {
    showAlert('Invalid date format', 'error');
    return;
  }

  if (exam_date_obj < new Date()) {
    showAlert('Exam date must be in the future', 'error');
    return;
  }

  const btn = document.getElementById('createPlannerBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> Generating Schedule...';

  try {
    const response = await fetch(`${getApiBase()}/planner/create/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exam_name: examName,
        subject: subject,
        exam_date: examDate,
        pdf_topics: detectedTopics
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to create planner');
    }

    const data = await response.json();
    currentPlannerData = data;

    // Save to localStorage
    localStorage.setItem('sm_planner', JSON.stringify({
      ...data,
      user_email: userEmail,
      created_at: new Date().toISOString()
    }));

    displaySchedule(data);
    showAlert('✅ Study plan created successfully!', 'success');

  } catch (error) {
    console.error('Planner creation error:', error);
    showAlert('Error: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🚀 Generate Study Plan';
  }
}

// Display schedule
function displaySchedule(plannerData) {
  document.getElementById('plannerCreateSection').style.display = 'none';
  document.getElementById('scheduleSection').style.display = 'block';
  document.getElementById('progressSection').style.display = 'block';
  document.getElementById('notificationsSection').style.display = 'block';

  const scheduleContainer = document.getElementById('scheduleContainer');
  scheduleContainer.innerHTML = '';

  const schedule = plannerData.schedule;
  
  // Display header info
  const headerHTML = `
    <div style="margin-bottom: 20px; padding: 16px; background: rgba(56, 189, 248, 0.1); border-radius: 8px;">
      <h2 style="margin: 0 0 8px 0;">${plannerData.exam_name}</h2>
      <p style="margin: 4px 0; color: var(--muted);">
        <strong>Subject:</strong> ${plannerData.subject}
      </p>
      <p style="margin: 4px 0; color: var(--muted);">
        <strong>Exam Date:</strong> ${new Date(plannerData.exam_date).toLocaleDateString()}
      </p>
      <p style="margin: 4px 0; color: var(--muted);">
        <strong>Days to Prepare:</strong> ${Math.ceil((new Date(plannerData.exam_date) - new Date()) / (1000 * 60 * 60 * 24))} days
      </p>
      ${userEmail ? `<p style="margin: 4px 0; color: var(--muted);"><strong>Email:</strong> ${userEmail}</p>` : ''}
    </div>
  `;
  scheduleContainer.innerHTML += headerHTML;

  // Display weeks if available
  if (schedule.weeks && Array.isArray(schedule.weeks)) {
    schedule.weeks.forEach((week, weekIdx) => {
      const weekHTML = `
        <div class="schedule-week">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div>
              <h3 style="margin: 0 0 4px 0;">📅 Week ${week.week_number}</h3>
              <div class="schedule-dates">
                ${week.start_date} to ${week.end_date} • ${week.daily_hours} hours/day
              </div>
            </div>
          </div>
          <div class="schedule-topics">
            ${(week.topics || []).map((topic, topicIdx) => {
              const dayId = `day_${weekIdx}_${topicIdx}`;
              const isCompleted = localStorage.getItem(dayId) === 'true';
              return `
                <div class="day-task-container ${isCompleted ? 'completed' : ''}">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                      <div class="topic-item" style="margin-bottom: 0; cursor: default;">
                        <input type="checkbox" class="topic-checkbox" ${isCompleted ? 'checked' : ''} disabled>
                        <span class="topic-name">${topic}</span>
                        <span class="topic-hours">📚 ${week.daily_hours}h</span>
                      </div>
                    </div>
                    <button class="btn-finish-day ${isCompleted ? 'completed' : ''}" 
                            onclick="markDayComplete('${dayId}', '${topic}', '${week.start_date}')"
                            ${isCompleted ? 'disabled' : ''}>
                      ${isCompleted ? '✅ Finished' : '✓ Finish Day'}
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <p style="font-size: 0.85rem; margin-top: 12px; color: var(--muted);">
            Activities: ${(week.activities || []).join(', ')}
          </p>
        </div>
      `;
      scheduleContainer.innerHTML += weekHTML;
    });
  }

  // Display overall recommendation
  if (schedule.recommendation) {
    const recHTML = `
      <div style="margin-top: 20px; padding: 16px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; color: #22c55e;">
        <strong>💡 Recommendation:</strong> ${schedule.recommendation}
      </div>
    `;
    scheduleContainer.innerHTML += recHTML;
  }

  // Display progress
  displayProgress(plannerData);
}

// Display progress
function displayProgress(plannerData) {
  const progressContainer = document.getElementById('progressContainer');
  const schedule = plannerData.schedule;
  
  let totalTopics = 0;
  let completedTopics = 0;

  if (schedule.weeks && Array.isArray(schedule.weeks)) {
    totalTopics = schedule.weeks.reduce((sum, week) => sum + (week.topics?.length || 0), 0);
  }

  const completionPercentage = totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0;

  progressContainer.innerHTML = `
    <div style="margin-top: 12px;">
      <div class="progress-label">
        <span>Study Progress</span>
        <span>${completedTopics}/${totalTopics} topics completed</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${completionPercentage}%"></div>
      </div>
    </div>
    <div style="margin-top: 16px;">
      <p style="color: var(--muted); font-size: 0.9rem;">
        Mark topics as complete as you study them. Your progress will be saved automatically.
      </p>
    </div>
  `;
}

// Toggle topic completion
function toggleTopicCompletion(element) {
  const checkbox = element.querySelector('.topic-checkbox');
  checkbox.checked = !checkbox.checked;
  
  if (checkbox.checked) {
    element.style.opacity = '0.6';
    element.style.textDecoration = 'line-through';
  } else {
    element.style.opacity = '1';
    element.style.textDecoration = 'none';
  }
}

// Mark day task as complete
async function markDayComplete(dayId, topic, date) {
  try {
    const button = event.target;
    
    // If already completed, show message
    if (button.classList.contains('completed')) {
      showAlert('This task is already marked as complete!', 'info');
      return;
    }
    
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Finishing...';
    
    // Mark in localStorage
    localStorage.setItem(dayId, 'true');
    
    // Update UI
    button.textContent = '✅ Finished';
    button.classList.add('completed');
    
    // Find and update the container
    const container = button.closest('.day-task-container');
    if (container) {
      container.classList.add('completed');
    }
    
    showAlert(`✅ Great! "${topic}" marked as complete!`, 'success');
    
    // Send email notification
    if (userEmail) {
      console.log('Attempting to send email to:', userEmail);
      const result = await sendCompletionNotification(topic, date, userEmail);
      console.log('Email result:', result);
    } else {
      showAlert('⚠️ Email address not found. Email not sent.', 'error');
    }
    
  } catch (error) {
    console.error('Error marking day complete:', error);
    showAlert('Error: ' + error.message, 'error');
    event.target.disabled = false;
    event.target.innerHTML = '✓ Finish Day';
  }
}

// Send completion notification via email
async function sendCompletionNotification(topic, date, email) {
  try {
    console.log('Sending notification to:', email);
    console.log('API Base:', getApiBase());
    
    const response = await fetch(`${getApiBase()}/planner/send-notification/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        subject: `StudyMate: Task Completed - ${topic}`,
        topic: topic,
        date: date,
        exam_name: currentPlannerData?.exam_name || 'Your Exam'
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (response.ok) {
      showAlert(`✉️ Email sent to ${email}!`, 'success');
      return data;
    } else {
      console.error('Email sending failed:', data);
      showAlert(`⚠️ Email not sent: ${data.detail || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    showAlert('⚠️ Could not send email: ' + error.message, 'error');
  }
}

// Enable notifications
async function enableNotifications() {
  if (!('Notification' in window)) {
    showAlert('Your browser does not support notifications', 'error');
    return;
  }

  if (Notification.permission === 'granted') {
    showAlert('Notifications already enabled', 'info');
    scheduleReminders();
    return;
  }

  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showAlert('✅ Notifications enabled!', 'success');
        scheduleReminders();
      }
    });
  }
}

// Schedule reminders
function scheduleReminders() {
  if (!currentPlannerData) return;

  const examDate = new Date(currentPlannerData.exam_date);
  const now = new Date();
  const msUntilExam = examDate - now;
  const daysUntilExam = Math.ceil(msUntilExam / (1000 * 60 * 60 * 24));

  // Send initial notification
  if (Notification.permission === 'granted') {
    new Notification('📅 Study Reminder', {
      body: `You have ${daysUntilExam} days until your ${currentPlannerData.exam_name}. Start studying!`,
      icon: '📚'
    });

    // Schedule daily reminders
    const dailyReminderTime = 8 * 60 * 60 * 1000; // 8 AM
    setInterval(() => {
      new Notification('⏰ Daily Study Reminder', {
        body: `Remember to study for ${currentPlannerData.exam_name}!`,
        icon: '📚'
      });
    }, dailyReminderTime);
  }
}

// Download schedule as PDF (FIXED - Using simple HTML generation)
function downloadSchedulePDF() {
  if (!currentPlannerData) return;

  try {
    const schedule = currentPlannerData.schedule;
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${currentPlannerData.exam_name}</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 20px;">
        <h1 style="text-align: center; color: #333;">${currentPlannerData.exam_name}</h1>
        
        <div style="margin-bottom: 20px; padding: 15px; border: 2px solid #38bdf8; border-radius: 8px;">
          <p><strong>Subject:</strong> ${currentPlannerData.subject}</p>
          <p><strong>Exam Date:</strong> ${new Date(currentPlannerData.exam_date).toLocaleDateString()}</p>
          <p><strong>Days to Prepare:</strong> ${Math.ceil((new Date(currentPlannerData.exam_date) - new Date()) / (1000 * 60 * 60 * 24))} days</p>
        </div>
    `;
    
    // Add weeks to PDF
    if (schedule.weeks && Array.isArray(schedule.weeks)) {
      schedule.weeks.forEach((week) => {
        htmlContent += `
          <div style="margin-bottom: 20px; page-break-inside: avoid; padding: 15px; border-left: 4px solid #38bdf8;">
            <h2 style="color: #38bdf8; margin: 0 0 10px 0;">Week ${week.week_number}</h2>
            <p style="margin: 5px 0;"><strong>Dates:</strong> ${week.start_date} to ${week.end_date}</p>
            <p style="margin: 5px 0;"><strong>Daily Study Hours:</strong> ${week.daily_hours} hours</p>
            <h3 style="margin: 10px 0 5px 0;">Topics:</h3>
            <ul style="margin-left: 20px;">
              ${(week.topics || []).map(topic => `<li>${topic}</li>`).join('')}
            </ul>
            <p style="margin: 5px 0;"><strong>Activities:</strong> ${(week.activities || []).join(', ')}</p>
          </div>
        `;
      });
    }
    
    // Add recommendation
    if (schedule.recommendation) {
      htmlContent += `
        <div style="margin-top: 20px; padding: 15px; background-color: #f0f9ff; border-left: 4px solid #22c55e;">
          <h3 style="margin-top: 0; color: #22c55e;">💡 Study Tips</h3>
          <p>${schedule.recommendation}</p>
        </div>
      `;
    }
    
    // Add footer
    htmlContent += `
      <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
        <hr>
        <p>Generated by StudyMate AI | ${new Date().toLocaleDateString()}</p>
      </div>
      </body>
      </html>
    `;
    
    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPlannerData.exam_name.replace(/\s+/g, '_')}_schedule.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('✅ Schedule downloaded as HTML (open in browser and print as PDF)!', 'success');
  } catch (error) {
    console.error('PDF download error:', error);
    showAlert('Error downloading schedule: ' + error.message, 'error');
  }
}

// Reset planner
function resetPlanner() {
  if (confirm('Are you sure you want to create a new planner? Current progress will be lost.')) {
    currentPlannerData = null;
    detectedTopics = [];
    uploadedFile = null;
    userEmail = null;
    
    document.getElementById('examName').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('examDate').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('fileName').textContent = '';
    document.getElementById('pdfFile').value = '';

    document.getElementById('plannerCreateSection').style.display = 'block';
    document.getElementById('scheduleSection').style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('notificationsSection').style.display = 'none';

    localStorage.removeItem('sm_planner');
    showAlert('Planner reset. Create a new one!', 'info');
  }
}

// Show alert message
function showAlert(message, type = 'info') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  
  // Find the main element and insert at the top
  const main = document.querySelector('main');
  if (main) {
    main.insertBefore(alert, main.firstChild);
  }

  // Auto-remove after 5 seconds
  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transform = 'translateY(-10px)';
    alert.style.transition = 'all 0.3s ease';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

// Load saved planner on page load
window.addEventListener('DOMContentLoaded', () => {
  const savedPlan = localStorage.getItem('sm_planner');
  if (savedPlan) {
    try {
      const planData = JSON.parse(savedPlan);
      currentPlannerData = planData;
      userEmail = planData.user_email;
      if (userEmail) {
        document.getElementById('userEmail').value = userEmail;
      }
      displaySchedule(planData);
    } catch (error) {
      console.error('Error loading saved planner:', error);
    }
  }

  // Check authentication
  const token = localStorage.getItem('sm_auth_token');
  if (!token) {
    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
});

// Drag and drop support
document.addEventListener('DOMContentLoaded', () => {
  const uploadZone = document.getElementById('uploadZone');
  
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = '#38bdf8';
      uploadZone.style.background = 'rgba(56, 189, 248, 0.1)';
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.style.borderColor = 'var(--border, #333)';
      uploadZone.style.background = 'var(--card-bg)';
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = 'var(--border, #333)';
      uploadZone.style.background = 'var(--card-bg)';
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        document.getElementById('pdfFile').files = files;
        handleFileSelect(document.getElementById('pdfFile'));
      }
    });
  }
});
