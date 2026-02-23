// ============================================================================
// GLOBAL STATE & STORAGE
// ============================================================================
const STORAGE_KEY = 'ipt_demo_v1';
let currentUser = null;
let window_db = {
    accounts: [],
    employees: [],
    departments: [],
    requests: []
};

// ============================================================================
// INITIALIZATION
// ============================================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing...');
    
    // Load data from storage
    loadFromStorage();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    const authToken = localStorage.getItem('auth_token');
    if (authToken) {
        const user = window_db.accounts.find(a => a.email === authToken);
        if (user) {
            setAuthState(true, user);
        }
    }
    
    // Set initial route
    if (!window.location.hash) {
        window.location.hash = '#/';
    }
    
    // Handle routing
    window.addEventListener('hashchange', handleRouting);
    handleRouting();
});

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================
function loadFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (stored) {
        try {
            window_db = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse storage:', e);
            seedDefaultData();
        }
    } else {
        seedDefaultData();
    }
}

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(window_db));
}

function seedDefaultData() {
    window_db = {
        accounts: [
            {
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                password: 'Password123!',
                role: 'admin',
                verified: true
            },
            {
                firstName: 'Test',
                lastName: 'User',
                email: 'user@example.com',
                password: 'Password123!',
                role: 'user',
                verified: true
            }
        ],
        employees: [],
        departments: [
            { name: 'Engineering', description: 'Engineering Department' },
            { name: 'HR', description: 'Human Resources Department' }
        ],
        requests: []
    };
    saveToStorage();
}

// ============================================================================
// ROUTING
// ============================================================================
function navigateTo(hash) {
    window.location.hash = hash;
}

function handleRouting() {
    const hash = window.location.hash.slice(1) || '/';
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    // Page mapping
    const routes = {
        '/': 'home-page',
        '/register': 'register-page',
        '/verify-email': 'verify-email-page',
        '/login': 'login-page',
        '/profile': 'profile-page',
        '/requests': 'requests-page',
        '/employees': 'employees-page',
        '/departments': 'departments-page',
        '/accounts': 'accounts-page'
    };
    
    const pageId = routes[hash];
    
    // Check authentication for protected routes
    if (['/', '/profile', '/requests', '/employees', '/departments', '/accounts'].includes(hash)) {
        if (hash !== '/' && !currentUser) {
            navigateTo('/login');
            return;
        }
    }
    
    // Check admin access
    if (['/employees', '/departments', '/accounts'].includes(hash)) {
        if (!currentUser || currentUser.role !== 'admin') {
            navigateTo('/');
            return;
        }
    }
    
    // Show the page
    if (pageId) {
        const page = document.getElementById(pageId);
        if (page) {
            page.classList.add('active');
            
            // Call render functions
            if (hash === '/profile') renderProfile();
            if (hash === '/requests') renderRequestsList();
            if (hash === '/employees') renderEmployeesList();
            if (hash === '/departments') renderDepartmentsList();
            if (hash === '/accounts') renderAccountsList();
        }
    }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================
function setAuthState(isAuth, user = null) {
    currentUser = user;
    const body = document.body;
    
    if (isAuth && user) {
        body.classList.remove('not-authenticated');
        body.classList.add('authenticated');
        
        if (user.role === 'admin') {
            body.classList.add('is-admin');
        } else {
            body.classList.remove('is-admin');
        }
        
        document.getElementById('usernameDisplay').textContent = `${user.firstName} ${user.lastName}`;
        localStorage.setItem('auth_token', user.email);
    } else {
        currentUser = null;
        body.classList.add('not-authenticated');
        body.classList.remove('authenticated', 'is-admin');
        localStorage.removeItem('auth_token');
    }
}

function logout() {
    setAuthState(false);
    navigateTo('/');
}

// ============================================================================
// REGISTRATION
// ============================================================================
function setupEventListeners() {
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegister();
        });
    }
    
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
}

