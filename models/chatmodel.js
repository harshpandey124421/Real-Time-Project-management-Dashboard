const mongoose = require('mongoose')

const chatschema = new mongoose.Schema({
  projectid:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  madeBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messagetext: { type: String, required: true, trim: true }
}, { timestamps: true })

module.exports = mongoose.model('Chat', chatschema)
