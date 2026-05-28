/**
 * Middleware to ensure user is authenticated
 * Use this to protect routes that require login
 */
function ensureAuthenticated(req, res, next) {
    // Check if user is authenticated via Passport
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }
    
    // Return 401 Unauthorized if not authenticated
    res.status(401).json({ 
        error: 'You do not have access. Please log in.',
        login_url: '/auth/github'
    });
}

/**
 * Optional: Middleware to ensure user is NOT authenticated (for login pages)
 * Use this to prevent logged-in users from accessing login routes
 */
function ensureGuest(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) {
        return res.status(403).json({ 
            error: 'Already logged in',
            redirect: '/api-docs'
        });
    }
    next();
}

/**
 * Optional: Middleware for role-based authentication
 * Example: ensureRole('admin')
 */
function ensureRole(role) {
    return (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ error: 'Please log in' });
        }
        
        // Check user role (you would need to store this in your user object/database)
        if (req.user && req.user.role === role) {
            return next();
        }
        
        res.status(403).json({ error: 'Insufficient permissions' });
    };
}

// Export the main middleware function
module.exports = ensureAuthenticated;

// Also export as named exports for flexibility
module.exports.ensureAuthenticated = ensureAuthenticated;
module.exports.ensureGuest = ensureGuest;
module.exports.ensureRole = ensureRole;