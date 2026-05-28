// services/userService.js
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');

const saltRounds = 12; // Cost factor - higher is more secure

class UserService {
    constructor(db) {
        this.db = db;
        this.collection = db.collection('users');
    }

    // Create a new user with hashed password
    async createUser(email, password, additionalData = {}) {
        try {
            // Check if user already exists
            const existingUser = await this.collection.findOne({ email });
            if (existingUser) {
                throw new Error('User already exists');
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Create user object
            const user = {
                email: email.toLowerCase(),
                passwordHash: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date(),
                ...additionalData
            };
            
            // Store in database
            const result = await this.collection.insertOne(user);
            
            // Return user without password hash
            const { passwordHash, ...userWithoutPassword } = user;
            return { ...userWithoutPassword, _id: result.insertedId };
        } catch (error) {
            throw error;
        }
    }

    // Verify user password during login
    async verifyPassword(email, password) {
        try {
            const user = await this.collection.findOne({ email: email.toLowerCase() });
            if (!user) {
                throw new Error('User not found');
            }
            
            // Compare provided password with stored hash
            const isValid = await bcrypt.compare(password, user.passwordHash);
            
            if (!isValid) {
                throw new Error('Invalid password');
            }
            
            // Return user without password hash
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }

    // Update user password
    async updatePassword(userId, oldPassword, newPassword) {
        try {
            const user = await this.collection.findOne({ _id: new ObjectId(userId) });
            if (!user) {
                throw new Error('User not found');
            }
            
            // Verify old password
            const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
            if (!isValid) {
                throw new Error('Current password is incorrect');
            }
            
            // Hash new password
            const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            // Update in database
            await this.collection.updateOne(
                { _id: new ObjectId(userId) },
                { 
                    $set: { 
                        passwordHash: newHashedPassword,
                        updatedAt: new Date(),
                        passwordLastChanged: new Date()
                    } 
                }
            );
            
            return { message: 'Password updated successfully' };
        } catch (error) {
            throw error;
        }
    }

    // Get user by ID (without password)
    async getUserById(userId) {
        try {
            const user = await this.collection.findOne({ _id: new ObjectId(userId) });
            if (!user) return null;
            
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }

    // Get user by email (without password)
    async getUserByEmail(email) {
        try {
            const user = await this.collection.findOne({ email: email.toLowerCase() });
            if (!user) return null;
            
            const { passwordHash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = UserService;