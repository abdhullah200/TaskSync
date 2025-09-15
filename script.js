// Google Calendar API Configuration

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';

const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY_HERE';


const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Initialize Google API - Make these functions global
function gapiLoaded() {
    console.log('GAPI script loaded, initializing client...');
    if (window.gapi && window.gapi.load) {
        window.gapi.load('client', initializeGapi);
    } else {
        console.error('GAPI not properly loaded, retrying...');
        setTimeout(() => {
            if (window.gapi && window.gapi.load) {
                window.gapi.load('client', initializeGapi);
            } else {
                console.error('GAPI failed to load completely');
            }
        }, 1000);
    }
}

async function initializeGapi() {
    try {
        await window.gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
        });
        gapiInited = true;
        maybeEnableButtons();
        console.log('Google API initialized successfully');
    } catch (error) {
        console.error('Error initializing Google API:', error);
        alert('Google API initialization failed. Please check your API key.');
    }
}

function gisLoaded() {
    console.log('Google Identity Services script loaded, initializing...');
    if (typeof google !== 'undefined' && google.accounts) {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: '',
        });
        gisInited = true;
        maybeEnableButtons();
        console.log('Google Identity Services loaded successfully');
    } else {
        console.error('Google Identity Services not loaded properly');
    }
}

function addTask() {
    const taskInput = document.querySelector('.add-task input[type="text"]:first-child');
    const descriptionInput = document.querySelector('.add-task input[type="text"]:nth-child(2)');
    const dateInput = document.querySelector('.date-input');
    const prioritySelect = document.querySelector('.priority-select');
    
    const taskValue = taskInput.value.trim();
    const descriptionValue = descriptionInput.value.trim();
    const dateValue = dateInput.value;
    const priorityValue = prioritySelect.value;

    if (taskValue) {
        const task = {
            id: Date.now(),
            title: taskValue,
            description: descriptionValue || 'No description provided',
            dueDate: dateValue,
            priority: priorityValue,
            completed: false
        };
        
        saveTask(task);
        createTaskElement(task);
        
        // Clear inputs
        taskInput.value = '';
        descriptionInput.value = '';
        dateInput.value = '';
        prioritySelect.value = 'normal';
    }
}

function createTaskElement(task) {
    const taskGrid = document.querySelector('.task-grid');
    const taskCard = document.createElement('div');
    taskCard.classList.add('task-card');
    taskCard.classList.add(task.priority);
    taskCard.setAttribute('data-id', task.id);
    
    let dateDisplay = '';
    if (task.dueDate) {
        const date = new Date(task.dueDate);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        dateDisplay = `<div class="task-date">Due: ${date.toLocaleDateString('en-US', options)}</div>`;
    }
    
    taskCard.innerHTML = `
        <h3>${task.title}</h3>
        <p>${task.description}</p>
        ${dateDisplay}
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
    `;
    
    taskGrid.appendChild(taskCard);
}

function saveTask(task) {
    let tasks = getTasks();
    tasks.push(task);
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

function getTasks() {
    const tasks = localStorage.getItem('todoTasks');
    return tasks ? JSON.parse(tasks) : [];
}

function loadTasks() {
    const tasks = getTasks();
    tasks.forEach(task => {
        createTaskElement(task);
    });
}

function deleteTask(taskId) {
    let tasks = getTasks();
    tasks = tasks.filter(task => task.id !== taskId);
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
    
    const taskElement = document.querySelector(`[data-id="${taskId}"]`);
    if (taskElement) {
        taskElement.remove();
    }
}

function filterTasks(priority) {
    const allTasks = document.querySelectorAll('.task-card');
    
    allTasks.forEach(task => {
        if (priority === 'all' || task.classList.contains(priority)) {
            task.style.display = 'block';
        } else {
            task.style.display = 'none';
        }
    });
}

function maybeEnableButtons() {
    console.log('Checking if APIs are ready:', { gapiInited, gisInited });
    if (gapiInited && gisInited) {
        const syncBtn = document.querySelector('.calendar-sync-btn');
        if (syncBtn) {
            syncBtn.textContent = 'Sync to Google Calendar';
            syncBtn.style.visibility = 'visible';
            syncBtn.disabled = false;
            console.log('✅ Google Calendar sync button enabled');
        }
    }
}

async function addTaskToGoogleCalendar(task) {
    console.log('Task being synced:', task);
    console.log('Task due date:', task.dueDate);
    
    if (!task.dueDate || task.dueDate === '') {
        alert('Please add a due date to sync with Google Calendar. Make sure to select both date and time.');
        return;
    }

    // Check if Google APIs are ready
    if (!gapiInited || !gisInited || !tokenClient) {
        alert('Google Calendar integration is not ready yet. Please wait a moment and try again.');
        return;
    }

    // Show loading message
    const syncBtn = document.querySelector('.calendar-sync-btn');
    const originalText = syncBtn.textContent;
    syncBtn.textContent = 'Signing in...';
    syncBtn.disabled = true;

    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error:', resp.error);
            alert('Authentication failed. Please try again.');
            syncBtn.textContent = originalText;
            syncBtn.disabled = false;
            return;
        }

        syncBtn.textContent = 'Adding to calendar...';

        try {
            const startDate = new Date(task.dueDate);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

            const event = {
                'summary': task.title,
                'description': task.description,
                'start': {
                    'dateTime': startDate.toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                'end': {
                    'dateTime': endDate.toISOString(),
                    'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
                }
            };

            const request = gapi.client.calendar.events.insert({
                'calendarId': 'primary',
                'resource': event
            });

            const response = await request;
            alert('✅ Task successfully added to your Google Calendar!');
            console.log('Event created: ' + response.result.htmlLink);
        } catch (error) {
            console.error('Error adding to calendar:', error);
            alert('❌ Error adding task to Google Calendar. Please check your permissions and try again.');
        }

        syncBtn.textContent = originalText;
        syncBtn.disabled = false;
    };

    if (gapi.client.getToken() === null) {
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        tokenClient.requestAccessToken({prompt: ''});
    }
}

