// Use 'import' syntax to load modules
import express from 'express';
import expressLayouts from 'express-ejs-layouts';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();
console.log('Database URI:', process.env.MONGODB_URI);

import User from './models/User.js';
import Product from './models/Product.js';

const app = express();

// Set the view engine to EJS
app.set('view engine', 'ejs');
// Use express-ejs-layouts for layouts
app.use(expressLayouts);
app.set('layout', 'layout'); // Default layout file

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Static files (for CSS, images, and client-side JS)
app.use(express.static('public'));
// To parse JSON requests
app.use(express.json());

// Connect to MongoDB
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };

async function run() {
    try {
        console.log("Connecting to remote MongoDB...");
        
        // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
        await mongoose.connect(process.env.MONGODB_URI, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        await mongoose.disconnect();
    }
}

run().catch(console.dir);

// Middleware to check for admin role
const adminMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        console.log("No token provided");
        return res.status(403).send('Token is required');
    }
    // Additional logging can go here
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("Invalid token:", err);
            return res.status(401).send('Unauthorized');
        }
        next();
    });
};


// Home Page
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

// Account Page
app.get('/account', (req, res) => {
    res.render('account', { title: 'Account' });
});
// Account Page
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});
// Cart Page
app.get('/cart', (req, res) => {
    res.render('cart', { title: 'Cart' });
});
// Contact us Page
app.get('/contact-us', (req, res) => {
    res.render('contact-us', { title: 'Contact us' });
});
// Products Page
app.get('/products', (req, res) => {
    res.render('products', { title: 'Products' });
});
// Our Story Page
app.get('/our-story', (req, res) => {
    res.render('our-story', { title: 'Our Story' });
});

// Register User
app.post('/register', async (req, res) => {
    console.log('Registering user with:', req.body);

    const { username, password } = req.body;

    // Ensure that `username` and `password` are provided
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered');
});

// Login User
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
});

// Get all users (admin only)
app.get('/users', adminMiddleware, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Remove a user (admin only)
app.delete('/users/:id', adminMiddleware, async (req, res) => {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).send();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});