const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, images, videos) from the root directory
const rootDir = path.join(__dirname, '..');
app.use(express.static(rootDir));

// Serve index.html on root GET /
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// MongoDB connection caching for Serverless
let cachedPromise = null;

async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI;

  // On Vercel without MONGODB_URI, skip local connection attempt to avoid ECONNREFUSED
  if (!MONGODB_URI) {
    if (process.env.VERCEL) {
      console.warn('MONGODB_URI is not set in Vercel environment variables.');
      return null;
    }
    // Local development fallback
    return mongoose.connect('mongodb://localhost:27017/hotelBooking');
  }

  if (cachedPromise && mongoose.connection.readyState === 1) {
    return cachedPromise;
  }

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  };

  cachedPromise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
    console.log('Connected to MongoDB Atlas successfully');
    return mongooseInstance;
  });

  return cachedPromise;
}

// Define Mongoose Schema & Model for Hotel Booking
const hotelBookingSchema = new mongoose.Schema({
  hotelName: String,
  checkinDate: Date,
  checkoutDate: Date,
  guests: Number,
  firstName: String,
  lastName: String,
  phone: String,
  specialRequests: String,
  createdAt: { type: Date, default: Date.now }
});

const HotelBooking = mongoose.models.HotelBooking || mongoose.model('HotelBooking', hotelBookingSchema);

// Define Mongoose Schema & Model for Travel Registration
const travelBookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone1: String,
  phone2: String,
  whatsapp: String,
  address: String,
  from: String,
  to: String,
  adults: Number,
  childrens: Number,
  travelClass: String,
  departure: Date,
  journeyType: String,
  preferred: String,
  foodType: [String],
  numRooms: Number,
  roomPreference: String,
  entertainment: [String],
  passportCopy: String,
  specialRequests: String,
  createdAt: { type: Date, default: Date.now }
});

const TravelBooking = mongoose.models.TravelBooking || mongoose.model('TravelBooking', travelBookingSchema);

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Vercel Serverless Function is running!',
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Route to handle Hotel Form submission
app.post(['/submit-booking', '/api/submit-booking'], async (req, res) => {
  try {
    const {
      hotelName,
      checkinDate,
      checkoutDate,
      guests,
      firstName,
      lastName,
      phone,
      specialRequests,
    } = req.body;

    try {
      await connectToDatabase();
    } catch (dbErr) {
      console.warn('DB Connection failed:', dbErr.message);
    }

    if (mongoose.connection.readyState === 1) {
      const newBooking = new HotelBooking({
        hotelName,
        checkinDate,
        checkoutDate,
        guests,
        firstName,
        lastName,
        phone,
        specialRequests,
      });
      await newBooking.save();
      return res.status(200).send('Booking confirmed successfully and saved to database!');
    } else {
      return res.status(200).send('Booking request received successfully! (Note: Add MONGODB_URI in Vercel settings to persist entries to cloud database).');
    }
  } catch (error) {
    console.error('Error processing hotel booking:', error);
    res.status(500).send('Error processing booking: ' + error.message);
  }
});

// Route to handle Travel Form submission
app.post(['/submit-travel-booking', '/api/submit-travel-booking'], async (req, res) => {
  try {
    try {
      await connectToDatabase();
    } catch (dbErr) {
      console.warn('DB Connection failed:', dbErr.message);
    }

    if (mongoose.connection.readyState === 1) {
      const newBooking = new TravelBooking(req.body);
      await newBooking.save();
      return res.status(200).send('Travel booking registration confirmed successfully and saved to database!');
    } else {
      return res.status(200).send('Travel booking registration received successfully! (Note: Add MONGODB_URI in Vercel settings to persist entries to cloud database).');
    }
  } catch (error) {
    console.error('Error processing travel booking:', error);
    res.status(500).send('Error processing travel booking: ' + error.message);
  }
});

// Catch-all route for any unhandled GET requests to serve HTML files if matching, or index.html
app.get('*', (req, res) => {
  const reqPath = req.path;
  if (reqPath.endsWith('.html')) {
    return res.sendFile(path.join(rootDir, reqPath));
  }
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Fallback listener for local execution
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
