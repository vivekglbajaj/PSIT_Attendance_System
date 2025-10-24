// frontend/script.js

// Immediately check if the user is logged in
function checkLoginStatus() {
    if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        // IMPORTANT: Never use alert() in the final version of the code
        console.warn('Unauthorized access attempt. Redirecting to login.');
        // Redirect to the login page
        window.location.href = 'login.html'; 
    }
}
checkLoginStatus(); // Call the check function immediately when the script loads


const API_BASE_URL = 'http://localhost:8081/api';
let currentStudents = []; 

// -------------------------------------------------------------------
// TIME SLOT GENERATION FUNCTIONS
// -------------------------------------------------------------------

function formatTime(hour) {
  const period = hour >= 12 ? "pm" : "am";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

function generateTimeSlots(startHour = 6, endHour = 19) {
  const slots = [];
  for (let hour = startHour; hour < endHour; hour++) {
    const startTime = formatTime(hour);
    const endTime = formatTime(hour + 1);
    slots.push(`${startTime} - ${endTime}`);
  }
  return slots;
}

function populateBatchSelectors() {
    const slots = generateTimeSlots(6, 19); 
    const registerSelect = document.getElementById('student-batch');
    const attendanceSelect = document.getElementById('attendance-batch-input');
    
    registerSelect.innerHTML = '<option value="" disabled selected>Select Batch Time</option>';
    attendanceSelect.innerHTML = '<option value="" disabled selected>Select Batch Time to Load</option>';

    slots.forEach(slot => {
        const option = new Option(slot, slot);
        registerSelect.add(option);
        attendanceSelect.add(option.cloneNode(true));
    });
}

// -------------------------------------------------------------------
// UTILITY FUNCTIONS
// -------------------------------------------------------------------

function showStatus(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.style.color = isError ? '#dc3545' : '#28a745';
    setTimeout(() => { el.textContent = ''; }, 5000);
}

function initAnalysisSelectors() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthSelect = document.getElementById('analysis-month');
    const yearSelect = document.getElementById('analysis-year');
    const now = new Date();
    
    // Initialize months
    for (let i = 0; i < 12; i++) {
        monthSelect.options[i] = new Option(monthNames[i], i + 1);
    }
    monthSelect.value = now.getMonth() + 1;

    // Initialize years
    for (let i = now.getFullYear(); i >= now.getFullYear() - 5; i--) {
        yearSelect.options[yearSelect.options.length] = new Option(i, i);
    }
    yearSelect.value = now.getFullYear();
}


// -------------------------------------------------------------------
// 1. ADD STUDENT
// -------------------------------------------------------------------
document.getElementById('add-student-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const student = {
        studentName: document.getElementById('student-name').value,
        course: document.getElementById('student-course').value,
        batchName: document.getElementById('student-batch').value, // Use select value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student),
            credentials: 'include' // <-- FIX: Include credentials (session cookie)
        });

        if (response.ok) {
            const newStudent = await response.json();
            showStatus('add-status', `Student ${newStudent.id} added successfully!`, false);
            document.getElementById('add-student-form').reset();
        } else if (response.status === 401) {
            // Handle 401 specifically
             showStatus('add-status', 'Authentication failed. Please log in again.', true);
             window.location.href = 'login.html'; 
        } else {
            showStatus('add-status', 'Failed to add student. Check server logs.', true);
        }
    } catch (error) {
        showStatus('add-status', 'An error occurred connecting to the backend.', true);
        console.error('Error:', error);
    }
});


