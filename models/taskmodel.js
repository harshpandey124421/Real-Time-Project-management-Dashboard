const mongoose = require('mongoose')

const commentschema = new mongoose.Schema({
  commenttext: { type: String, required: true },
  madeBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  madeat:      { type: Date, default: Date.now }
})

const taskschema = new mongoose.Schema({
  taskname:     { type: String, required: true, trim: true },
  taskdesc:     { type: String, default: '', trim: true },
  taskstatus:   { type: String, enum: ['todo', 'inprogress', 'done'], default: 'todo' },
  taskpriority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  taskdeadline: { type: Date },
  belongsTo:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  madeBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  comments:     [commentschema]
}, { timestamps: true })

module.exports = mongoose.model('Task', taskschema)
