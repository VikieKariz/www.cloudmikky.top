document.addEventListener('DOMContentLoaded', () => {
    const userInfo = document.getElementById('user-info');
    const logoutBtn = document.getElementById('logout-btn');

    // Capture token from URL, save to localStorage, and clear from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        localStorage.setItem('jwt', token);
        window.history.replaceState({}, document.title, "/dashboard.html");
    }

    // Fetch user data using the token
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
        // Here you would typically make a request to a protected endpoint
        // to get user data. For now, we'll just show a welcome message.
        userInfo.innerHTML = '<p>You are logged in.</p>';
    } else {
        window.location.href = '/login.html';
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('jwt');
        window.location.href = '/login.html';
    });
});
