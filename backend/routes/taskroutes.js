const express   = require('express')
const router    = express.Router()
const taskctrl  = require('../controllers/taskcontroller')

const checkLogin = (req, res, next) => {
  if (!req.session.loggedUser) { req.flash('error', 'Please login first'); return res.redirect('/login') }
  next()
}

router.post('/add',                        checkLogin, taskctrl.addtask)
router.post('/:taskid/changestatus',       checkLogin, taskctrl.changestatus)
router.get('/:taskid/edit',                checkLogin, taskctrl.showedittask)
router.put('/:taskid/edit',                checkLogin, taskctrl.doedittask)
router.delete('/:taskid/delete',           checkLogin, taskctrl.deletetask)
router.post('/:taskid/addcomment',         checkLogin, taskctrl.addcomment)

module.exports = router
