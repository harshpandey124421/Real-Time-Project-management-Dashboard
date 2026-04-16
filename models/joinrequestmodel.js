const mongoose = require('mongoose')

const joinrequestschema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectid:   { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  status:      { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  message:     { type: String, default: '' }
}, { timestamps: true })

module.exports = mongoose.model('JoinRequest', joinrequestschema)
