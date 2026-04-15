const express    = require('express')
const router     = express.Router()
const projectctrl = require('../controllers/projectcontroller')

const checkLogin = (req, res, next) => {
  if (!req.session.loggedUser) { req.flash('error', 'Please login first'); return res.redirect('/login') }
  next()
}

router.get('/browse',                    checkLogin, projectctrl.browseprojects)
router.get('/new',                       checkLogin, projectctrl.showaddproject)
router.post('/new',                      checkLogin, projectctrl.doaddproject)
router.get('/:projectid',               checkLogin, projectctrl.viewproject)
router.get('/:projectid/edit',          checkLogin, projectctrl.showeditproject)
router.put('/:projectid/edit',          checkLogin, projectctrl.doeditproject)
router.delete('/:projectid/delete',     checkLogin, projectctrl.deleteproject)
router.post('/:projectid/joinrequest',  checkLogin, projectctrl.sendjoinrequest)
router.post('/requests/:requestid/accept', checkLogin, projectctrl.acceptrequest)
router.post('/requests/:requestid/reject', checkLogin, projectctrl.rejectrequest)

module.exports = router
