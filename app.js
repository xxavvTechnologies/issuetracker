import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase with modular syntax
const app = window.initializeApp(firebaseConfig);
const db = window.getFirestore(app);

// DOM elements
const issuesList = document.getElementById('issuesList');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const adminLink = document.querySelector('a[href="admin/index.html"]');
const auth = window.getAuth(app);

// Add auth state observer before fetchIssues
auth.onAuthStateChanged((user) => {
    if (user) {
        adminLink.style.display = 'inline-block';
    } else {
        adminLink.style.display = 'none';
    }
});

// Function to render issues
function renderIssue(issue) {
    const div = document.createElement('div');
    div.className = 'issue-card';
    div.innerHTML = `
        <a href="issue.html?id=${issue.id}" class="issue-link">
            <div class="issue-header">
                <div class="issue-title">
                    <span class="issue-number">${issue.issueNumber}</span>
                    <h3>${issue.title}</h3>
                </div>
                <span class="status-badge ${issue.status}">${issue.status}</span>
            </div>
            <div class="issue-content">
                ${issue.description}
            </div>
            <div class="issue-meta">
                <span class="priority-${issue.priority.toLowerCase()}">${issue.priority}</span>
                <span>Created: ${issue.created.toDate().toLocaleDateString()}</span>
            </div>
            ${issue.updates?.length ? `
                <div class="updates-preview">
                    <div class="update-count">${issue.updates.length} update${issue.updates.length > 1 ? 's' : ''}</div>
                    <div class="last-update">
                        ${issue.updates[issue.updates.length - 1].text}
                    </div>
                </div>
            ` : ''}
        </a>
    `;
    return div;
}

function showLoading() {
    issuesList.innerHTML = '<div class="loading-wrapper"></div>';
}

function showEmptyState() {
    issuesList.innerHTML = `
        <div class="empty-state">
            <h3>No issues found</h3>
            <p>Try adjusting your filters or search terms</p>
        </div>
    `;
}

// Function to fetch and filter issues
async function fetchIssues() {
    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const priority = priorityFilter.value;

    try {
        showLoading();
        let issuesRef = collection(db, 'issues');
        let constraints = [];

        if (status !== 'all') {
            constraints.push(where('status', '==', status));
        }
        if (priority !== 'all') {
            constraints.push(where('priority', '==', priority));
        }

        const q = query(issuesRef, ...constraints);
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            showEmptyState();
            return;
        }

        issuesList.innerHTML = '';

        snapshot.forEach(doc => {
            const issue = {
                id: doc.id,
                ...doc.data()
            };
            if (searchTerm && !issue.title.toLowerCase().includes(searchTerm) && 
                !issue.description.toLowerCase().includes(searchTerm)) {
                return;
            }
            issuesList.appendChild(renderIssue(issue));
        });
    } catch (error) {
        console.error("Error fetching issues:", error);
        issuesList.innerHTML = '<p>Error loading issues. Please check your connection.</p>';
    }
}

// Add debounce for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Update event listener for search
searchInput.addEventListener('input', debounce(fetchIssues, 300));

// Event listeners
statusFilter.addEventListener('change', fetchIssues);
priorityFilter.addEventListener('change', fetchIssues);

// Initial load
fetchIssues();
