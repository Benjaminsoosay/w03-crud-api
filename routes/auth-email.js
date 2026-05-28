// routes/auth-email.js
const express = require('express');
const router = express.Router();
const UserService = require('../services/userService');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Initialize UserService (will be set in main server)
let userService;

// Local Strategy for email/password authentication
function initializePassport(db) {
    userService = new UserService(db);
    
    passport.use('local', new LocalStrategy(
        { usernameField: 'email' },
        async (email, password, done) => {
            try {
                const user = await userService.verifyPassword(email, password);
                return done(null, user);
            } catch (error) {
                return done(null, false, { message: error.message });
            }
        }
    ));
}

// @route   POST /auth/register
// @desc    Register a new user with email/password
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, ...additionalData } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Create user
        const newUser = await userService.createUser(email, password, {
            name: name || email.split('@')[0],
            provider: 'local',
            ...additionalData
        });
        
        res.status(201).json({
            message: 'User registered successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.message === 'User already exists') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        res.status(500).json({ error: 'Registration failed' });
    }
});

// @route   POST /auth/login
// @desc    Login with email/password
router.post('/login', 
    passport.authenticate('local', { 
        failureRedirect: '/auth/login-failed',
        failureMessage: true 
    }),
    (req, res) => {
        // Successful login
        res.json({
            message: 'Logged in successfully',
            user: req.user,
            redirect: '/api-docs'
        });
    }
);

// @route   GET /auth/login-failed
// @desc    Login failure handler
router.get('/login-failed', (req, res) => {
    res.status(401).json({ 
        error: 'Login failed', 
        message: req.session.messages ? req.session.messages[req.session.messages.length - 1] : 'Invalid email or password' 
    });
});

// @route   POST /auth/change-password
// @desc    Change user password (requires authentication)
router.post('/change-password', async (req, res) => {
    try {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.status(401).json({ error: 'Please log in first' });
        }
        
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Both old and new passwords are required' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }
        
        await userService.updatePassword(req.user._id, oldPassword, newPassword);
        
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(400).json({ error: error.message });
    }
});

// @route   POST /auth/reset-password
// @desc    Reset password (forgot password flow - simplified)
router.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email and new password are required' });
        }
        
        const user = await userService.getUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // In production, you'd send a reset token via email
        // This is simplified for demonstration
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.collection('users').updateOne(
            { _id: new ObjectId(user._id) },
            { $set: { passwordHash: hashedPassword, updatedAt: new Date() } }
        );
        
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

module.exports = { router, initializePassport };