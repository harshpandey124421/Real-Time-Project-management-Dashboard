const mongoose = require('mongoose')

const projectschema = new mongoose.Schema({
  projectname:     { type: String, required: true, trim: true },
  projectdesc:     { type: String, default: '', trim: true },
  projectstatus:   { type: String, enum: ['active', 'completed', 'on-hold'], default: 'active' },
  projectdeadline: { type: Date },
  ispublic:        { type: Boolean, default: true },
  githubrepo:      { type: String, default: '', trim: true },   // GitHub repo URL
  madeBy:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collaborators:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true })

module.exports = mongoose.model('Project', projectschema)
