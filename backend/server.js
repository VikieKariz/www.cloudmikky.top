require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const DiscordStrategy = require('passport-discord').Strategy;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(express.json());
app.use(express.static(__dirname + '/../'));
app.use(passport.initialize());

// Passport Strategies
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
},
async (accessToken, refreshToken, profile, cb) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        if (rows.length > 0) {
            return cb(null, rows[0]);
        }
        const newUser = await pool.query(
            'INSERT INTO users (google_id, username, email) VALUES ($1, $2, $3) RETURNING *',
            [profile.id, profile.displayName, profile.emails[0].value]
        );
        return cb(null, newUser.rows[0]);
    } catch (err) {
        return cb(err);
    }
}));

passport.use(new DiscordStrategy({
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: "/auth/discord/callback",
    scope: ['identify', 'email']
},
async (accessToken, refreshToken, profile, cb) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE discord_id = $1', [profile.id]);
        if (rows.length > 0) {
            return cb(null, rows[0]);
        }
        const newUser = await pool.query(
            'INSERT INTO users (discord_id, username, email) VALUES ($1, $2, $3) RETURNING *',
            [profile.id, profile.username, profile.email]
        );
        return cb(null, newUser.rows[0]);
    } catch (err) {
        return cb(err);
    }
}));

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, hashedPassword]
        );
        res.status(201).json(newUser.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Failed to login' });
    }
});

// OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`/dashboard.html?token=${token}`);
});

app.get('/auth/discord', passport.authenticate('discord'));
app.get('/auth/discord/callback', passport.authenticate('discord', { session: false }), (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.redirect(`/dashboard.html?token=${token}`);
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
