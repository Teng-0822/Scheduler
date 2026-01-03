// =============================================================================
// COMPLETE JAVASCRIPT CODE FOR VIRTUAL ASSISTANT SCHEDULER
// =============================================================================
// Instructions: Add this script section to the HTML file before </body>
// This includes all functionality for client management, task scheduling,
// calendar filtering, notifications, and more.
// =============================================================================


// Global Variables

// Initialize data from localStorage with fallback
let tasks = loadFromLocalStorage('schedulerTasks', []);
let clients = loadFromLocalStorage('schedulerClients', []);

console.log('Initialized tasks:', tasks.length);
console.log('Initialized clients:', clients.length);


let currentDate = new Date();
let selectedDate = null;
let editingTaskId = null;
let editingClientId = null;
let currentFilter = 'all';
let currentClientFilter = 'all';
let scheduledNotifications = {};
let userProfile = {
    name: 'Guest User',
    email: '',
    avatar: '👤',
    mode: 'guest'
};
let currentTheme = 'default';

// Predefined Themes
const themes = {
    default: { name: 'Ocean Blue', primaryColor: '#4a90e2', primaryDark: '#357abd', bgGradientStart: '#667eea', bgGradientEnd: '#764ba2' },
    sunset: { name: 'Sunset', primaryColor: '#ff6b6b', primaryDark: '#ee5a6f', bgGradientStart: '#f093fb', bgGradientEnd: '#f5576c' },
    forest: { name: 'Forest', primaryColor: '#27ae60', primaryDark: '#229954', bgGradientStart: '#56ab2f', bgGradientEnd: '#a8e063' },
    lavender: { name: 'Lavender', primaryColor: '#9b59b6', primaryDark: '#8e44ad', bgGradientStart: '#a8c0ff', bgGradientEnd: '#3f2b96' },
    coral: { name: 'Coral', primaryColor: '#ff7979', primaryDark: '#eb4d4b', bgGradientStart: '#fa709a', bgGradientEnd: '#fee140' },
    midnight: { name: 'Midnight', primaryColor: '#3498db', primaryDark: '#2980b9', bgGradientStart: '#2c3e50', bgGradientEnd: '#3498db' }
};

const avatarOptions = ['👤', '😊', '😎', '🤓', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🦸', '🦹', '🧙', '🧝', '🧛'];

// Initialize App
function init() {
    checkFirstTime();
    loadUserProfile();
    loadTheme();
    loadTasks();
    loadClients();
    renderCalendar();
    renderAllTasks();
    renderClients();
    setupTabs();
    checkNotificationPermission();
    scheduleAllNotifications();
    renderThemeOptions();
    renderAvatarOptions();
    setupColorPickers();
    updateProfileDisplay();
    updateClientSelectors();
    
    // Set default date for new task using local timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    document.getElementById('taskDate').value = `${year}-${month}-${day}`;
}

// First Time User Flow
function checkFirstTime() {
    const hasVisited = localStorage.getItem('schedulerHasVisited');
    if (!hasVisited) {
        document.getElementById('welcomeModal').classList.add('active');
    }
}

function selectMode(mode) {
    localStorage.setItem('schedulerHasVisited', 'true');
    userProfile.mode = mode;
    localStorage.setItem('schedulerProfile', JSON.stringify(userProfile));
    document.getElementById('welcomeModal').classList.remove('active');
    
    if (mode === 'personal') {
        setTimeout(() => {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.querySelector('[data-tab="profile"]').classList.add('active');
            document.getElementById('profile').classList.add('active');
            alert('👋 Welcome! Please set up your profile to personalize your experience.');
        }, 300);
    }
}

// Client Management
function loadClients() {
    const stored = localStorage.getItem('schedulerClients');
    clients = stored ? JSON.parse(stored) : [];
}

function saveClients() {
    saveToLocalStorage('schedulerClients', clients);
}

function openAddClientModal() {
    editingClientId = null;
    document.getElementById('clientModalTitle').textContent = 'Add New Client';
    document.getElementById('clientForm').reset();
    document.getElementById('clientModal').classList.add('active');
}

function editClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    
    editingClientId = clientId;
    document.getElementById('clientModalTitle').textContent = 'Edit Client';
    document.getElementById('clientId').value = clientId;
    document.getElementById('clientName').value = client.name;
    document.getElementById('clientEmail').value = client.email || '';
    document.getElementById('clientPhone').value = client.phone || '';
    document.getElementById('clientNotes').value = client.notes || '';
    document.getElementById('clientModal').classList.add('active');
}

function closeClientModal() {
    document.getElementById('clientModal').classList.remove('active');
    document.getElementById('clientForm').reset();
    editingClientId = null;
}

function saveClient(event) {
    event.preventDefault();
    
    const clientData = {
        id: editingClientId || generateId(),
        name: document.getElementById('clientName').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value,
        notes: document.getElementById('clientNotes').value,
        createdAt: editingClientId ? clients.find(c => c.id === editingClientId).createdAt : new Date().toISOString()
    };
    
    if (editingClientId) {
        const index = clients.findIndex(c => c.id === editingClientId);
        if (index !== -1) clients[index] = clientData;
    } else {
        clients.push(clientData);
    }
    
    saveClients();
    closeClientModal();
    renderClients();
    updateClientSelectors();
}

function deleteClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    const clientTasks = tasks.filter(t => t.clientId === clientId);
    
    if (clientTasks.length > 0) {
        if (!confirm(`This client has ${clientTasks.length} task(s). Deleting the client will also delete all their tasks. Continue?`)) return;
        tasks = tasks.filter(t => t.clientId !== clientId);
        saveTasks();
    } else {
        if (!confirm(`Are you sure you want to delete ${client.name}?`)) return;
    }
    
    clients = clients.filter(c => c.id !== clientId);
    saveClients();
    renderClients();
    updateClientSelectors();
    renderCalendar();
    renderAllTasks();
}

function viewClientTasks(clientId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('[data-tab="tasks"]').classList.add('active');
    document.getElementById('tasks').classList.add('active');
    document.getElementById('taskClientFilter').value = clientId;
    currentClientFilter = clientId;
    renderAllTasks();
}

function renderClients() {
    const container = document.getElementById('clientsList');
    
    if (clients.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><h3>No clients yet</h3><p>Add your first client to get started!</p></div>';
        return;
    }
    
    const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    
    container.innerHTML = sortedClients.map(client => {
        const clientTasks = tasks.filter(t => t.clientId === client.id);
        return `
            <div class="client-card">
                <div class="client-card-header"><div class="client-name">${escapeHtml(client.name)}</div></div>
                ${client.email ? `<div class="client-info">📧 ${escapeHtml(client.email)}</div>` : ''}
                ${client.phone ? `<div class="client-info">📱 ${escapeHtml(client.phone)}</div>` : ''}
                ${client.notes ? `<div class="client-info">📝 ${escapeHtml(client.notes)}</div>` : ''}
                <div class="client-task-count">${clientTasks.length} task${clientTasks.length !== 1 ? 's' : ''}</div>
                <div style="display: flex; gap: 8px; margin-top: 15px; flex-wrap: wrap;">
                    <button class="btn btn-primary btn-small" onclick="viewClientTasks('${client.id}')">View Tasks</button>
                    <button class="btn btn-secondary btn-small" onclick="editClient('${client.id}')">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteClient('${client.id}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function updateClientSelectors() {
    const taskClientSelect = document.getElementById('taskClient');
    const calendarFilter = document.getElementById('calendarClientFilter');
    const taskFilter = document.getElementById('taskClientFilter');
    
    const currentTaskValue = taskClientSelect.value;
    const currentCalendarValue = calendarFilter.value;
    const currentTaskFilterValue = taskFilter.value;
    
    const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    
    taskClientSelect.innerHTML = '<option value="">Select a client</option>' +
        sortedClients.map(client => `<option value="${client.id}">${escapeHtml(client.name)}</option>`).join('');
    
    if (currentTaskValue) taskClientSelect.value = currentTaskValue;
    
    const filterOptions = '<option value="all">All Clients</option>' +
        sortedClients.map(client => `<option value="${client.id}">${escapeHtml(client.name)}</option>`).join('');
    
    calendarFilter.innerHTML = filterOptions;
    taskFilter.innerHTML = filterOptions;
    
    if (currentCalendarValue) calendarFilter.value = currentCalendarValue;
    if (currentTaskFilterValue) taskFilter.value = currentTaskFilterValue;
}

function filterCalendarByClient() {
    currentClientFilter = document.getElementById('calendarClientFilter').value;
    renderCalendar();
}

function filterTasksByClient() {
    currentClientFilter = document.getElementById('taskClientFilter').value;
    renderAllTasks();
}

// Profile Management
function loadUserProfile() {
    const stored = localStorage.getItem('schedulerProfile');
    if (stored) userProfile = JSON.parse(stored);
}

function saveProfile() {
    const name = document.getElementById('profileName').value.trim() || 'Guest User';
    const email = document.getElementById('profileEmail').value.trim();
    userProfile.name = name;
    userProfile.email = email;
    userProfile.mode = 'personal';
    localStorage.setItem('schedulerProfile', JSON.stringify(userProfile));
    updateProfileDisplay();
    alert('Profile saved successfully! ✅');
}

function updateProfileDisplay() {
    document.getElementById('headerName').textContent = userProfile.name;
    document.getElementById('headerAvatar').textContent = userProfile.avatar;
    document.getElementById('profileName').value = userProfile.name;
    document.getElementById('profileEmail').value = userProfile.email || '';
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.toggle('active', option.textContent === userProfile.avatar);
    });
}

function renderAvatarOptions() {
    const container = document.getElementById('avatarSelector');
    container.innerHTML = avatarOptions.map(avatar => 
        `<div class="avatar-option ${avatar === userProfile.avatar ? 'active' : ''}" onclick="selectAvatar('${avatar}')">${avatar}</div>`
    ).join('');
}

function selectAvatar(avatar) {
    userProfile.avatar = avatar;
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.toggle('active', option.textContent === avatar);
    });
    updateProfileDisplay();
}

function openProfileModal() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('[data-tab="profile"]').classList.add('active');
    document.getElementById('profile').classList.add('active');
}

function openSettingsModal() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('[data-tab="settings"]').classList.add('active');
    document.getElementById('settings').classList.add('active');
}

// Theme Management (functions: loadTheme, renderThemeOptions, selectTheme, applyTheme, setupColorPickers, updateColorPreviews, applyCustomTheme, adjustColor, resetToDefault)
function loadTheme() {
    const stored = localStorage.getItem('schedulerTheme');
    if (stored) {
        const themeData = JSON.parse(stored);
        currentTheme = themeData.name || 'default';
        applyTheme(themeData);
    }
}

function renderThemeOptions() {
    const container = document.getElementById('themeOptions');
    container.innerHTML = Object.entries(themes).map(([key, theme]) => {
        const isActive = currentTheme === key;
        return `<div class="theme-option ${isActive ? 'active' : ''}" onclick="selectTheme('${key}')" style="background: linear-gradient(135deg, ${theme.bgGradientStart} 0%, ${theme.bgGradientEnd} 100%); color: white;">${theme.name}</div>`;
    }).join('');
}

function selectTheme(themeKey) {
    currentTheme = themeKey;
    const theme = themes[themeKey];
    applyTheme(theme);
    localStorage.setItem('schedulerTheme', JSON.stringify({ name: themeKey, ...theme }));
    renderThemeOptions();
}

function applyTheme(theme) {
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--primary-dark', theme.primaryDark);
    document.documentElement.style.setProperty('--background-gradient-start', theme.bgGradientStart);
    document.documentElement.style.setProperty('--background-gradient-end', theme.bgGradientEnd);
    document.getElementById('primaryColor').value = theme.primaryColor;
    document.getElementById('bgGradientStart').value = theme.bgGradientStart;
    document.getElementById('bgGradientEnd').value = theme.bgGradientEnd;
    updateColorPreviews();
}

function setupColorPickers() {
    document.getElementById('primaryColor').addEventListener('input', updateColorPreviews);
    document.getElementById('bgGradientStart').addEventListener('input', updateColorPreviews);
    document.getElementById('bgGradientEnd').addEventListener('input', updateColorPreviews);
}

function updateColorPreviews() {
    document.getElementById('primaryPreview').style.background = document.getElementById('primaryColor').value;
    document.getElementById('bgStartPreview').style.background = document.getElementById('bgGradientStart').value;
    document.getElementById('bgEndPreview').style.background = document.getElementById('bgGradientEnd').value;
}

function applyCustomTheme() {
    const customTheme = {
        name: 'custom',
        primaryColor: document.getElementById('primaryColor').value,
        primaryDark: adjustColor(document.getElementById('primaryColor').value, -20),
        bgGradientStart: document.getElementById('bgGradientStart').value,
        bgGradientEnd: document.getElementById('bgGradientEnd').value
    };
    currentTheme = 'custom';
    applyTheme(customTheme);
    localStorage.setItem('schedulerTheme', JSON.stringify(customTheme));
    renderThemeOptions();
    alert('Custom theme applied! 🎨');
}

function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

function resetToDefault() {
    if (confirm('Are you sure you want to reset to the default theme?')) {
        currentTheme = 'default';
        selectTheme('default');
        alert('Theme reset to default! 🔄');
    }
}

// Tab Navigation
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(tabId).classList.add('active');
            if (tabId === 'tasks') renderAllTasks();
            else if (tabId === 'calendar') renderCalendar();
            else if (tabId === 'clients') renderClients();
            else if (tabId === 'profile') updateProfileDisplay();
            else if (tabId === 'settings') renderThemeOptions();
        });
    });
}

// LocalStorage Functions
function loadTasks() {
    const stored = localStorage.getItem('schedulerTasks');
    tasks = stored ? JSON.parse(stored) : [];
}

function saveTasks() {
    saveToLocalStorage('schedulerTasks', tasks);
}


function saveClients() {
    saveToLocalStorage('schedulerClients', clients);
}


// Calendar Rendering with Task Preview Tooltips
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    let html = '';
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => { html += `<div class="calendar-day-header">${day}</div>`; });
    
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        html += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }
    
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateStr = formatDate(date);
        const isToday = date.toDateString() === today.toDateString();
        let dayTasks = getTasksForDate(dateStr);
        
        if (currentClientFilter !== 'all') {
            dayTasks = dayTasks.filter(t => t.clientId === currentClientFilter);
        }
        
        const hasTasks = dayTasks.length > 0;
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (hasTasks) classes += ' has-tasks';
        
        let taskPreview = '';
        if (hasTasks) {
            if (dayTasks.length === 1) {
                const task = dayTasks[0];
                const client = clients.find(c => c.id === task.clientId);
                const clientName = client ? client.name : 'Unknown Client';
                taskPreview = `<div class="task-preview">1 task - ${escapeHtml(clientName)}</div>`;
            } else if (dayTasks.length <= 3) {
                taskPreview = '<div class="task-preview">';
                dayTasks.forEach(task => {
                    const client = clients.find(c => c.id === task.clientId);
                    taskPreview += `<div class="task-preview-item">${formatTime(task.startTime)} - ${escapeHtml(task.title)}${client ? ' (' + escapeHtml(client.name) + ')' : ''}</div>`;
                });
                taskPreview += '</div>';
            } else {
                taskPreview = `<div class="task-preview">${dayTasks.length} tasks scheduled</div>`;
            }
        }
        
        html += `<div class="${classes}" onclick="selectDate('${dateStr}')">
            <div class="day-number">${day}</div>
            ${hasTasks ? `<div class="day-task-count">${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''}</div>` : ''}
            ${taskPreview}
        </div>`;
    }
    
    const remainingDays = 42 - (startingDayOfWeek + daysInMonth);
    for (let day = 1; day <= remainingDays; day++) {
        html += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }
    
    document.getElementById('calendarGrid').innerHTML = html;
}

function changeMonth(direction) {
    if (direction === 0) currentDate = new Date();
    else currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    const date = new Date(dateStr + 'T00:00:00');
    document.getElementById('taskDate').value = dateStr;
    
    // Get tasks for this date
    let dayTasks = getTasksForDate(dateStr);
    if (currentClientFilter !== 'all') {
        dayTasks = dayTasks.filter(t => t.clientId === currentClientFilter);
    }
    
    // If no tasks, open add task modal directly
    if (dayTasks.length === 0) {
        openAddTaskModal();
    } else {
        // If there are tasks, show choice modal
        const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('dateActionTitle').textContent = `${formatted}`;
        
        // Show task list in the modal
        const taskListHtml = dayTasks.map(task => {
            const client = clients.find(c => c.id === task.clientId);
            const clientName = client ? client.name : 'Unknown Client';
            return `<div style="padding:10px;background:var(--bg-light);border-radius:8px;margin-bottom:8px;border-left:4px solid var(--primary-color)">
                <div style="font-weight:700;margin-bottom:5px">${escapeHtml(task.title)}</div>
                <div style="font-size:0.9em;color:var(--text-light)">🕐 ${formatTime(task.startTime)} • 👤 ${escapeHtml(clientName)}</div>
            </div>`;
        }).join('');
        
        document.getElementById('dateActionTaskList').innerHTML = `
            <div style="margin-bottom:15px">
                <h4 style="color:var(--primary-color);margin-bottom:10px">${dayTasks.length} task${dayTasks.length > 1 ? 's' : ''} scheduled:</h4>
                ${taskListHtml}
            </div>
        `;
        
        document.getElementById('dateActionModal').classList.add('active');
    }
}

// Task Management
function getTasksForDate(dateStr) {
    return tasks.filter(task => task.date === dateStr);
}

function getUrgencyValue(urgency) {
    const values = { urgent: 4, high: 3, medium: 2, low: 1 };
    return values[urgency] || 0;
}

function renderTaskItem(task) {
    const client = clients.find(c => c.id === task.clientId);
    const clientName = client ? client.name : 'Unknown Client';
    const endTime = task.endTime ? ` - ${formatTime(task.endTime)}` : '';
    const reminderText = task.reminder > 0 ? `🔔 ${task.reminder >= 1440 ? task.reminder / 1440 + ' day' : task.reminder + ' min'} before` : '';
    
    return `
        <div class="task-item urgency-${task.urgency}">
            <div class="task-header">
                <div class="task-title">
                    <span class="client-badge">${escapeHtml(clientName)}</span>
                    ${escapeHtml(task.title)}
                </div>
                <div class="task-urgency ${task.urgency}">${task.urgency}</div>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
                <div class="task-meta-item">📅 ${formatDateDisplay(task.date)}</div>
                <div class="task-meta-item">🕐 ${formatTime(task.startTime)}${endTime}</div>
                ${reminderText ? `<div class="task-meta-item">${reminderText}</div>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn btn-primary btn-small" onclick="editTask('${task.id}')">Edit</button>
                <button class="btn btn-danger btn-small" onclick="deleteTask('${task.id}')">Delete</button>
            </div>
        </div>
    `;
}

function renderAllTasks() {
    const container = document.getElementById('allTasksList');
    let filteredTasks = [...tasks];
    
    if (currentClientFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.clientId === currentClientFilter);
    }
    
    if (currentFilter === 'upcoming') {
        const today = new Date().toISOString().split('T')[0];
        filteredTasks = filteredTasks.filter(task => task.date >= today);
    } else if (currentFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.urgency === currentFilter);
    }
    
    if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><h3>No tasks found</h3><p>Create your first task to get started!</p></div>';
        return;
    }
    
    filteredTasks.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        const urgencyCompare = getUrgencyValue(b.urgency) - getUrgencyValue(a.urgency);
        if (urgencyCompare !== 0) return urgencyCompare;
        return a.startTime.localeCompare(b.startTime);
    });
    
    container.innerHTML = filteredTasks.map(task => renderTaskItem(task)).join('');
}

