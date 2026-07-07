const API_URL = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") 
  ? "http://localhost:8000" 
  : "https://studymate-f2bw.onrender.com";

// Redirect if already logged in via token
if (localStorage.getItem("sm_auth_token")) {
  window.location.href = "app.html";
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  const btn = document.getElementById('submitBtn');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  
  btn.disabled = true;
  btn.innerText = "Logging in...";
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Invalid login credentials");
    }

    // Store session token and redirect to inside page
    localStorage.setItem("sm_auth_token", data.session);
    if (data.name) localStorage.setItem("sm_user_name", data.name);
    
    successMsg.style.display = 'block';
    btn.innerText = "Redirecting...";
    window.location.href = "app.html";

  } catch (err) {
    errorMsg.innerText = err.message;
    errorMsg.style.display = 'block';
    btn.disabled = false;
    btn.innerText = "Log In";
  }
});

// Password visibility toggle logic
const toggleBtn = document.getElementById('togglePassword');
if (toggleBtn) {
  toggleBtn.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    this.innerHTML = type === 'password' 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 10.07 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  });
}
