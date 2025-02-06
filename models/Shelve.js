const mongoose = require('mongoose');

const ShelveSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  shelve: { 
    type: String, 
    enum: ['Read', 'Currently Reading', 'Want To Read'], 
    required: true 
  },
});

module.exports = mongoose.model('BooksShelve', ShelveSchema);