function filterTasks(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    renderAllTasks();
}

function closeDateActionModal() {
    document.getElementById('dateActionModal').classList.remove('active');
}

function viewDateTasks() {
    closeDateActionModal();
    // Switch to tasks tab and filter by date
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector('[data-tab="tasks"]').classList.add('active');
    document.getElementById('tasks').classList.add('active');
    renderAllTasks();
}

function addTaskForDate() {
    closeDateActionModal();
    openAddTaskModal();
}

function toggleThemeSelection() {
    const panel = document.getElementById('themeSelectionPanel');
    const icon = document.getElementById('themeToggleIcon');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        icon.textContent = '▲';
    } else {
        panel.style.display = 'none';
        icon.textContent = '▼';
    }
}

function toggleCustomColors() {
    const panel = document.getElementById('customColorsPanel');
    const icon = document.getElementById('colorsToggleIcon');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        icon.textContent = '▲';
    } else {
        panel.style.display = 'none';
        icon.textContent = '▼';
    }
}

// Modal Functions
function openAddTaskModal() {
    if (clients.length === 0) {
        alert('Please add a client first before creating a task!');
        openAddClientModal();
        return;
    }
    
    editingTaskId = null;
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    
    // Set date properly using local timezone
    if (selectedDate) {
        document.getElementById('taskDate').value = selectedDate;
    } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        document.getElementById('taskDate').value = `${year}-${month}-${day}`;
    }
    
    // Set current time (not +1 hour)
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('taskStartTime').value = `${hours}:${minutes}`;
    
    document.getElementById('taskModal').classList.add('active');
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('taskId').value = taskId;
    document.getElementById('taskClient').value = task.clientId;
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskDate').value = task.date;
    document.getElementById('taskStartTime').value = task.startTime;
    document.getElementById('taskEndTime').value = task.endTime || '';
    document.getElementById('taskUrgency').value = task.urgency;
    document.getElementById('taskReminder').value = task.reminder;
    document.getElementById('taskModal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    document.getElementById('taskForm').reset();
    editingTaskId = null;
}

