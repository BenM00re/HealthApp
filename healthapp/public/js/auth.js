document.addEventListener('DOMContentLoaded', () => {
    // Display error message if present in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    
    if (error) {
        showError(error);
    }

    // ===== LOGIN FORM HANDLER =====
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                // Hash password before sending
                const hashedPassword = await hashPassword(password);
                
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        password: hashedPassword
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    // Store the token in localStorage
                    localStorage.setItem('authToken', result.token);
                    window.location.href = '/dashboard.html';
                } else {
                    showError(result.error || 'Login failed');
                }
            } catch (err) {
                showError('Login failed. Please try again.');
                console.error('Login error:', err);
            }
        });
    }

    // ===== REGISTRATION FORM HANDLER =====
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (registerForm.password.value !== registerForm.confirmPassword.value) {
                showError("Passwords don't match");
                return;
            }

            try {
                const hashedPassword = await hashPassword(registerForm.password.value);
                
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: registerForm.username.value,
                        email: registerForm.email.value,
                        password: hashedPassword
                    })
                });

                const result = await response.json();
                
                if (result.success) {
                    window.location.href = '/index.html?registration=success';
                } else {
                    showError(result.error || 'Registration failed');
                }
            } catch (err) {
                showError('Registration failed. Please try again.');
                console.error('Registration error:', err);
            }
        });
    }
});

function showError(message) {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}