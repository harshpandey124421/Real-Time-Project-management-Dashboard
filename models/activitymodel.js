const mongoose = require('mongoose')

const activityschema = new mongoose.Schema({
  projectid:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  madeBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activitytext: { type: String, required: true }
}, { timestamps: true })

module.exports = mongoose.model('Activity', activityschema)