function saveTask(event) {
    event.preventDefault();
    
    const taskData = {
        id: editingTaskId || generateId(),
        clientId: document.getElementById('taskClient').value,
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        date: document.getElementById('taskDate').value,
        startTime: document.getElementById('taskStartTime').value,
        endTime: document.getElementById('taskEndTime').value,
        urgency: document.getElementById('taskUrgency').value,
        reminder: parseInt(document.getElementById('taskReminder').value)
    };
    
    // Check if task time is within 10 minutes from now
    const taskDateTime = new Date(`${taskData.date}T${taskData.startTime}`);
    const now = new Date();
    const timeDiff = (taskDateTime - now) / 1000 / 60; // difference in minutes
    
    if (timeDiff < 10 && timeDiff > 0) {
        showToast('⚠️ Warning: Task is scheduled within 10 minutes! Consider adding more time.', 'warning');
    } else if (timeDiff <= 0) {
        showToast('⚠️ Warning: Task time has already passed!', 'error');
    }
    
    if (editingTaskId) {
        const index = tasks.findIndex(t => t.id === editingTaskId);
        if (index !== -1) {
            cancelNotification(editingTaskId);
            tasks[index] = taskData;
        }
    } else {
        tasks.push(taskData);
    }
    
    saveTasks();
    scheduleNotification(taskData);
    closeTaskModal();
    renderCalendar();
    renderAllTasks();
    renderClients();
    
    if (timeDiff >= 10 || timeDiff < 0) {
        showToast('✅ Task saved successfully!', 'success');
    }
}