function handleRegister() {
    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    
    // Validation
    if (!firstName || !lastName || !email || !password) {
        showToast('Please fill all fields', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    if (window_db.accounts.find(a => a.email === email)) {
        showToast('Email already exists', 'danger');
        return;
    }
    
    // Create account
    window_db.accounts.push({
        firstName,
        lastName,
        email,
        password,
        role: 'user',
        verified: false
    });
    
    saveToStorage();
    localStorage.setItem('unverified_email', email);
    
    showToast('Account created! Verify your email.', 'success');
    
    // Clear form
    document.getElementById('registerForm').reset();
    
    // Navigate to verification
    setTimeout(() => navigateTo('/verify-email'), 1000);
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Please enter email and password', 'danger');
        return;
    }
    
    const user = window_db.accounts.find(a => 
        a.email === email && a.password === password && a.verified
    );
    
    if (user) {
        setAuthState(true, user);
        showToast(`Welcome ${user.firstName}!`, 'success');
        document.getElementById('loginForm').reset();
        setTimeout(() => navigateTo('/profile'), 1000);
    } else {
        showToast('Invalid email or password', 'danger');
    }
}

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================
function simulateEmailVerification() {
    const unverifiedEmail = localStorage.getItem('unverified_email');
    
    if (!unverifiedEmail) {
        showToast('No email to verify', 'danger');
        return;
    }
    
    const user = window_db.accounts.find(a => a.email === unverifiedEmail);
    if (user) {
        user.verified = true;
        saveToStorage();
        localStorage.removeItem('unverified_email');
        showToast('Email verified! Please login.', 'success');
        setTimeout(() => navigateTo('/login'), 1000);
    }
}

// Update verify page display
function handleRouting_VerifyEmail() {
    const unverifiedEmail = localStorage.getItem('unverified_email');
    if (unverifiedEmail) {
        document.getElementById('verifyEmailDisplay').textContent = unverifiedEmail;
    }
}

// Patch handleRouting to include verify email display
const originalHandleRouting = handleRouting;
handleRouting = function() {
    originalHandleRouting.call(this);
    const hash = window.location.hash.slice(1) || '/';
    if (hash === '/verify-email') {
        handleRouting_VerifyEmail();
    }
};

// ============================================================================
// PROFILE PAGE
// ============================================================================
function renderProfile() {
    if (!currentUser) return;
    
    document.getElementById('profileName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('profileRole').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
}

// ============================================================================
// EMPLOYEES PAGE
// ============================================================================
function showAddEmployeeModal() {
    const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
    document.getElementById('employeeForm').reset();
    
    // Populate department dropdown
    const deptSelect = document.getElementById('empDept');
    deptSelect.innerHTML = '<option value="">Select Department</option>';
    window_db.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.name;
        option.textContent = dept.name;
        deptSelect.appendChild(option);
    });
    
    modal.show();
}

function saveEmployee() {
    const id = document.getElementById('empId').value.trim();
    const email = document.getElementById('empEmail').value.trim();
    const position = document.getElementById('empPosition').value.trim();
    const dept = document.getElementById('empDept').value;
    const hireDate = document.getElementById('empHireDate').value;
    
    if (!id || !email || !position || !dept || !hireDate) {
        showToast('Please fill all fields', 'danger');
        return;
    }
    
    if (!window_db.accounts.find(a => a.email === email)) {
        showToast('User email does not exist', 'danger');
        return;
    }
    
    window_db.employees.push({ id, email, position, department: dept, hireDate });
    saveToStorage();
    
    showToast('Employee added', 'success');
    bootstrap.Modal.getInstance(document.getElementById('employeeModal')).hide();
    renderEmployeesList();
}

