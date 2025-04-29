document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = '/index.html';
        return;
    }

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('authToken');
        window.location.href = '/index.html';
    });

    // Update progress indicators
    function updateProgress() {
        // Update circle progress
        const circle = document.querySelector('.progress-circle');
        const value = parseInt(circle.getAttribute('data-value'));
        const max = parseInt(circle.getAttribute('data-max'));
        const percentage = (value / max) * 100;
        circle.style.background = `conic-gradient(#4CAF50 0% ${percentage}%, #e0e0e0 ${percentage}% 100%)`;

        // Update progress bars
        document.querySelectorAll('.progress-bar').forEach(bar => {
            const value = parseInt(bar.getAttribute('data-value'));
            const max = parseInt(bar.getAttribute('data-max'));
            const percentage = (value / max) * 100;
            bar.style.setProperty('--progress', `${percentage}%`);
        });
    }

    // Initialize
    updateProgress();
});