function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    cancelNotification(taskId);
    tasks = tasks.filter(t => t.id !== taskId);
    saveTasks();
    renderCalendar();
    renderAllTasks();
    renderClients();
}

// Export/Import Functions
function exportTasks() {
    const exportData = { tasks: tasks, clients: clients };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scheduler-backup-${formatDate(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Tasks and clients exported successfully!');
}

function exportTasksICS() {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Virtual Assistant Scheduler//EN\nCALSCALE:GREGORIAN\n';
    
    tasks.forEach(task => {
        const client = clients.find(c => c.id === task.clientId);
        const clientName = client ? client.name : 'Unknown Client';
        const startDateTime = new Date(`${task.date}T${task.startTime}`);
        const endDateTime = task.endTime ? new Date(`${task.date}T${task.endTime}`) : new Date(startDateTime.getTime() + 60 * 60 * 1000);
        const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        let alarm = '';
        if (task.reminder > 0) {
            alarm = `BEGIN:VALARM\nTRIGGER:-PT${task.reminder}M\nACTION:DISPLAY\nDESCRIPTION:${task.title} - ${clientName}\nEND:VALARM\n`;
        }
        
        icsContent += `BEGIN:VEVENT\nUID:${task.id}@scheduler.app\nDTSTAMP:${formatICSDate(new Date())}\nDTSTART:${formatICSDate(startDateTime)}\nDTEND:${formatICSDate(endDateTime)}\nSUMMARY:${task.title} - ${clientName}\n`;
        if (task.description) icsContent += `DESCRIPTION:Client: ${clientName}\\n${task.description.replace(/\n/g, '\\n')}\n`;
        icsContent += `PRIORITY:${task.urgency === 'urgent' ? '1' : task.urgency === 'high' ? '3' : task.urgency === 'medium' ? '5' : '7'}\n${alarm}END:VEVENT\n`;
    });
    
    icsContent += 'END:VCALENDAR';
    const dataBlob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scheduler-calendar-${formatDate(new Date())}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    alert('✅ Calendar exported! Open the file on your phone to add events to your calendar.');
}

function importTasks() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    if (!file) { alert('Please select a file to import'); return; }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!importedData.tasks || !Array.isArray(importedData.tasks)) throw new Error('Invalid file format');
            
            if (importedData.clients && Array.isArray(importedData.clients)) {
                const existingClientIds = new Set(clients.map(c => c.id));
                const newClients = importedData.clients.filter(c => !existingClientIds.has(c.id));
                clients = [...clients, ...newClients];
                saveClients();
            }
            
            const existingTaskIds = new Set(tasks.map(t => t.id));
            const newTasks = importedData.tasks.filter(t => !existingTaskIds.has(t.id));
            tasks = [...tasks, ...newTasks];
            saveTasks();
            
            scheduleAllNotifications();
            renderCalendar();
            renderAllTasks();
            renderClients();
            updateClientSelectors();
            alert(`✅ Imported ${newTasks.length} task(s) successfully!`);
            fileInput.value = '';
        } catch (error) {
            alert('❌ Error importing file: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Notification Functions
function checkNotificationPermission() {
    if (!('Notification' in window)) { console.log('Notifications not supported'); return; }
    if (Notification.permission === 'default') document.getElementById('notificationBanner').style.display = 'flex';
}

function requestNotificationPermission() {
    if (!('Notification' in window)) { alert('Notifications are not supported in this browser'); return; }
    
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            document.getElementById('notificationBanner').style.display = 'none';
            new Notification('Notifications Enabled! 🎉', { body: 'You will now receive reminders for your tasks.' });
            scheduleAllNotifications();
        } else {
            alert('Notification permission denied. You won\'t receive reminders.');
        }
    });
}

