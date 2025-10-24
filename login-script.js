// frontend/login-script.js
const API_BASE_URL = 'http://localhost:8080/api';

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const statusEl = document.getElementById('login-status');
    statusEl.textContent = 'Logging in...';
    statusEl.style.color = '#fff';

    // --- WARNING: Basic security only! ---
    // In a real application, you'd use a server-side session or JWT.
    // This example uses a simple hardcoded check on the frontend 
    // for immediate functionality, but requires backend changes for true security.
    
    // Replace with your desired credentials!
    const validUsername = "teacher";
    const validPassword = "password123"; 

    if (username === validUsername && password === validPassword) {
        // Successful login
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userRole', 'teacher');
        statusEl.textContent = 'Login successful! Redirecting...';
        statusEl.style.color = '#28a745';
        
        // Redirect to the main dashboard
        setTimeout(() => {
            window.location.href = 'index.html'; 
        }, 1000);

    } else {
        // Failed login
        statusEl.textContent = 'Invalid username or password.';
        statusEl.style.color = '#dc3545';
        sessionStorage.removeItem('isLoggedIn');
    }
});