function renderEmployeesList() {
    const tbody = document.getElementById('employeesList');
    tbody.innerHTML = '';
    
    if (window_db.employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No employees</td></tr>';
        return;
    }
    
    window_db.employees.forEach((emp, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${emp.id}</td>
            <td>${emp.email}</td>
            <td>${emp.position}</td>
            <td>${emp.department}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteEmployee(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
    });
}

function deleteEmployee(index) {
    if (confirm('Delete this employee?')) {
        window_db.employees.splice(index, 1);
        saveToStorage();
        renderEmployeesList();
        showToast('Employee deleted', 'success');
    }
}

// ============================================================================
// DEPARTMENTS PAGE
// ============================================================================
function renderDepartmentsList() {
    const tbody = document.getElementById('departmentsList');
    tbody.innerHTML = '';
    
    window_db.departments.forEach(dept => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${dept.name}</td>
            <td>${dept.description}</td>
        `;
    });
}

// ============================================================================
// ACCOUNTS PAGE
// ============================================================================
function showAddAccountModal() {
    const modal = new bootstrap.Modal(document.getElementById('accountModal'));
    document.getElementById('accountForm').reset();
    modal.show();
}

function saveAccount() {
    const firstName = document.getElementById('accFirstName').value.trim();
    const lastName = document.getElementById('accLastName').value.trim();
    const email = document.getElementById('accEmail').value.trim();
    const password = document.getElementById('accPassword').value;
    const role = document.getElementById('accRole').value;
    const verified = document.getElementById('accVerified').checked;
    
    if (!firstName || !lastName || !email || !password) {
        showToast('Please fill all fields', 'danger');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'danger');
        return;
    }
    
    if (window_db.accounts.find(a => a.email === email)) {
        showToast('Email already exists', 'danger');
        return;
    }
    
    window_db.accounts.push({ firstName, lastName, email, password, role, verified });
    saveToStorage();
    
    showToast('Account added', 'success');
    bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
    renderAccountsList();
}

function renderAccountsList() {
    const tbody = document.getElementById('accountsList');
    tbody.innerHTML = '';
    
    window_db.accounts.forEach((acc, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${acc.firstName} ${acc.lastName}</td>
            <td>${acc.email}</td>
            <td>${acc.role}</td>
            <td>${acc.verified ? '<i class="bi bi-check text-success"></i>' : '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteAccount(${index})" 
                    ${currentUser.email === acc.email ? 'disabled' : ''}>
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
    });
}

function deleteAccount(index) {
    if (currentUser.email === window_db.accounts[index].email) {
        showToast('Cannot delete your own account', 'warning');
        return;
    }
    
    if (confirm('Delete this account?')) {
        window_db.accounts.splice(index, 1);
        saveToStorage();
        renderAccountsList();
        showToast('Account deleted', 'success');
    }
}

// ============================================================================
// REQUESTS PAGE
// ============================================================================
function showAddRequestModal() {
    const modal = new bootstrap.Modal(document.getElementById('requestModal'));
    document.getElementById('requestForm').reset();
    
    // Reset items
    const itemsContainer = document.getElementById('itemsContainer');
    itemsContainer.innerHTML = `
        <label class="form-label">Items</label>
        <div class="item-row mb-2">
            <div class="input-group">
                <input type="text" class="form-control item-name" placeholder="Item name" required>
                <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" required>
                <button type="button" class="btn btn-danger" onclick="removeItem(this)">×</button>
            </div>
        </div>
    `;
    
    modal.show();
}

function addItemRow() {
    const itemsContainer = document.getElementById('itemsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'item-row mb-2';
    newRow.innerHTML = `
        <div class="input-group">
            <input type="text" class="form-control item-name" placeholder="Item name" required>
            <input type="number" class="form-control item-qty" placeholder="Qty" value="1" min="1" required>
            <button type="button" class="btn btn-danger" onclick="removeItem(this)">×</button>
        </div>
    `;
    itemsContainer.appendChild(newRow);
}

function removeItem(button) {
    button.closest('.item-row').remove();
}

function saveRequest() {
    const type = document.getElementById('reqType').value;
    
    if (!type) {
        showToast('Please select request type', 'danger');
        return;
    }
    
    const itemRows = document.querySelectorAll('.item-row');
    if (itemRows.length === 0) {
        showToast('Please add at least one item', 'danger');
        return;
    }
    
    const items = [];
    itemRows.forEach(row => {
        const name = row.querySelector('.item-name').value.trim();
        const qty = parseInt(row.querySelector('.item-qty').value);
        
        if (name && qty > 0) {
            items.push({ name, qty });
        }
    });
    
    if (items.length === 0) {
        showToast('Please fill in all items', 'danger');
        return;
    }
    
    window_db.requests.push({
        type,
        items,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0],
        employeeEmail: currentUser.email
    });
    
    saveToStorage();
    showToast('Request submitted', 'success');
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    renderRequestsList();
}

function renderRequestsList() {
    const tbody = document.getElementById('requestsList');
    tbody.innerHTML = '';
    
    const userRequests = window_db.requests.filter(r => r.employeeEmail === currentUser.email);
    
    if (userRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No requests</td></tr>';
        return;
    }
    
    userRequests.forEach(req => {
        const itemsText = req.items.map(i => `${i.name} (${i.qty})`).join(', ');
        const statusBadge = `<span class="badge bg-${
            req.status === 'Pending' ? 'warning' : 
            req.status === 'Approved' ? 'success' : 'danger'
        }">${req.status}</span>`;
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${req.type}</td>
            <td>${itemsText}</td>
            <td>${statusBadge}</td>
            <td>${req.date}</td>
        `;
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    toast.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    toast.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => toast.remove(), 3000);
}