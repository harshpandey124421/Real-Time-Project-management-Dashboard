const express      = require('express')
const router       = express.Router()
const collabctrl   = require('../controllers/collaboratorcontroller')

const checkLogin = (req, res, next) => {
  if (!req.session.loggedUser) { req.flash('error', 'Please login first'); return res.redirect('/login') }
  next()
}

router.get('/searchuser',                         checkLogin, collabctrl.searchuser)
router.post('/:projectid/add',                    checkLogin, collabctrl.addcollaborator)
router.post('/:projectid/remove',                 checkLogin, collabctrl.removecollaborator)

module.exports = router
