import { firebaseConfig } from '../firebase-config.js';

const app = window.initializeApp(firebaseConfig);
const db = window.getFirestore(app);
const auth = window.getAuth(app);

const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const userName = document.getElementById('userName');
const googleLogin = document.getElementById('googleLogin');
const logoutBtn = document.getElementById('logoutBtn');
const newIssueForm = document.getElementById('newIssueForm');
const adminIssuesList = document.getElementById('adminIssuesList');

let issuesCache = [];
const sortSelect = document.getElementById('sortIssues');
const quickFilters = document.querySelectorAll('.quick-filter');
const toast = document.getElementById('toast');

// Show toast message
function showToast(message, duration = 3000) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// Update stats
function updateStats(issues) {
    document.getElementById('totalIssues').textContent = issues.length;
    document.getElementById('openIssues').textContent = issues.filter(i => i.status === 'open').length;
    document.getElementById('inProgressIssues').textContent = issues.filter(i => i.status === 'in-progress').length;
    document.getElementById('closedIssues').textContent = issues.filter(i => i.status === 'closed').length;
}

// Sort and filter issues
function applyFiltersAndSort() {
    let filtered = [...issuesCache];
    const activeFilter = document.querySelector('.quick-filter.active').dataset.filter;

    if (activeFilter !== 'all') {
        filtered = filtered.filter(issue => 
            issue.status === activeFilter || issue.priority === activeFilter
        );
    }

    switch (sortSelect.value) {
        case 'newest':
            filtered.sort((a, b) => b.created.toDate() - a.created.toDate());
            break;
        case 'oldest':
            filtered.sort((a, b) => a.created.toDate() - b.created.toDate());
            break;
        case 'priority':
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'status':
            const statusOrder = { open: 0, 'in-progress': 1, closed: 2 };
            filtered.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
            break;
    }

    renderIssues(filtered);
}

// Add after the applyFiltersAndSort function
function renderIssues(issues) {
    adminIssuesList.innerHTML = '';
    issues.forEach(issue => {
        adminIssuesList.appendChild(renderAdminIssue(issue, issue.id));
    });
}

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        loginSection.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        userName.textContent = user.displayName;
        loadAdminIssues();
    } else {
        loginSection.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    }
});

// Login with Google
googleLogin.addEventListener('click', async () => {
    const provider = new window.GoogleAuthProvider();
    try {
        await window.signInWithPopup(auth, provider);
    } catch (error) {
        console.error('Login error:', error);
    }
});

// Logout
logoutBtn.addEventListener('click', () => auth.signOut());

// Replace the newIssueForm event listener with this updated version
newIssueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        // Get the latest issue number
        const querySnapshot = await window.getDocs(
            window.query(
                window.collection(db, 'issues'),
                window.orderBy('issueNumber', 'desc'),
                window.limit(1)
            )
        );
        
        const lastNumber = querySnapshot.empty ? 0 : 
            parseInt(querySnapshot.docs[0].data().issueNumber.split('-')[1]);
        
        const newIssueNumber = `xtsi-${String(lastNumber + 1).padStart(4, '0')}`;
        
        const newIssue = {
            issueNumber: newIssueNumber,
            title: document.getElementById('issueTitle').value,
            description: document.getElementById('issueDescription').value,
            priority: document.getElementById('issuePriority').value,
            status: 'open',
            created: window.serverTimestamp(),
            createdBy: auth.currentUser.email,
            updates: []
        };

        await window.addDoc(window.collection(db, 'issues'), newIssue);
        newIssueForm.reset();
        showToast('Issue created successfully');
        loadAdminIssues();
    } catch (error) {
        console.error('Error creating issue:', error);
        showToast('Error creating issue');
    }
});

// Render issue with admin controls
// Update renderAdminIssue function to include issue number
function renderAdminIssue(issue, id) {
    const div = document.createElement('div');
    div.className = 'issue-card';
    div.innerHTML = `
        <div class="issue-header">
            <div class="issue-title">
                <a href="../issue.html?id=${id}" class="issue-link">
                    <h3>${issue.issueNumber}: ${issue.title}</h3>
                </a>
            </div>
            <p>${issue.description}</p>
            <div class="issue-meta">
                <span class="priority-${issue.priority}">${issue.priority}</span>
                <select class="status-select" data-id="${id}">
                    <option value="open" ${issue.status === 'open' ? 'selected' : ''}>Open</option>
                    <option value="in-progress" ${issue.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>Closed</option>
                </select>
            </div>
            <div class="updates-list">
                ${issue.updates?.map(update => `
                    <div class="update-item">
                        <p>${update.text}</p>
                        <div class="update-meta">
                            By ${update.by} on ${new Date(update.date.toDate()).toLocaleString()}
                        </div>
                    </div>
                `).join('') || ''}
            </div>
            <div class="update-form">
                <textarea placeholder="Add update..." class="update-text"></textarea>
                <button class="btn-submit add-update" data-id="${id}">Add Update</button>
            </div>
        </div>
    `;

    // Add event listeners
    const statusSelect = div.querySelector('.status-select');
    statusSelect.addEventListener('change', () => updateIssueStatus(id, statusSelect.value));

    const addUpdateBtn = div.querySelector('.add-update');
    const updateText = div.querySelector('.update-text');
    addUpdateBtn.addEventListener('click', () => addUpdate(id, updateText));

    return div;
}

// Enhanced load issues function
async function loadAdminIssues() {
    adminIssuesList.classList.add('loading');
    try {
        const snapshot = await window.getDocs(window.collection(db, 'issues'));
        issuesCache = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        updateStats(issuesCache);
        applyFiltersAndSort();
    } catch (error) {
        console.error('Error loading issues:', error);
        showToast('Error loading issues');
    } finally {
        adminIssuesList.classList.remove('loading');
    }
}

// Event listeners for sorting and filtering
sortSelect.addEventListener('change', applyFiltersAndSort);

quickFilters.forEach(filter => {
    filter.addEventListener('click', (e) => {
        document.querySelector('.quick-filter.active').classList.remove('active');
        e.target.classList.add('active');
        applyFiltersAndSort();
    });
});

// Update issue status
async function updateIssueStatus(issueId, newStatus) {
    try {
        await window.updateDoc(window.doc(db, 'issues', issueId), { status: newStatus });
        showToast('Status updated successfully');
        loadAdminIssues();
    } catch (error) {
        console.error('Error updating status:', error);
        showToast('Error updating status');
    }
}

// Add update to issue
async function addUpdate(issueId, updateTextElement) {
    const update = {
        text: updateTextElement.value,
        by: auth.currentUser.email,
        date: window.serverTimestamp()
    };

    try {
        const issueRef = window.doc(db, 'issues', issueId);
        await window.updateDoc(issueRef, {
            updates: window.arrayUnion(update)
        });
        updateTextElement.value = '';
        loadAdminIssues();
    } catch (error) {
        console.error('Error adding update:', error);
    }
}

// Add delete functionality
async function deleteIssue(issueId) {
    if (!confirm('Are you sure you want to delete this issue?')) return;
    
    try {
        await window.deleteDoc(window.doc(db, 'issues', issueId));
        showToast('Issue deleted successfully');
        loadAdminIssues();
    } catch (error) {
        console.error('Error deleting issue:', error);
        showToast('Error deleting issue');
    }
}
