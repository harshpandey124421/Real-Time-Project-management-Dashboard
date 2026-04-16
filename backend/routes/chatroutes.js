const express   = require('express')
const router    = express.Router()
const chatctrl  = require('../controllers/chatcontroller')

const checkLogin = (req, res, next) => {
  if (!req.session.loggedUser) { req.flash('error', 'Please login first'); return res.redirect('/login') }
  next()
}

router.get('/:projectid',         checkLogin, chatctrl.showchat)
router.post('/:projectid/send',   checkLogin, chatctrl.sendmessage)

module.exports = router
