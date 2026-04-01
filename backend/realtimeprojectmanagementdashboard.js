const express        = require('express')
const mongoose       = require('mongoose')
const session        = require('express-session')
const flash          = require('connect-flash')
const dotenv         = require('dotenv')
const path           = require('path')

const { UserModel } = require('./models')

dotenv.config({ path: path.join(__dirname, '../.env') })

const myapp = express()

// mongodb part
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err))

// frontend part
myapp.set('view engine', 'ejs')
myapp.set('views', path.join(__dirname, '../frontend'))
myapp.use(express.static(path.join(__dirname, '../frontend')))

myapp.use(express.urlencoded({ extended: true }))
myapp.use(express.json())

myapp.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))

myapp.use(flash())

myapp.use(function(req, res, next) {
  res.locals.successMsg = req.flash('success')
  res.locals.errorMsg   = req.flash('error')
  res.locals.loggedUser = req.session.loggedUser || null
  next()
})

// Login and register part
function checkLogin(req, res, next) {
  if (!req.session.loggedUser) {
    req.flash('error', 'Please login first')
    return res.redirect('/login')
  }
  next()
}


//   router part
myapp.get('/', function(req, res) {
  if (req.session.loggedUser) return res.redirect('/dashboard')
  res.redirect('/login')
})

myapp.get('/register', function(req, res) {
  if (req.session.loggedUser) return res.redirect('/dashboard')
  res.render('registerpage', { formErr: null, oldData: {} })
})

myapp.post('/register', async function(req, res) {
  try {
    const { myname, username, myemail, mypassword, confirmpass } = req.body

    if (!myname || !username || !myemail || !mypassword) {
      return res.render('registerpage', { formErr: 'All fields are required', oldData: req.body })
    }
    if (mypassword !== confirmpass) {
      return res.render('registerpage', { formErr: 'Passwords do not match', oldData: req.body })
    }
    if (mypassword.length < 6) {
      return res.render('registerpage', { formErr: 'Password must be at least 6 characters', oldData: req.body })
    }
    if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      return res.render('registerpage', { formErr: 'Username: only letters, numbers and underscore allowed', oldData: req.body })
    }

    const emailTaken    = await UserModel.findOne({ myemail: myemail.toLowerCase().trim() })
    const usernameTaken = await UserModel.findOne({ username: username.toLowerCase().trim() })

    if (emailTaken)    return res.render('registerpage', { formErr: 'Email already registered', oldData: req.body })
    if (usernameTaken) return res.render('registerpage', { formErr: 'Username already taken', oldData: req.body })

    const newUser = await UserModel.create({
      myname,
      username:  username.toLowerCase().trim(),
      myemail:   myemail.toLowerCase().trim(),
      mypassword
    })

    req.session.loggedUser = {
      _id: newUser._id, myname: newUser.myname,
      username: newUser.username, myemail: newUser.myemail
    }
    req.flash('success', 'Account created! Welcome ' + newUser.myname)
    res.redirect('/dashboard')

  } catch (err) {
    console.log(err)
    res.render('registerpage', { formErr: 'Something went wrong: ' + err.message, oldData: req.body })
  }
})

myapp.get('/login', function(req, res) {
  if (req.session.loggedUser) return res.redirect('/dashboard')
  res.render('loginpage', { formErr: null, oldData: {} })
})

myapp.post('/login', async function(req, res) {
  try {
    const { myemail, mypassword } = req.body

    if (!myemail || !mypassword) {
      return res.render('loginpage', { formErr: 'Email and password are required', oldData: req.body })
    }

    const foundUser = await UserModel.findOne({ myemail: myemail.toLowerCase().trim() })
    if (!foundUser) {
      return res.render('loginpage', { formErr: 'Email not found', oldData: req.body })
    }

    const passMatch = await foundUser.checkPassword(mypassword)
    if (!passMatch) {
      return res.render('loginpage', { formErr: 'Wrong password', oldData: req.body })
    }

    req.session.loggedUser = {
      _id: foundUser._id, myname: foundUser.myname,
      username: foundUser.username, myemail: foundUser.myemail
    }
    req.flash('success', 'Welcome back ' + foundUser.myname)
    res.redirect('/dashboard')

  } catch (err) {
    console.log(err)
    res.render('loginpage', { formErr: 'Something went wrong', oldData: req.body })
  }
})

// logout part
myapp.post('/logout', function(req, res) {
  req.session.destroy(function() { res.redirect('/login') })
})

// dashboard showing after login part
myapp.get('/dashboard', checkLogin, function(req, res) {
  res.render('dashboardpage')
})

myapp.use(function(req, res) {
  res.status(404).render('notfoundpage')
})

// starting the server
const myport = process.env.PORT || 3000
myapp.listen(myport, function() {
  console.log('Server started at http://localhost:' + myport)
})
