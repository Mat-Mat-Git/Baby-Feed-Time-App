// Password for the app (you can change this)
const APP_PASSWORD = 'Freddie2025';

// Check if user is logged in on page load
window.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (isLoggedIn === 'true') {
        showApp();
    } else {
        showLogin();
    }
});

// Login function
function login() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value;
    const errorElement = document.getElementById('loginError');

    if (password === APP_PASSWORD) {
        localStorage.setItem('isLoggedIn', 'true');
        errorElement.textContent = '';
        passwordInput.value = '';
        showApp();
    } else {
        errorElement.textContent = 'Incorrect password';
    }
}

// Allow Enter key to login
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});

// Logout function
function logout() {
    localStorage.setItem('isLoggedIn', 'false');
    showLogin();
}

// Show login screen
function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('appScreen').classList.add('hidden');
}

// Show app screen
function showApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appScreen').classList.remove('hidden');
    setCurrentTime();
    loadFeedings();
}

// Set current time in the datetime input
function setCurrentTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
    document.getElementById('feedingTime').value = dateTimeString;
}

// Update volume display
function updateVolumeDisplay() {
    const volume = document.getElementById('volumeSlider').value;
    document.getElementById('volumeDisplay').textContent = volume;
}

// Add a new feeding entry
function addFeeding() {
    const timeInput = document.getElementById('feedingTime').value;
    const volume = document.getElementById('volumeSlider').value;

    if (!timeInput) {
        alert('Please select a time');
        return;
    }

    if (volume === '0') {
        alert('Please select a volume greater than 0ml');
        return;
    }

    const feeding = {
        id: Date.now(),
        time: timeInput,
        volume: parseInt(volume)
    };

    // Get existing feedings
    let feedings = JSON.parse(localStorage.getItem('feedings') || '[]');

    // Add new feeding
    feedings.push(feeding);

    // Save to localStorage
    localStorage.setItem('feedings', JSON.stringify(feedings));

    // Reset form
    document.getElementById('volumeSlider').value = '0';
    updateVolumeDisplay();
    setCurrentTime();

    // Reload feeding list
    loadFeedings();
}

// Load and display feedings
function loadFeedings() {
    const feedings = JSON.parse(localStorage.getItem('feedings') || '[]');
    const feedingListElement = document.getElementById('feedingList');

    if (feedings.length === 0) {
        feedingListElement.innerHTML = '<div class="empty-state">No feedings recorded yet</div>';
        return;
    }

    // Sort feedings by time (most recent first)
    feedings.sort((a, b) => new Date(b.time) - new Date(a.time));

    feedingListElement.innerHTML = feedings.map(feeding => {
        const date = new Date(feeding.time);
        const timeString = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const dateString = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `
            <div class="feeding-item">
                <div class="feeding-item-info">
                    <div class="feeding-time">${timeString}</div>
                    <div class="feeding-date">${dateString}</div>
                </div>
                <div class="feeding-volume">${feeding.volume}ml</div>
                <button class="delete-btn" onclick="deleteFeeding(${feeding.id})">Delete</button>
            </div>
        `;
    }).join('');
}

// Delete a feeding entry
function deleteFeeding(id) {
    if (!confirm('Are you sure you want to delete this feeding entry?')) {
        return;
    }

    let feedings = JSON.parse(localStorage.getItem('feedings') || '[]');
    feedings = feedings.filter(feeding => feeding.id !== id);
    localStorage.setItem('feedings', JSON.stringify(feedings));
    loadFeedings();
}
