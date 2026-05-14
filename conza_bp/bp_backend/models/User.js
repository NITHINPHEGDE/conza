const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
});

module.exports = mongoose.model('User', userSchema);
