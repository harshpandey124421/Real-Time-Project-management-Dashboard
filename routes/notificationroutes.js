const express      = require('express')
const router       = express.Router()
const notifctrl    = require('../controllers/notificationcontroller')

const checkLogin = (req, res, next) => {
  if (!req.session.loggedUser) { req.flash('error', 'Please login first'); return res.redirect('/login') }
  next()
}

router.get('/', checkLogin, notifctrl.shownotifications)

module.exports = router
