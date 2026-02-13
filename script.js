// Check if user is logged in (initially, no one is logged in)
let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

// Function to update navbar visibility
function updateNavbar() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (isLoggedIn) {
        // Hide Login/Register when logged in
        loginBtn.parentElement.style.display = 'none';
        registerBtn.parentElement.style.display = 'none';
    } else {
        // Show Login/Register when not logged in
        loginBtn.parentElement.style.display = 'block';
        registerBtn.parentElement.style.display = 'block';
    }
}

// Initialize navbar on page load
document.addEventListener('DOMContentLoaded', function() {
    updateNavbar();
    
    // Add click handlers for Login and Register buttons
    document.getElementById('loginBtn').addEventListener('click', function(e) {
        e.preventDefault();
        // TODO: Navigate to login page or show login modal
        console.log('Login button clicked');
    });
    
    document.getElementById('registerBtn').addEventListener('click', function(e) {
        e.preventDefault();
        // TODO: Navigate to register page or show register modal
        console.log('Register button clicked');
    });
});