const express  = require('express')
const router   = express.Router()
const authctrl = require('../controllers/authcontroller')

router.get('/', (req, res) => {
  if (req.session.loggedUser) return res.redirect('/dashboard')
  res.redirect('/login')
})
router.get('/register',  authctrl.showregister)
router.post('/register', authctrl.doregister)
router.get('/login',     authctrl.showlogin)
router.post('/login',    authctrl.dologin)
router.post('/logout',   authctrl.dologout)

module.exports = router
