const express      = require('express')
const router       = express.Router()
const profilectrl  = require('../controllers/profilecontroller')

const checkLogin = (req, res, next) => {
  if (!req.session.loggedUser) { req.flash('error', 'Please login first'); return res.redirect('/login') }
  next()
}

router.get('/',                   checkLogin, profilectrl.showprofile)
router.get('/:userid',            checkLogin, profilectrl.showprofile)
router.post('/update',            checkLogin, profilectrl.updateprofile)
router.post('/changepassword',    checkLogin, profilectrl.changepassword)

module.exports = router
