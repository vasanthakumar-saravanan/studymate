document.getElementById("forgotForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
        document.getElementById("email").value;

    const msg =
        document.getElementById("msg");

    try {

        const res = await fetch(
            "https://studymate-f2bw.onrender.com/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            }
        );

        const data = await res.json();

        msg.innerText =
            "Password reset link sent to your email.";

    } catch (err) {

        msg.innerText =
            "Failed to send reset email.";
    }

});