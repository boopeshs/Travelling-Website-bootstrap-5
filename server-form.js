const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hotelBooking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define Mongoose Schema and Model for Booking
const bookingSchema = new mongoose.Schema({
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
  passportCopy: String, // Consider storing file name or path
  specialRequests: String, // Represents "Convey The Message To Us"
});

// Create the booking model
const Booking = mongoose.model('Booking', bookingSchema);

// Route to handle the form submission
app.post('/submit-booking', (req, res) => {
  // Extract data from the request body
  const {
    name,
    email,
    phone1,
    phone2,
    whatsapp,
    address,
    from,
    to,
    adults,
    childrens,
    travelClass,
    departure,
    journeyType,
    preferred,
    foodType,
    numRooms,
    roomPreference,
    entertainment,
    passportCopy,
    specialRequests, // Corresponds to "Convey The Message To Us"
  } = req.body;

  // Create a new booking document
  const newBooking = new Booking({
    name,
    email,
    phone1,
    phone2,
    whatsapp,
    address,
    from,
    to,
    adults,
    childrens,
    travelClass,
    departure,
    journeyType,
    preferred,
    foodType,
    numRooms,
    roomPreference,
    entertainment,
    passportCopy,
    specialRequests,
  });

  // Save the booking to the database
  newBooking
    .save()
    .then(() => {
      res.status(200).send('Booking confirmed successfully');
    })
    .catch((error) => {
      res.status(500).send('Error saving booking: ' + error);
    });
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