// -------------------------------------------------------------------
// 2. MARK ATTENDANCE - Load Students
// -------------------------------------------------------------------
async function loadBatchStudents() {
    const batchName = document.getElementById('attendance-batch-input').value; // Use select value
    if (!batchName) {
        showStatus('mark-status', 'Please select a batch time.', true);
        return;
    }

    document.getElementById('current-batch-display').textContent = batchName;
    const tbody = document.getElementById('student-list-table').getElementsByTagName('tbody')[0];
    tbody.innerHTML = ''; 
    document.getElementById('mark-btn').style.display = 'none';

    try {
        const response = await fetch(`${API_BASE_URL}/students/batch/${batchName}`, {
            credentials: 'include' // <-- FIX: Include credentials (session cookie)
        });

        if (response.status === 401) {
             showStatus('mark-status', 'Authentication failed. Please log in again.', true);
             window.location.href = 'login.html'; 
             return;
        }

        currentStudents = await response.json();

        if (currentStudents.length > 0) {
            currentStudents.forEach(student => {
                const row = tbody.insertRow();
                row.insertCell().textContent = student.id;
                row.insertCell().textContent = student.studentName;
                
                const statusCell = row.insertCell();
                statusCell.innerHTML = `
                    <select class="form-select glass-input attendance-status-select" name="status-${student.id}" required>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                    </select>
                `;
            });
            document.getElementById('mark-btn').style.display = 'block';
        } else {
            tbody.innerHTML = '<tr><td colspan="3">No students found for this batch.</td></tr>';
            showStatus('mark-status', 'No students found for this batch.', true);
        }
    } catch (error) {
        showStatus('mark-status', 'Error loading students from server.', true);
        console.error('Error loading students:', error);
    }
}


// -------------------------------------------------------------------
// 2. MARK ATTENDANCE - Submit
// -------------------------------------------------------------------
document.getElementById('attendance-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const records = [];
    const date = new Date().toISOString().slice(0, 10); 

    currentStudents.forEach(student => {
        const status = document.querySelector(`select[name="status-${student.id}"]`).value;
        records.push({
            student: { id: student.id }, 
            batchName: student.batchName,
            attendanceDate: date,
            status: status
        });
    });

    try {
        const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(records),
            credentials: 'include' // <-- FIX: Include credentials (session cookie)
        });

        if (response.ok) {
            showStatus('mark-status', 'Attendance marked successfully!', false);
        } else if (response.status === 401) {
             showStatus('mark-status', 'Authentication failed. Please log in again.', true);
             window.location.href = 'login.html'; 
        } else {
            showStatus('mark-status', 'Failed to mark attendance. Check server logs.', true);
        }
    } catch (error) {
        showStatus('mark-status', 'Error marking attendance.', true);
        console.error('Error marking attendance:', error);
    }
});


// -------------------------------------------------------------------
// 3. MONTHLY ANALYSIS - Redirection Logic
// -------------------------------------------------------------------

async function loadMonthlyAnalysis() {
    const studentId = document.getElementById('analysis-student-id').value;
    const year = document.getElementById('analysis-year').value;
    const month = document.getElementById('analysis-month').value;

    if (!studentId || !year || !month) {
        // IMPORTANT: Replaced alert() with a message box equivalent
        const modalBody = document.querySelector('#analysisModal .modal-body');
        modalBody.insertAdjacentHTML('beforeend', '<p class="text-danger mt-3" id="analysis-error-message">Please enter a Student ID, select a month, and a year.</p>');
        setTimeout(() => {
            document.getElementById('analysis-error-message')?.remove();
        }, 3000);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/attendance/analysis?studentId=${studentId}&year=${year}&month=${month}`, {
            credentials: 'include' // <-- FIX: Include credentials (session cookie)
        });
        
        if (response.status === 401) {
             console.error('Authentication failed during analysis fetch.');
             // Since we are in a modal, redirecting might be aggressive. Let's just prompt a relogin.
             document.querySelector('.modal-body').insertAdjacentHTML('beforeend', '<p class="text-danger mt-3">Authentication required. Please log in again.</p>');
             return;
        }

        const page = await response.json(); 
        
        // Store the data and parameters for the next page
        sessionStorage.setItem('analysisData', JSON.stringify(page.content));
        sessionStorage.setItem('studentId', studentId);
        sessionStorage.setItem('analysisMonth', month);
        sessionStorage.setItem('analysisYear', year);
        
        // Redirect to the new analysis page
        window.location.href = 'analysis.html'; 

    } catch (error) {
        // IMPORTANT: Replaced alert() with console/status logging
        console.error('Error loading analysis report data from server. Check server connection or Student ID.', error);
        document.querySelector('.modal-body').insertAdjacentHTML('beforeend', '<p class="text-danger mt-3">Error loading report data. Check server connection.</p>');
    }
}

// Initial setup on page load
window.onload = function() {
    populateBatchSelectors();
    initAnalysisSelectors();
};
