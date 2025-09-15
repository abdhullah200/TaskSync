# TaskSync ✅

TaskSync is a modern **to-do list web app** with Google Calendar integration.  
You can create, manage, and filter tasks by priority, then **sync them directly to your Google Calendar** for better scheduling.

## ✨ Features
- 📝 Create, edit, and delete tasks  
- 🎯 Task prioritization (Important, Normal, Low)  
- 📅 Due date & time selection  
- 🔍 Filter tasks by priority  
- ☁️ Sync tasks with **Google Calendar** (requires Google login)  
- 💾 Local storage persistence (tasks remain after refresh)  
- 🎨 Clean, responsive UI with dark mode styling  

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/tasksync.git
cd tasksync
2. Configure Google API
This app uses the Google Calendar API and Google Identity Services.

Go to Google Cloud Console.

Create a project and enable the Google Calendar API.

Create OAuth 2.0 credentials:

Add http://localhost and http://127.0.0.1 as Authorized JavaScript origins.

Copy your Client ID and API Key.

Replace the placeholder values in your script.js and login.js:

js
Copy code
const GOOGLE_CLIENT_ID = "YOUR_CLIENT_ID";
const GOOGLE_API_KEY = "YOUR_API_KEY";
⚠️ Never commit real keys to GitHub.
Use a .env file or another secure method for production.

3. Run Locally
Simply open index.html in your browser:

bash
Copy code
# If you have Python installed, you can run a quick local server:
python3 -m http.server 8080
Then open: http://localhost:8080

4. Login
Click Login with Google

Grant access to your calendar

Start syncing tasks!

📂 Project Structure
pgsql
Copy code
.
├── index.html       # Main To-Do app
├── login.html       # Google login page
├── styles.css       # App styling
├── script.js        # Main app logic
├── login.js         # Login flow logic
└── README.md