function syncLastTaskToCalendar() {
    // First check if there are current inputs that haven't been saved
    const taskInput = document.querySelector('.add-task input[type="text"]:first-child');
    const descriptionInput = document.querySelector('.add-task input[type="text"]:nth-child(2)');
    const dateInput = document.querySelector('.date-input');
    const prioritySelect = document.querySelector('.priority-select');
    
    // If there are current inputs, use those
    if (taskInput.value.trim()) {
        const currentTask = {
            id: Date.now(),
            title: taskInput.value.trim(),
            description: descriptionInput.value.trim() || 'No description provided',
            dueDate: dateInput.value,
            priority: prioritySelect.value,
            completed: false
        };
        
        console.log('Using current form data:', currentTask);
        
        // Extra check for date
        if (!currentTask.dueDate || currentTask.dueDate === '') {
            alert('Please select a date and time in the datetime field before syncing to Google Calendar.');
            return;
        }
        
        // Check if Google APIs are ready
        if (!gapiInited || !gisInited || !tokenClient) {
            alert(`📅 Task ready for Google Calendar sync:\n\nTitle: ${currentTask.title}\nDescription: ${currentTask.description}\nDue: ${new Date(currentTask.dueDate).toLocaleString()}\n\n(Google Calendar integration requires API key setup)`);
            return;
        }
        
        addTaskToGoogleCalendar(currentTask);
        return;
    }
    
    // Otherwise use the last saved task
    const tasks = getTasks();
    if (tasks.length === 0) {
        alert('No tasks to sync. Please add a task first or fill out the form above.');
        return;
    }
    
    const lastTask = tasks[tasks.length - 1];
    console.log('Using last saved task:', lastTask);
    
    // Extra check for date on saved task
    if (!lastTask.dueDate || lastTask.dueDate === '') {
        alert('The selected task does not have a due date. Please add a due date first.');
        return;
    }
    
    // Check if Google APIs are ready
    if (!gapiInited || !gisInited || !tokenClient) {
        alert(`📅 Task ready for Google Calendar sync:\n\nTitle: ${lastTask.title}\nDescription: ${lastTask.description}\nDue: ${new Date(lastTask.dueDate).toLocaleString()}\n\n(Google Calendar integration requires API key setup)`);
        return;
    }
    
    addTaskToGoogleCalendar(lastTask);
}

// Origin consistency check: if user logged in from different origin, display warning
function checkLoginOrigin() {
    const loginOrigin = localStorage.getItem('g_login_origin');
    if (!loginOrigin) return;

    const appOrigin = window.location.origin;
    if (loginOrigin !== appOrigin) {
        const warning = document.getElementById('origin-warning');
        if (warning) {
            warning.style.display = 'block';
            warning.textContent = `Warning: You logged in from ${loginOrigin} but the app is running on ${appOrigin}. Use the same origin for login and the app or add both origins to your OAuth client.`;
        }
        // Hide calendar sync button to avoid confusing behavior
        const syncBtn = document.querySelector('.calendar-sync-btn');
        if (syncBtn) {
            syncBtn.textContent = 'Google Calendar (Unavailable)';
            syncBtn.disabled = true;
        }
    }
}

// Call check during startup
checkLoginOrigin();

// --- New UI panel management and settings wiring ---

function showPanel(panelId) {
    const panels = document.querySelectorAll('.panel');
    panels.forEach(p => p.style.display = 'none');
    const target = document.getElementById(panelId);
    if (target) target.style.display = 'block';

    // toggle active state on nav buttons
    const navs = document.querySelectorAll('.nav-button');
    navs.forEach(nb => {
        if (nb.dataset.panel === panelId) nb.classList.add('active');
        else nb.classList.remove('active');
    });

    // update saved count in settings when opening settings
    if (panelId === 'settingsPanel') {
        const countEl = document.getElementById('saved-count');
        if (countEl) countEl.textContent = `${getTasks().length} saved task(s)`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    
    // Nav button wiring
    document.querySelectorAll('.nav-button').forEach(btn => {
        btn.addEventListener('click', () => {
            showPanel(btn.dataset.panel);
        });
    });

    // Default to tasks panel on load
    showPanel('tasksPanel');

    // Clear tasks button in settings
    const clearBtn = document.getElementById('clear-tasks');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (!confirm('Clear all saved tasks? This cannot be undone.')) return;
            localStorage.removeItem('todoTasks');
            // clear UI task cards
            document.querySelectorAll('.task-card').forEach(c => c.remove());
            // update saved count
            const countEl = document.getElementById('saved-count');
            if (countEl) countEl.textContent = '0 saved task(s)';
        });
    }

    // Re-enable sync and add-task handlers if elements exist in create panel
    const addBtn = document.querySelector('.add-task button');
    if (addBtn) {
        addBtn.addEventListener('click', addTask);
    }
    const syncBtn = document.querySelector('.calendar-sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncLastTaskToCalendar);
    }

    // Rebind filter select (in case panel movement changed DOM)
    const filterSelect = document.querySelector('#filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            filterTasks(e.target.value);
        });
    }

    // Enter key support for title input in create panel
    const titleInput = document.querySelector('.add-task input[type="text"]');
    if (titleInput) {
        titleInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTask();
            }
        });
    }
});