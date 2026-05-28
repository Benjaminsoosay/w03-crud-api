// routes/auth.js
const express = require('express');
const passport = require('passport');
const router = express.Router();

// Optional: Add ensureGuest middleware if you have it, otherwise create simple version
const ensureGuest = (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.redirect('/api-docs');
    }
    next();
};

// @route   GET /auth/github
// @desc    Authenticate with GitHub - Redirect to GitHub for authentication
router.get('/github', ensureGuest, passport.authenticate('github', { 
    scope: ['user:email'] 
}));

// @route   GET /auth/github/callback
// @desc    GitHub callback URL - Handle GitHub OAuth callback
router.get('/github/callback', 
    passport.authenticate('github', { 
        failureRedirect: '/', 
        failureMessage: true 
    }),
    (req, res) => {
        // Successful authentication, redirect to API docs
        res.redirect('/api-docs');
    }
);

// @route   GET /auth/logout
// @desc    Logout user and destroy session
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { 
            return next(err); 
        }
        // Destroy session after logout
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            res.redirect('/');
        });
    });
});

// @route   GET /auth/status
// @desc    Check authentication status - Returns JSON for API clients
router.get('/status', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.json({ 
            authenticated: true, 
            user: {
                id: req.user.id,
                username: req.user.username,
                displayName: req.user.displayName,
                profileUrl: req.user.profileUrl,
                photos: req.user.photos
            }
        });
    } else {
        res.json({ authenticated: false, user: null });
    }
});

// @route   GET /auth/check
// @desc    Simple login status check - HTML response for browsers
router.get('/check', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.send(`
            <html>
                <body>
                    <h2>Logged in as: ${req.user.displayName || req.user.username}</h2>
                    <p>User ID: ${req.user.id}</p>
                    <p>Username: ${req.user.username}</p>
                    <a href="/auth/logout">Logout</a> | 
                    <a href="/api-docs">View API Docs</a>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <body>
                    <h2>Not Logged In</h2>
                    <p>You are currently logged out.</p>
                    <a href="/auth/github">Login with GitHub</a>
                </body>
            </html>
        `);
    }
});

// @route   GET /auth/
// @desc    Root auth endpoint - Redirect to status check
router.get('/', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
        res.redirect('/auth/check');
    } else {
        res.redirect('/auth/github');
    }
});

module.exports = router;