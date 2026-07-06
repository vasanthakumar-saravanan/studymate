const API_URL = "https://studymate-f2bw.onrender.com";

// Redirect if already logged in via token
if (localStorage.getItem("sm_auth_token")) {
  window.location.href = "app.html";
}

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const name = document.getElementById('name').value;
  
  const btn = document.getElementById('submitBtn');
  const errorMsg = document.getElementById('errorMsg');
  const successMsg = document.getElementById('successMsg');
  
  btn.disabled = true;
  btn.innerText = "Signing up...";
  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';
  //Exception handling

  try {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name })
    });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.detail || "Registration failed. Try again.");
    }

    successMsg.style.display = 'block';
    btn.innerText = "Redirecting...";
    window.location.href = "index.html";

  } catch (err) {
    errorMsg.innerText = err.message;
    errorMsg.style.display = 'block';
    btn.disabled = false;
    btn.innerText = "Sign Up";
  }
});
