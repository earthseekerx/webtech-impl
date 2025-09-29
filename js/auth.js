// Authentication handling
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Check if user is already logged in
    checkAuthStatus();
});

async function handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const result = await response.json();

        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));

            // Redirect to dashboard
            window.location.href = '/frontend/dashboard.html';
        } else {
            showError(result.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Connection error. Please try again.');
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname;

    if (token && (currentPage.includes('login.html') || currentPage === '/')) {
        // User is logged in but on login page, redirect to dashboard
        window.location.href = 'dashboard.html';
    } else if (!token && currentPage.includes('dashboard')) {
        // User is not logged in but trying to access dashboard
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function showError(message) {
    // Create error message display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
    background: #f8d7da;
    color: #721c24;
    padding: 12px;
    border-radius: 8px;
    margin: 10px 0;
    border: 1px solid #f5c6cb;
    `;

    const form = document.getElementById('loginForm');
    form.insertBefore(errorDiv, form.firstChild);

    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Utility function to make authenticated API calls
async function apiCall(url, options = {}) {
    const token = localStorage.getItem('token');

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };

    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, mergedOptions);

        if (response.status === 401) {
            // Token expired or invalid
            logout();
            return;
        }

        return response;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}