function scheduleNotification(task) {
    if (!('Notification' in window) || Notification.permission !== 'granted' || task.reminder === 0) return;
    
    const taskDateTime = new Date(`${task.date}T${task.startTime}`);
    const reminderTime = new Date(taskDateTime.getTime() - (task.reminder * 60 * 1000));
    const now = new Date();
    if (reminderTime <= now) return;
    
    const delay = reminderTime.getTime() - now.getTime();
    cancelNotification(task.id);
    
    const timeoutId = setTimeout(() => {
        showNotification(task);
        delete scheduledNotifications[task.id];
    }, delay);
    
    scheduledNotifications[task.id] = timeoutId;
}

function scheduleAllNotifications() {
    Object.values(scheduledNotifications).forEach(timeoutId => clearTimeout(timeoutId));
    scheduledNotifications = {};
    tasks.forEach(task => scheduleNotification(task));
}

function cancelNotification(taskId) {
    if (scheduledNotifications[taskId]) {
        clearTimeout(scheduledNotifications[taskId]);
        delete scheduledNotifications[taskId];
    }
}

function showNotification(task) {
    const client = clients.find(c => c.id === task.clientId);
    const clientName = client ? client.name : 'Unknown Client';
    const title = `🔔 Reminder: ${task.title}`;
    const body = `Client: ${clientName}\n${task.description || 'Task starts at ' + formatTime(task.startTime)}`;
    
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, { body: body, requireInteraction: true, tag: task.id });
        notification.onclick = () => { window.focus(); notification.close(); };
    } else {
        alert(`${title}\n\n${body}`);
    }
}

// Utility Functions
function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }
function formatDate(date) { 
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function formatDateDisplay(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
document.getElementById('taskModal').addEventListener('click', (e) => {
    if (e.target.id === 'taskModal') closeTaskModal();
});

document.getElementById('clientModal').addEventListener('click', (e) => {
    if (e.target.id === 'clientModal') closeClientModal();
});

document.getElementById('dateActionModal').addEventListener('click', (e) => {
    if (e.target.id === 'dateActionModal') closeDateActionModal();
});

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}



// Live Clock Function
function updateClock() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('liveClock').textContent = now.toLocaleString('en-US', options);
}

// Toast Notification Function
function showToast(message, type = 'warning') {
    const toast = document.getElementById('toastNotification');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}




// Enhanced localStorage persistence with verification
function saveToLocalStorage(key, data) {
    try {
        const jsonString = JSON.stringify(data);
        localStorage.setItem(key, jsonString);
        
        // Verify it was saved
        const saved = localStorage.getItem(key);
        if (saved === jsonString) {
            console.log('✅ Saved to localStorage:', key, data.length || 'items');
            return true;
        } else {
            console.error('❌ localStorage save verification failed for:', key);
            return false;
        }
    } catch (error) {
        console.error('❌ Error saving to localStorage:', key, error);
        showToast('⚠️ Error saving data: ' + error.message, 'error');
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            console.log('✅ Loaded from localStorage:', key, parsed.length || 'items');
            return parsed;
        }
        console.log('ℹ️ No data found for:', key, 'using default');
        return defaultValue;
    } catch (error) {
        console.error('❌ Error loading from localStorage:', key, error);
        return defaultValue;
    }
}

