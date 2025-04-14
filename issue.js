import { firebaseConfig } from './firebase-config.js';

const app = window.initializeApp(firebaseConfig);
const db = window.getFirestore(app);
const issueDetails = document.getElementById('issueDetails');

async function loadIssueDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const issueId = urlParams.get('id');

    if (!issueId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const docRef = window.doc(db, 'issues', issueId);
        const docSnap = await window.getDoc(docRef);

        if (!docSnap.exists()) {
            issueDetails.innerHTML = '<h2>Issue not found</h2>';
            return;
        }

        const issue = {
            id: docSnap.id,
            ...docSnap.data()
        };
        renderIssueDetails(issue);
    } catch (error) {
        console.error('Error loading issue:', error);
        issueDetails.innerHTML = '<h2>Error loading issue details</h2>';
    }
}

function renderIssueDetails(issue) {
    issueDetails.innerHTML = `
        <a href="index.html" class="back-link">← Back to Issues</a>
        <div class="issue-header">
            <div class="issue-id">${issue.issueNumber}</div>
            <h2 class="issue-title">${issue.title}</h2>
            <div class="issue-info">
                <span class="status-badge ${issue.status}">${issue.status}</span>
                <span class="priority-${issue.priority.toLowerCase()}">${issue.priority}</span>
                <span>Created on ${issue.created.toDate().toLocaleDateString()}</span>
            </div>
        </div>

        <div class="issue-description">
            ${issue.description}
        </div>

        <div class="updates-section">
            <h3>Updates</h3>
            ${issue.updates?.length ? issue.updates.map(update => `
                <div class="update-item">
                    <div class="update-content">${update.text}</div>
                    <div class="update-meta">
                        <span>${new Date(update.date.toDate()).toLocaleString()}</span>
                    </div>
                </div>
            `).join('') : '<p>No updates yet</p>'}
        </div>
    `;
}

// Initial load
loadIssueDetails();
