const API_URL = "https://studymate-f2bw.onrender.com";

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
