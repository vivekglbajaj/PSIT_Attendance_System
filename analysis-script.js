// frontend/analysis-script.js

document.addEventListener('DOMContentLoaded', loadReportFromStorage);

let myChart; 

function loadReportFromStorage() {
    const recordsString = sessionStorage.getItem('analysisData');
    const studentId = sessionStorage.getItem('studentId');
    const month = sessionStorage.getItem('analysisMonth');
    const year = sessionStorage.getItem('analysisYear');
    
    const headerEl = document.getElementById('report-header');
    const tbody = document.getElementById('analysis-table-body');
    
    // Clear storage after retrieval (optional, but good practice)
    sessionStorage.clear(); 
    
    if (!recordsString || !studentId) {
        headerEl.textContent = "Error: Report data not found.";
        tbody.innerHTML = '<tr><td colspan="2">Please go back and generate the report again.</td></tr>';
        return;
    }

    const records = JSON.parse(recordsString);
    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });
    headerEl.textContent = `Monthly Attendance Report for Student ID: ${studentId} (${monthName} ${year})`;


    let presentCount = 0;
    
    if (records && records.length > 0) {
        records.forEach(record => {
            if (record.status === 'Present') {
                presentCount++;
            }
            
            // Populate the table
            const row = tbody.insertRow();
            row.insertCell().textContent = record.attendanceDate; 
            const statusCell = row.insertCell();
            statusCell.textContent = record.status;
            statusCell.style.color = record.status === 'Present' ? '#28a745' : '#dc3545';
        });
        
        // Calculate percentage
        const totalDays = records.length;
        const presentPercentage = (presentCount / totalDays) * 100;
        const absentPercentage = 100 - presentPercentage;

        // Render the chart
        renderAttendanceChart(presentPercentage.toFixed(1), absentPercentage.toFixed(1));

    } else {
        tbody.innerHTML = '<tr><td colspan="2">No attendance records found for this period.</td></tr>';
        renderAttendanceChart(0, 0);
    }
}

// Chart rendering function
function renderAttendanceChart(present, absent) {
    const ctx = document.getElementById('attendanceRateChart').getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present (%)', 'Absent (%)'],
            datasets: [{
                data: [present, absent],
                backgroundColor: ['#10c9c9', '#ff6384'],
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.8)' }
                },
                title: {
                    display: true,
                    text: 'Monthly Attendance Summary',
                    color: '#fff'
                }
            }
        }
    });
}