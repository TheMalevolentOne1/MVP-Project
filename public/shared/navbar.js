/*
Brief: Shared Navbar JavaScript
Included on all pages via navbar.html
*/

/*
Brief: Logout API Call
*/
const handleLogout = async () => {
    try {
        const response = await fetch('/auth/logout', { method: 'POST' });
        if (response.ok) {
            window.location.href = './login_page.html';
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed');
    }
};

/*
Brief: Delete Account API Call
*/
const del_account = async () => {
    const email = prompt("Please enter your email to confirm account deletion:");

    if (!email) {
        alert('Email is required to delete account.');
        return;
    }

    try {
        const res = await fetch('/auth/whoami', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (data.email !== email) {
            alert('The email you entered does not match your account email.');
            return;
        }

        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            return;
        }

        const response = await fetch('/user/del-acc/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid: data.userId }),
        });

        if (response.ok) {
            alert('Account deleted successfully.');
            window.location.href = './index.html';
        } else {
            alert('Failed to delete account.');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('Error deleting account');
    }
};
