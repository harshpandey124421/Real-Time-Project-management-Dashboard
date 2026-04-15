const express       = require('express')
const router        = express.Router()
const dashctrl      = require('../controllers/dashboardcontroller')
const checkLogin    = (req, res, next) => {
  if (!req.session.loggedUser) { req.flash('error', 'Please login first'); return res.redirect('/login') }
  next()
}

router.get('/', checkLogin, dashctrl.showdashboard)

module.exports = router