// Test localStorage availability
function testLocalStorage() {
    try {
        const testKey = '_localStorage_test';
        localStorage.setItem(testKey, 'test');
        const result = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (result === 'test') {
            console.log('✅ localStorage is working');
            return true;
        } else {
            console.error('❌ localStorage test failed');
            return false;
        }
    } catch (error) {
        console.error('❌ localStorage is not available:', error);
        showToast('⚠️ Warning: Data may not persist', 'warning');
        return false;
    }
}



// Theme Management with localStorage
function saveTheme(themeName) {
    localStorage.setItem('selectedTheme', themeName);
    applyTheme(themeName);
    showToast('Theme saved: ' + themeName, 'success');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('selectedTheme');
    if (savedTheme) {
        applyTheme(savedTheme);
        // Update active button
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.textContent.toLowerCase().includes(savedTheme.toLowerCase())) {
                opt.classList.add('active');
            }
        });
    }
}

function applyTheme(themeName) {
    const root = document.documentElement;
    
    switch(themeName.toLowerCase()) {
        case 'ocean':
            root.style.setProperty('--primary-color', '#0077be');
            root.style.setProperty('--primary-dark', '#005a8c');
            root.style.setProperty('--background-gradient-start', '#667eea');
            root.style.setProperty('--background-gradient-end', '#764ba2');
            break;
        case 'sunset':
            root.style.setProperty('--primary-color', '#ff6b6b');
            root.style.setProperty('--primary-dark', '#ee5a52');
            root.style.setProperty('--background-gradient-start', '#f857a6');
            root.style.setProperty('--background-gradient-end', '#ff5858');
            break;
        case 'forest':
            root.style.setProperty('--primary-color', '#27ae60');
            root.style.setProperty('--primary-dark', '#229954');
            root.style.setProperty('--background-gradient-start', '#56ab2f');
            root.style.setProperty('--background-gradient-end', '#a8e063');
            break;
        case 'purple':
            root.style.setProperty('--primary-color', '#9b59b6');
            root.style.setProperty('--primary-dark', '#8e44ad');
            root.style.setProperty('--background-gradient-start', '#667eea');
            root.style.setProperty('--background-gradient-end', '#764ba2');
            break;
        case 'midnight':
            root.style.setProperty('--primary-color', '#34495e');
            root.style.setProperty('--primary-dark', '#2c3e50');
            root.style.setProperty('--background-gradient-start', '#2c3e50');
            root.style.setProperty('--background-gradient-end', '#4ca1af');
            break;
        default: // Default/Blue
            root.style.setProperty('--primary-color', '#4a90e2');
            root.style.setProperty('--primary-dark', '#357abd');
            root.style.setProperty('--background-gradient-start', '#667eea');
            root.style.setProperty('--background-gradient-end', '#764ba2');
    }
}

// Avatar Management with localStorage
function saveAvatar(emoji) {
    localStorage.setItem('selectedAvatar', emoji);
    document.querySelector('.profile-avatar').textContent = emoji;
    showToast('Avatar updated!', 'success');
}

function loadAvatar() {
    const savedAvatar = localStorage.getItem('selectedAvatar');
    if (savedAvatar) {
        document.querySelector('.profile-avatar').textContent = savedAvatar;
        // Update active state
        document.querySelectorAll('.avatar-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.textContent === savedAvatar) {
                opt.classList.add('active');
            }
        });
    }
}


// CODE VERIFICATION
const API_URL = 'https://script.google.com/macros/s/AKfycbxgqSuVElhn3DNsqxG2I-GXZbjUgMFrqtUzKFlqVk-jeON6wjv6LLhswk8a5u2SnUFakQ/exec';


// Tab Switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        switchTab(targetTab);
    });
});

function switchTab(tabName) {
    // Remove active class from all tabs and buttons
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to selected tab and button
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}


window.addEventListener('DOMContentLoaded', function() {
    // Test localStorage
    testLocalStorage();
    
    // Log current storage
    console.log('=== LOCALSTORAGE STATUS ===');
    console.log('Tasks:', localStorage.getItem('schedulerTasks') ? 'Found' : 'Empty');
    console.log('Clients:', localStorage.getItem('schedulerClients') ? 'Found' : 'Empty');
    console.log('Verified:', localStorage.getItem('verified'));
    console.log('========================');

    // Check if already verified
    if (localStorage.getItem('verified') === 'true') {
        // Check if code was revoked
        checkRevoke();
    } else {
        document.getElementById('givenNameInput').focus();
    }
    
    // Enter key support
    document.getElementById('codeInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') verifyAccessCode();
    });
    
    // Button click
    document.getElementById('codeBtn').addEventListener('click', verifyAccessCode);
});

