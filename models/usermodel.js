const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userschema = new mongoose.Schema({
  myname:     { type: String, required: true, trim: true },
  username:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  myemail:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  mypassword: { type: String, required: true },
  mybio:      { type: String, default: '' }
}, { timestamps: true })

userschema.pre('save', async function(next) {
  if (!this.isModified('mypassword')) return next()
  this.mypassword = await bcrypt.hash(this.mypassword, 10)
  next()
})

userschema.methods.checkPassword = function(typed) {
  return bcrypt.compare(typed, this.mypassword)
}

module.exports = mongoose.model('User', userschema)
