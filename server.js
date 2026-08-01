const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Initialize Express app
const app = express();

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hotelBooking');

const db = mongoose.connection;
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define Mongoose Schema and Model for Booking
const bookingSchema = new mongoose.Schema({
  hotelName: String,
  checkinDate: Date,
  checkoutDate: Date,
  guests: Number,
  firstName: String,
  lastName: String,
  phone: String,
  specialRequests: String,
});

const Booking = mongoose.model('Booking', bookingSchema);

// Route to handle the form submission
app.post('/submit-booking', (req, res) => {
  // Extract data from the request body
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

  // Create a new booking document
  const newBooking = new Booking({
    hotelName,
    checkinDate,
    checkoutDate,
    guests,
    firstName,
    lastName,
    phone,
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
