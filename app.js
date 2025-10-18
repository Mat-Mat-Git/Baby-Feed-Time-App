// Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, push, onValue, remove } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6skPAqdfeDB3Qw9BusNZxvEs1xp8xcUw",
  authDomain: "baby-feeding-tracker-74e9b.firebaseapp.com",
  databaseURL: "https://baby-feeding-tracker-74e9b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "baby-feeding-tracker-74e9b",
  storageBucket: "baby-feeding-tracker-74e9b.firebasestorage.app",
  messagingSenderId: "715033819403",
  appId: "1:715033819403:web:38702de4bfe8a89be58a0e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const feedingsRef = ref(database, 'feedings');

// Password for the app (you can change this)
const APP_PASSWORD = 'Freddie2025';

// Check Firebase auth state on page load
onAuthStateChanged(auth, (user) => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    if (user && isLoggedIn === 'true') {
        // User is authenticated with Firebase and passed password check
        showApp();
    } else if (!user && isLoggedIn === 'true') {
        // User passed password check before but not authenticated with Firebase
        // Sign them in anonymously
        signInAnonymously(auth)
            .then(() => {
                showApp();
            })
            .catch((error) => {
                console.error('Auto sign-in failed:', error);
                localStorage.setItem('isLoggedIn', 'false');
                showLogin();
            });
    } else {
        // Not logged in, show login screen
        showLogin();
    }
});

// Login function
window.login = function() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value;
    const errorElement = document.getElementById('loginError');

    if (password === APP_PASSWORD) {
        // Sign in anonymously to Firebase
        signInAnonymously(auth)
            .then(() => {
                localStorage.setItem('isLoggedIn', 'true');
                errorElement.textContent = '';
                passwordInput.value = '';
                showApp();
            })
            .catch((error) => {
                console.error('Firebase auth error:', error);
                errorElement.textContent = 'Authentication failed. Please try again.';
            });
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
                window.login();
            }
        });
    }
});

