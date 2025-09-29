document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadDashboardData();

    // Set up event listeners
    setupEventListeners();
});

function initializeDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Display user welcome message
    const userWelcome = document.getElementById('userWelcome');
    if (userWelcome) {
        userWelcome.textContent = `Welcome, ${user.firstName} ${user.lastName}`;
    }
}

async function loadDashboardData() {
    try {
        // Load dashboard statistics
        await loadDashboardStats();

        // Load recent appointments if on dashboard page
        if (document.getElementById('recentAppointments')) {
            await loadRecentAppointments();
        }

        // Load patients if on patients page
        if (document.getElementById('patientsTable')) {
            await loadPatients();
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadDashboardStats() {
    try {
        const response = await apiCall('/api/dashboard/stats');
        const stats = await response.json();

        // Update stat cards
        if (document.getElementById('totalPatients')) {
            document.getElementById('totalPatients').textContent = stats.totalPatients;
        }
        if (document.getElementById('todayAppointments')) {
            document.getElementById('todayAppointments').textContent = stats.todayAppointments;
        }
        if (document.getElementById('pendingBills')) {
            document.getElementById('pendingBills').textContent = stats.pendingBills;
        }
        if (document.getElementById('activeDoctors')) {
            document.getElementById('activeDoctors').textContent = stats.activeDoctors;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentAppointments() {
    try {
        const response = await apiCall('/api/appointments');
        const appointments = await response.json();

        const tbody = document.querySelector('#recentAppointments tbody');
        tbody.innerHTML = '';

        // Show only recent 5 appointments
        appointments.slice(0, 5).forEach(appointment => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${appointment.patient_first_name} ${appointment.patient_last_name}</td>
            <td>Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}</td>
            <td>${formatDate(appointment.appointment_date)}</td>
            <td>${appointment.appointment_time}</td>
            <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading recent appointments:', error);
    }
}

async function loadPatients() {
    try {
        const response = await apiCall('/api/patients');
        const patients = await response.json();

        const tbody = document.querySelector('#patientsTable tbody');
        tbody.innerHTML = '';

        patients.forEach(patient => {
            const row = document.createElement('tr');
            row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.first_name} ${patient.last_name}</td>
            <td>${patient.age}</td>
            <td>${patient.gender}</td>
            <td>${patient.phone}</td>
            <td>${patient.email || 'N/A'}</td>
            <td>
            <button class="btn-small btn-primary" onclick="editPatient(${patient.id})">Edit</button>
            <button class="btn-small btn-secondary" onclick="viewPatient(${patient.id})">View</button>
            </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

function setupEventListeners() {
    // Patient form submission
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', handlePatientSubmit);
    }

    // Search functionality
    const patientSearch = document.getElementById('patientSearch');
    if (patientSearch) {
        patientSearch.addEventListener('input', searchPatients);
    }
}

async function handlePatientSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const patientData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dateOfBirth: formData.get('dateOfBirth'),
        gender: formData.get('gender'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        address: formData.get('address'),
        emergencyContact: formData.get('emergencyContact')
    };

    try {
        const response = await apiCall('/api/patients', {
            method: 'POST',
            body: JSON.stringify(patientData)
        });

        if (response.ok) {
            showSuccess('Patient registered successfully!');
            event.target.reset();
            closePatientModal();
            loadPatients(); // Reload patients table
        } else {
            const error = await response.json();
            showError(error.error || 'Failed to register patient');
        }
    } catch (error) {
        console.error('Error registering patient:', error);
        showError('Connection error. Please try again.');
    }
}

function searchPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#patientsTable tbody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Modal functions
function openPatientModal() {
    document.getElementById('patientModal').style.display = 'block';
}

function closePatientModal() {
    document.getElementById('patientModal').style.display = 'none';
    document.getElementById('patientForm').reset();
}

function editPatient(patientId) {
    // Implementation for editing patient
    console.log('Edit patient:', patientId);
    // Add edit functionality here
}

function viewPatient(patientId) {
    // Implementation for viewing patient details
    console.log('View patient:', patientId);
    // Add view functionality here
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showError(message) {
    showNotification(message, 'error');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    z-index: 1000;
    font-weight: 600;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('patientModal');
    if (event.target === modal) {
        closePatientModal();
    }
}
