require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI);

// Achievement definitions
const ACHIEVEMENTS = {
    FIRST_CLICK: { id: 'first_click', name: 'First Click', description: 'Click the button for the first time', points: 10 },
    SPEED_DEMON: { id: 'speed_demon', name: 'Speed Demon', description: 'Click 10 times in 5 seconds', points: 50 },
    PERSISTENT: { id: 'persistent', name: 'Persistent Clicker', description: 'Reach 100 clicks', points: 100 },
    COMBO_MASTER: { id: 'combo_master', name: 'Combo Master', description: 'Achieve a 20x combo', points: 200 },
    PREMIUM_USER: { id: 'premium_user', name: 'Premium Supporter', description: 'Subscribe to premium features', points: 500 },
    AD_DESTROYER: { id: 'ad_destroyer', name: 'Ad Destroyer', description: 'Remove all ads through achievements', points: 300 }
};

// Enhanced User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    isPremium: { type: Boolean, default: false },
    stats: {
        clicks: { type: Number, default: 0 },
        highestCombo: { type: Number, default: 0 },
        achievementsUnlocked: [{ 
            id: String, 
            unlockedAt: Date 
        }],
        totalPoints: { type: Number, default: 0 },
        clicksPerDay: [{
            date: Date,
            count: Number
        }],
        sessionCount: { type: Number, default: 0 }
    },
    preferences: {
        theme: { type: String, default: 'default' },
        effects: { type: Boolean, default: true },
        notifications: { type: Boolean, default: true }
    },
    premiumExpiry: { type: Date },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// Analytics Schema
const analyticsSchema = new mongoose.Schema({
    eventType: String,
    userId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now },
    data: Object
});

const User = mongoose.model('User', userSchema);
const Analytics = mongoose.model('Analytics', analyticsSchema);

// Middleware to track analytics
const trackEvent = async (userId, eventType, data) => {
    try {
        await Analytics.create({ userId, eventType, data });
    } catch (error) {
        console.error('Analytics tracking error:', error);
    }
};

// Authentication middleware
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('No token provided');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        if (!req.user) throw new Error('User not found');
        
        next();
    } catch (error) {
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// Enhanced routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword, username });
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        await trackEvent(user._id, 'USER_REGISTERED', { email });
        res.json({ token, user: { email, username } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) throw new Error('User not found');
        
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) throw new Error('Invalid password');
        
        user.lastLogin = new Date();
        user.stats.sessionCount++;
        await user.save();
        
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        await trackEvent(user._id, 'USER_LOGIN', { sessionCount: user.stats.sessionCount });
        res.json({ token, user: { email, username: user.username, isPremium: user.isPremium } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Premium subscription endpoint
app.post('/api/subscribe', async (req, res) => {
    try {
        const { token, userId } = req.body;
        
        // Create Stripe customer
        const customer = await stripe.customers.create({
            source: token.id,
            email: token.email
        });
        
        // Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: process.env.STRIPE_PRICE_ID }]
        });
        
        // Update user
        await User.findByIdAndUpdate(userId, {
            isPremium: true,
            premiumExpiry: new Date(subscription.current_period_end * 1000)
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Achievement checking and granting
app.post('/api/check-achievements', authenticateUser, async (req, res) => {
    try {
        const { clicks, combo } = req.body;
        const newAchievements = [];
        
        // Check for achievements
        if (clicks === 1 && !hasAchievement(req.user, 'FIRST_CLICK')) {
            newAchievements.push(ACHIEVEMENTS.FIRST_CLICK);
        }
        if (clicks >= 100 && !hasAchievement(req.user, 'PERSISTENT')) {
            newAchievements.push(ACHIEVEMENTS.PERSISTENT);
        }
        if (combo >= 20 && !hasAchievement(req.user, 'COMBO_MASTER')) {
            newAchievements.push(ACHIEVEMENTS.COMBO_MASTER);
        }
        
        if (newAchievements.length > 0) {
            const points = newAchievements.reduce((sum, ach) => sum + ach.points, 0);
            req.user.stats.totalPoints += points;
            req.user.stats.achievementsUnlocked.push(
                ...newAchievements.map(ach => ({ id: ach.id, unlockedAt: new Date() }))
            );
            await req.user.save();
            
            await trackEvent(req.user._id, 'ACHIEVEMENT_UNLOCKED', { achievements: newAchievements });
        }
        
        res.json({ newAchievements, totalPoints: req.user.stats.totalPoints });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Enhanced stats tracking
app.post('/api/stats', authenticateUser, async (req, res) => {
    try {
        const { clicks, combo, sessionDuration } = req.body;
        const today = new Date().setHours(0, 0, 0, 0);
        
        // Update daily clicks
        let dailyStats = req.user.stats.clicksPerDay.find(
            stat => stat.date.setHours(0, 0, 0, 0) === today
        );
        
        if (dailyStats) {
            dailyStats.count += clicks;
        } else {
            req.user.stats.clicksPerDay.push({ date: today, count: clicks });
        }
        
        // Update other stats
        req.user.stats.clicks += clicks;
        req.user.stats.highestCombo = Math.max(req.user.stats.highestCombo, combo);
        
        await req.user.save();
        await trackEvent(req.user._id, 'STATS_UPDATED', { clicks, combo, sessionDuration });
        
        res.json({ success: true, stats: req.user.stats });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/profile', authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .lean();
            
        const stats = await Analytics.aggregate([
            { $match: { userId: req.user._id } },
            { $group: {
                _id: '$eventType',
                count: { $sum: 1 }
            }}
        ]);
        
        res.json({ user, stats });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update user preferences
app.put('/api/preferences', authenticateUser, async (req, res) => {
    try {
        const { theme, effects, notifications } = req.body;
        req.user.preferences = { ...req.user.preferences, theme, effects, notifications };
        await req.user.save();
        await trackEvent(req.user._id, 'PREFERENCES_UPDATED', { theme, effects, notifications });
        res.json({ success: true, preferences: req.user.preferences });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Helper function to check achievements
function hasAchievement(user, achievementId) {
    return user.stats.achievementsUnlocked.some(a => a.id === ACHIEVEMENTS[achievementId].id);
}

// Get leaderboard
app.get('/api/leaderboard', async (req, res) => {
    try {
        const topUsers = await User.find()
            .sort({ 'stats.clicks': -1 })
            .limit(10)
            .select('email stats.clicks stats.highestCombo');
        res.json(topUsers);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 