// Logout function
window.logout = function() {
    signOut(auth)
        .then(() => {
            localStorage.setItem('isLoggedIn', 'false');
            showLogin();
        })
        .catch((error) => {
            console.error('Logout error:', error);
            localStorage.setItem('isLoggedIn', 'false');
            showLogin();
        });
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
window.setCurrentTime = setCurrentTime;

// Update volume display
function updateVolumeDisplay() {
    const volume = document.getElementById('volumeSlider').value;
    document.getElementById('volumeDisplay').textContent = volume;
}
window.updateVolumeDisplay = updateVolumeDisplay;

// Add a new feeding entry
window.addFeeding = function() {
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

    // Check if user is authenticated
    if (!auth.currentUser) {
        alert('Not authenticated. Please log out and log in again.');
        return;
    }

    const feeding = {
        time: timeInput,
        volume: parseInt(volume),
        timestamp: Date.now()
    };

    // Push to Firebase
    push(feedingsRef, feeding)
        .then(() => {
            // Reset form
            document.getElementById('volumeSlider').value = '0';
            window.updateVolumeDisplay();
            window.setCurrentTime();
        })
        .catch((error) => {
            console.error('Error adding feeding:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            alert('Failed to add feeding. Please try again.');
        });
}

// Load and display feedings with real-time updates
function loadFeedings() {
    console.log('loadFeedings called');
    const feedingListElement = document.getElementById('feedingList');

    // Listen for real-time updates
    onValue(feedingsRef, (snapshot) => {
        console.log('Firebase data received');
        const feedingsData = snapshot.val();
        console.log('Feedings data:', feedingsData);

        if (!feedingsData) {
            feedingListElement.innerHTML = '<div class="empty-state">No feedings recorded yet</div>';
            updateStatistics([]);
            updateChart([]);
            return;
        }

        // Convert object to array
        const feedingsArray = Object.keys(feedingsData).map(key => ({
            id: key,
            ...feedingsData[key]
        }));

        // Sort feedings by time (most recent first)
        feedingsArray.sort((a, b) => new Date(b.time) - new Date(a.time));

        feedingListElement.innerHTML = feedingsArray.map(feeding => {
            const date = new Date(feeding.time);
            const timeString = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
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
                    <button class="delete-btn" onclick="deleteFeeding('${feeding.id}')">Delete</button>
                </div>
            `;
        }).join('');

        // Update statistics
        updateStatistics(feedingsArray);

        // Update chart
        updateChart(feedingsArray);
    });
}

// Calculate and update statistics for last 24 hours
function updateStatistics(feedingsArray) {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);

    // Filter feedings from last 24 hours
    const recentFeedings = feedingsArray.filter(feeding => {
        const feedingTime = new Date(feeding.time).getTime();
        return feedingTime >= twentyFourHoursAgo;
    });

    // Sort by time (oldest first for time between calculation)
    const sortedFeedings = [...recentFeedings].sort((a, b) =>
        new Date(a.time) - new Date(b.time)
    );

    // Calculate average volume
    let avgVolumeText = '-';
    if (sortedFeedings.length > 0) {
        const totalVolume = sortedFeedings.reduce((sum, f) => sum + f.volume, 0);
        const avgVolume = Math.round(totalVolume / sortedFeedings.length);
        avgVolumeText = `${avgVolume} ml`;
    }

    // Calculate average time between feeds
    let avgTimeText = '-';
    if (sortedFeedings.length >= 2) {
        let totalTimeDiff = 0;
        for (let i = 1; i < sortedFeedings.length; i++) {
            const timeDiff = new Date(sortedFeedings[i].time) - new Date(sortedFeedings[i-1].time);
            totalTimeDiff += timeDiff;
        }
        const avgTimeMs = totalTimeDiff / (sortedFeedings.length - 1);
        const avgTimeHours = Math.floor(avgTimeMs / (1000 * 60 * 60));
        const avgTimeMins = Math.round((avgTimeMs % (1000 * 60 * 60)) / (1000 * 60));

        if (avgTimeHours > 0) {
            avgTimeText = `${avgTimeHours}h ${avgTimeMins}m`;
        } else {
            avgTimeText = `${avgTimeMins}m`;
        }
    }

    // Update DOM
    document.getElementById('avgVolume').textContent = avgVolumeText;
    document.getElementById('avgTimeBetween').textContent = avgTimeText;
}

// Chart instance
let feedingChart = null;

// Update chart with feeding data
function updateChart(feedingsArray) {
    console.log('updateChart called with', feedingsArray.length, 'feedings');

    if (typeof Chart === 'undefined') {
        console.error('Chart.js not loaded yet');
        return;
    }

    const ctx = document.getElementById('feedingChart');
    if (!ctx) {
        console.log('Chart canvas not found');
        return;
    }

    console.log('Updating chart with', feedingsArray.length, 'feedings');

    // If no data, show empty chart
    if (feedingsArray.length === 0) {
        if (feedingChart) {
            feedingChart.destroy();
            feedingChart = null;
        }
        return;
    }

    // Sort by time (newest first - descending)
    const sortedFeedings = [...feedingsArray].sort((a, b) =>
        new Date(b.time) - new Date(a.time)
    );

    console.log('First feeding (newest):', sortedFeedings[0]?.time);
    console.log('Last feeding (oldest):', sortedFeedings[sortedFeedings.length - 1]?.time);

    // Prepare data
    const chartData = sortedFeedings.map(feeding => {
        const date = new Date(feeding.time);
        console.log('Feed:', date, feeding.volume);
        return {
            x: date.getTime(),
            y: feeding.volume
        };
    });

    // Destroy existing chart if it exists
    if (feedingChart) {
        feedingChart.destroy();
    }

    // Set canvas size for scrolling
    const dataPoints = chartData.length;
    const minWidth = Math.max(800, dataPoints * 50); // 50px per data point, minimum 800px
    ctx.width = minWidth;
    ctx.height = 400;
    ctx.parentElement.style.width = minWidth + 'px';

    // Create new chart
    feedingChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Feeding Volume (ml)',
                data: chartData,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                pointBackgroundColor: '#667eea',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: false,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const date = new Date(context[0].parsed.x);
                            return date.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            });
                        },
                        label: function(context) {
                            return context.parsed.y + ' ml';
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    reverse: true,
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM d',
                            hour: 'MMM d, HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Volume (ml)'
                    },
                    ticks: {
                        stepSize: 50
                    }
                }
            }
        }
    });

    console.log('Chart created successfully');
}

// Switch between tabs
window.switchTab = function(tabName) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));

    if (tabName === 'history') {
        document.getElementById('historyTab').classList.add('active');
    } else if (tabName === 'stats') {
        document.getElementById('statsTab').classList.add('active');
    } else if (tabName === 'graph') {
        document.getElementById('graphTab').classList.add('active');
    }
}

// Delete a feeding entry
window.deleteFeeding = function(id) {
    if (!confirm('Are you sure you want to delete this feeding entry?')) {
        return;
    }

    const feedingRef = ref(database, `feedings/${id}`);
    remove(feedingRef)
        .catch((error) => {
            console.error('Error deleting feeding:', error);
            alert('Failed to delete feeding. Please try again.');
        });
}
