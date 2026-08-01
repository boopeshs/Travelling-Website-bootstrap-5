const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB connection caching for Serverless
let cachedPromise = null;

async function connectToDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hotelBooking';

  if (cachedPromise) {
    return cachedPromise;
  }

  // Set mongoose options for serverless stability
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000, // Timeout fast instead of hanging Vercel execution
  };

  cachedPromise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
    console.log('Connected to MongoDB successfully');
    return mongooseInstance;
  });

  return cachedPromise;
}

// Middleware to ensure DB connection before handling API routes
app.use(async (req, res, next) => {
  // Allow health check without DB
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    return res.status(500).json({
      error: 'Database Connection Error',
      message: 'Failed to connect to MongoDB. Please make sure MONGODB_URI environment variable is configured in Vercel settings.',
      details: error.message
    });
  }
});

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
  res.status(200).json({ status: 'ok', message: 'Vercel Serverless Function is running!' });
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
    res.status(200).send('Booking confirmed successfully');
  } catch (error) {
    console.error('Error saving hotel booking:', error);
    res.status(500).send('Error saving booking: ' + error.message);
  }
});

// Route to handle Travel Form submission
app.post(['/submit-travel-booking', '/api/submit-travel-booking'], async (req, res) => {
  try {
    const newBooking = new TravelBooking(req.body);
    await newBooking.save();
    res.status(200).send('Travel booking registration confirmed successfully');
  } catch (error) {
    console.error('Error saving travel booking:', error);
    res.status(500).send('Error saving travel booking: ' + error.message);
  }
});

// Fallback listener for local execution
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
