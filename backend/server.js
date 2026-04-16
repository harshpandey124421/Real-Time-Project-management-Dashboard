const express        = require('express')
const mongoose       = require('mongoose')
const session        = require('express-session')
const flash          = require('connect-flash')
const methodOverride = require('method-override')
const dotenv         = require('dotenv')
const path           = require('path')

dotenv.config()

const myapp = express()

// ---------- mongodb ----------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err))

// ---------- view engine ----------
myapp.set('view engine', 'ejs')
myapp.set('views', path.join(__dirname, '../frontend/views'))
myapp.use(express.static(path.join(__dirname, '../frontend/public')))

// ---------- middleware ----------
myapp.use(express.urlencoded({ extended: true }))
myapp.use(express.json())
myapp.use(methodOverride('_method'))

myapp.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}))

myapp.use(flash())

// make flash + user + unread count available in all views
const NotificationModel = require('./models/notificationmodel')
myapp.use(async function(req, res, next) {
  res.locals.successMsg = req.flash('success')
  res.locals.errorMsg   = req.flash('error')
  res.locals.loggedUser = req.session.loggedUser || null
  res.locals.unreadcount = 0
  if (req.session.loggedUser) {
    try {
      res.locals.unreadcount = await NotificationModel.countDocuments({
        userid: req.session.loggedUser._id,
        isread: false
      })
    } catch (e) {}
  }
  next()
})

// ---------- login check middleware ----------
function checkLogin(req, res, next) {
  if (!req.session.loggedUser) {
    req.flash('error', 'Please login first')
    return res.redirect('/login')
  }
  next()
}

// make checkLogin available to all route files
myapp.use(function(req, res, next) {
  req.checkLogin = checkLogin
  next()
})

// ---------- routes ----------
myapp.use('/',              require('./routes/authroutes'))
myapp.use('/dashboard',     require('./routes/dashboardroutes'))
myapp.use('/projects',      require('./routes/projectroutes'))
myapp.use('/tasks',         require('./routes/taskroutes'))
myapp.use('/collaborators', require('./routes/collaboratorroutes'))
myapp.use('/chat',          require('./routes/chatroutes'))
myapp.use('/notifications', require('./routes/notificationroutes'))
myapp.use('/profile',       require('./routes/profileroutes'))

// ---------- 404 ----------
myapp.use(function(req, res) {
  res.status(404).render('notfoundpage')
})

// ---------- start ----------
const myport = process.env.PORT || 3000
myapp.listen(myport, function() {
  console.log('Server running at http://localhost:' + myport)
})