async function verifyAccessCode() {
    const givenNameInput = document.getElementById('givenNameInput');
    const lastNameInput = document.getElementById('lastNameInput');
    const codeInput = document.getElementById('codeInput');
    const error = document.getElementById('codeError');
    const btn = document.getElementById('codeBtn');
    const givenName = givenNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const code = codeInput.value.trim().toUpperCase();
    
    error.textContent = '';
    
    if (!givenName) {
        error.textContent = 'Please enter your given name';
        givenNameInput.focus();
        return;
    }
    
    if (!lastName) {
        error.textContent = 'Please enter your last name';
        lastNameInput.focus();
        return;
    }
    
    if (!code) {
        error.textContent = 'Please enter a code';
        codeInput.focus();
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'VERIFYING...';
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'text/plain'},
            body: JSON.stringify({action: 'verify', code: code, givenName: givenName, lastName: lastName}),
            redirect: 'follow'
        });
        
        const text = await response.text();
        const data = JSON.parse(text);
        
        if (data.success) {
            // Success!
            localStorage.setItem('verified', 'true');
            localStorage.setItem('code', code);
            localStorage.setItem('givenName', givenName);
            localStorage.setItem('lastName', lastName);
            
            // Update profile display
            updateProfile(lastName, givenName);
            btn.textContent = '✓ SUCCESS!';
            btn.style.background = 'var(--success-color)';
            showToast(data.message, 'success');
            
            setTimeout(() => {
                document.getElementById('codeModal').style.display = 'none';
                document.querySelector('.container').classList.remove('hide-app');
            }, 1200);
        } else {
            // Error
            error.textContent = data.message;
            showToast(data.message, 'error');
            btn.disabled = false;
            btn.textContent = 'VERIFY & CONTINUE';
        }
        
    } catch (err) {
        error.textContent = 'Connection error. Check internet and try again.';
        showToast('❌ Connection error', 'error');
        btn.disabled = false;
        btn.textContent = 'VERIFY & CONTINUE';
    }
}

async function checkRevoke() {
    const code = localStorage.getItem('code');
    if (!code) {
        showCodeModal();
        return;
    }
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {'Content-Type': 'text/plain'},
            body: JSON.stringify({action: 'checkRevoke', code: code}),
            redirect: 'follow'
        });
        
        const text = await response.text();
        const data = JSON.parse(text);
        
        if (data.revoked) {
            // Code was revoked!
            showToast('⚠️ Your access has been revoked. Please contact admin.', 'warning');
            localStorage.removeItem('verified');
            localStorage.removeItem('code');
            localStorage.removeItem('givenName');
            localStorage.removeItem('lastName');
            showCodeModal();
        } else {
            // Still valid, show app
            document.getElementById('codeModal').style.display = 'none';
            document.querySelector('.container').classList.remove('hide-app');
            
            // Update profile from localStorage
            const lastName = localStorage.getItem('lastName');
            const givenName = localStorage.getItem('givenName');
            if (lastName && givenName) {
                updateProfile(lastName, givenName);
            }
            
            // Render calendar on successful login
            renderCalendar();
            renderAllTasks();
            renderClients();
            
            // Load saved theme and avatar
            loadTheme();
            loadAvatar();
            updateProfileDisplay();
            
            // Start periodic check every 5 minutes
            setInterval(checkRevoke, 5 * 60 * 1000);
        }
    } catch (err) {
        // If offline or error, allow access anyway (offline mode)
        document.getElementById('codeModal').style.display = 'none';
        document.querySelector('.container').classList.remove('hide-app');
        
        // Update profile from localStorage
        const lastName = localStorage.getItem('lastName');
        const givenName = localStorage.getItem('givenName');
        if (lastName && givenName) {
            updateProfile(lastName, givenName);
        }
        
        // Render calendar on successful login
        renderCalendar();
        renderAllTasks();
        renderClients();
        
        // Load saved theme and avatar
        loadTheme();
        loadAvatar();
    }
}

function showCodeModal() {
    document.getElementById('codeModal').style.display = 'flex';
    document.querySelector('.container').classList.add('hide-app');
    document.getElementById('givenNameInput').focus();
}


function updateProfileDisplay() {
    const lastName = localStorage.getItem('lastName');
    const givenName = localStorage.getItem('givenName');
    const code = localStorage.getItem('code');
    
    if (lastName && givenName) {
        const displayName = lastName + ', ' + givenName;
        const nameElement = document.getElementById('profileDisplayName');
        if (nameElement) {
            nameElement.textContent = displayName;
        }
    }
    
    if (code) {
        const codeElement = document.getElementById('profileDisplayCode');
        if (codeElement) {
            codeElement.textContent = code;
        }
    }
}


function updateProfile(lastName, givenName) {
    // Update profile name display
    const fullName = lastName + ', ' + givenName;
    document.querySelector('.profile-name').textContent = fullName;
    
    // Update avatar with first letter of last name
    document.querySelector('.profile-avatar').textContent = lastName.charAt(0).toUpperCase();
}

function logoutCode() {
    if (confirm('Logout? You will need a new access code.')) {
        localStorage.removeItem('verified');
        localStorage.removeItem('code');
        localStorage.removeItem('givenName');
        localStorage.removeItem('lastName');
        location.reload();
    }
}


// Start the clock
setInterval(updateClock, 1000);
updateClock();

// Settings Modal Functions
function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
    loadTheme();
    loadAvatar();
    updateProfileDisplay();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const settingsModal = document.getElementById('settingsModal');
    if (event.target === settingsModal) {
        closeSettingsModal();
    }
});
