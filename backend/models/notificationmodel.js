const mongoose = require('mongoose')

const notificationschema = new mongoose.Schema({
  userid:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isread:  { type: Boolean, default: false },
  link:    { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationschema)
