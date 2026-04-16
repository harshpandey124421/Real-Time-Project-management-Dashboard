const UserModel = require('../models/usermodel')

exports.showregister = function(req, res) {
  if (req.session.loggedUser) return res.redirect('/dashboard')
  res.render('registerpage', { formErr: null, oldData: {} })
}

exports.doregister = async function(req, res) {
  try {
    const { myname, username, myemail, mypassword, confirmpass } = req.body
    if (!myname || !username || !myemail || !mypassword)
      return res.render('registerpage', { formErr: 'All fields are required', oldData: req.body })
    if (mypassword !== confirmpass)
      return res.render('registerpage', { formErr: 'Passwords do not match', oldData: req.body })
    if (mypassword.length < 6)
      return res.render('registerpage', { formErr: 'Password must be at least 6 characters', oldData: req.body })
    if (!/^[a-z0-9_]+$/.test(username.toLowerCase()))
      return res.render('registerpage', { formErr: 'Username: only letters, numbers, underscore', oldData: req.body })

    const emailtaken    = await UserModel.findOne({ myemail: myemail.toLowerCase().trim() })
    const usernametaken = await UserModel.findOne({ username: username.toLowerCase().trim() })
    if (emailtaken)    return res.render('registerpage', { formErr: 'Email already registered', oldData: req.body })
    if (usernametaken) return res.render('registerpage', { formErr: 'Username already taken', oldData: req.body })

    const newuser = await UserModel.create({
      myname, username: username.toLowerCase().trim(),
      myemail: myemail.toLowerCase().trim(), mypassword
    })
    req.session.loggedUser = { _id: newuser._id, myname: newuser.myname, username: newuser.username, myemail: newuser.myemail }
    req.flash('success', 'Welcome ' + newuser.myname + '!')
    res.redirect('/dashboard')
  } catch (err) {
    console.log(err)
    res.render('registerpage', { formErr: 'Something went wrong: ' + err.message, oldData: req.body })
  }
}

exports.showlogin = function(req, res) {
  if (req.session.loggedUser) return res.redirect('/dashboard')
  res.render('loginpage', { formErr: null, oldData: {} })
}

exports.dologin = async function(req, res) {
  try {
    const { myemail, mypassword } = req.body
    if (!myemail || !mypassword)
      return res.render('loginpage', { formErr: 'Email and password are required', oldData: req.body })
    const founduser = await UserModel.findOne({ myemail: myemail.toLowerCase().trim() })
    if (!founduser)
      return res.render('loginpage', { formErr: 'Email not found', oldData: req.body })
    const passmatch = await founduser.checkPassword(mypassword)
    if (!passmatch)
      return res.render('loginpage', { formErr: 'Wrong password', oldData: req.body })
    req.session.loggedUser = { _id: founduser._id, myname: founduser.myname, username: founduser.username, myemail: founduser.myemail }
    req.flash('success', 'Welcome back ' + founduser.myname)
    res.redirect('/dashboard')
  } catch (err) {
    console.log(err)
    res.render('loginpage', { formErr: 'Something went wrong', oldData: req.body })
  }
}

exports.dologout = function(req, res) {
  req.session.destroy(function() { res.redirect('/login') })
}
