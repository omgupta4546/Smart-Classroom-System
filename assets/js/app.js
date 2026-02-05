// app.js
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check for URL Messages (e.g. ?msg=Success)
    const urlParams = new URLSearchParams(window.location.search);
    const msg = urlParams.get('msg');
    const error = urlParams.get('error');

    if (msg) showToast(msg, 'success');
    if (error) showToast(error, 'error');

    // 2. Remove params from URL for clean look
    if (msg || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} fade-in`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
