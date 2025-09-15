// Simple login helper for Google Calendar access
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events openid profile email';
let tokenClient;

window.gapiLoaded = function() {
    console.log('GAPI loaded on login page');
    gapi.load('client', async () => {
        await gapi.client.init({
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
        });
        console.log('GAPI client initialized on login page');
    });
}

window.gisLoaded = function() {
    console.log('GSI loaded on login page');
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '',
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('login');
    const logoutBtn = document.getElementById('logout');
    const status = document.getElementById('status');
    const userArea = document.getElementById('user-area');
    const authArea = document.getElementById('auth-area');

    function showStatus(msg) {
        status.textContent = msg;
    }

    loginBtn.addEventListener('click', () => {
        if (!tokenClient) {
            showStatus('Google Identity Services not loaded yet.');
            return;
        }

        tokenClient.callback = async (resp) => {
            if (resp.error) {
                showStatus('Login failed: ' + resp.error);
                return;
            }

            // Save token and login origin
            const accessToken = resp.access_token;
            localStorage.setItem('g_access_token', accessToken);
            localStorage.setItem('g_login_origin', window.location.origin);

            // If gapi client is ready, set token so gapi.client requests work
            if (window.gapi && gapi.client && gapi.client.setToken) {
                gapi.client.setToken({ access_token: accessToken });
            }

            showStatus('Login successful! Fetching profile...');
            try {
                const profileResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: 'Bearer ' + accessToken }
                });
                if (!profileResp.ok) throw new Error('Profile fetch failed: ' + profileResp.status);
                const profile = await profileResp.json();
                document.getElementById('user-info-line').textContent = `Signed in as ${profile.name} (${profile.email})`;
                authArea.style.display = 'none';
                userArea.style.display = 'block';
                showStatus('You can now return to the app and sync tasks.');
            } catch (err) {
                console.error(err);
                showStatus('Could not fetch profile: ' + (err.message || err));
            }
        };

        // Start sign-in (will prompt consent)
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('g_access_token');
        localStorage.removeItem('g_login_origin');
        authArea.style.display = 'block';
        userArea.style.display = 'none';
        showStatus('Logged out');
    });

    // If already logged in, validate stored token
    const existingToken = localStorage.getItem('g_access_token');
    if (existingToken) {
        authArea.style.display = 'none';
        userArea.style.display = 'block';
        (async () => {
            try {
                // Set token on gapi if available
                if (window.gapi && gapi.client && gapi.client.setToken) {
                    gapi.client.setToken({ access_token: existingToken });
                }
                const profileResp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: 'Bearer ' + existingToken }
                });
                if (!profileResp.ok) throw new Error('Profile fetch failed: ' + profileResp.status);
                const profile = await profileResp.json();
                document.getElementById('user-info-line').textContent = `Signed in as ${profile.name} (${profile.email})`;
                showStatus('Already logged in');
            } catch (err) {
                console.error(err);
                authArea.style.display = 'block';
                userArea.style.display = 'none';
                showStatus('Token invalid or expired: ' + (err.message || err));
                localStorage.removeItem('g_access_token');
                localStorage.removeItem('g_login_origin');
            }
        })();
    }
});