const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const UserSchema = new mongoose.Schema({
  myname:     { type: String, required: true },
  username:   { type: String, required: true, unique: true, lowercase: true, trim: true },
  myemail:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  mypassword: { type: String, required: true }
}, { timestamps: true })

UserSchema.pre('save', async function(next) {
  if (!this.isModified('mypassword')) return next()
  this.mypassword = await bcrypt.hash(this.mypassword, 10)
  next()
})

UserSchema.methods.checkPassword = function(typedPassword) {
  return bcrypt.compare(typedPassword, this.mypassword)
}

const UserModel = mongoose.model('User', UserSchema)

module.exports = { UserModel }
