const mongoose = require('mongoose');

const tradeRatingSchema = new mongoose.Schema({
  trade: { type: mongoose.Schema.Types.ObjectId, ref: 'Trade', required: true },
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rated: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TradeRating', tradeRatingSchema); 