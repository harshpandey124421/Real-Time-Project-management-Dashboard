const UserModel    = require('../models/usermodel')
const ProjectModel = require('../models/projectmodel')

exports.showprofile = async function(req, res) {
  try {
    const userid     = req.params.userid || req.session.loggedUser._id
    const myuser     = await UserModel.findById(userid).select('-mypassword')
    if (!myuser) { req.flash('error', 'User not found'); return res.redirect('/dashboard') }
    const myprojects = await ProjectModel.find({ $or: [{ madeBy: userid }, { collaborators: userid }] })
    const isownprofile = userid.toString() === req.session.loggedUser._id.toString()
    res.render('profilepage', { myuser, myprojects, isownprofile, formErr: null })
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

exports.updateprofile = async function(req, res) {
  try {
    const userid     = req.session.loggedUser._id
    const { myname, mybio } = req.body
    if (!myname || !myname.trim()) {
      const myuser     = await UserModel.findById(userid)
      const myprojects = await ProjectModel.find({ $or: [{ madeBy: userid }, { collaborators: userid }] })
      return res.render('profilepage', { myuser, myprojects, isownprofile: true, formErr: 'Name cannot be empty' })
    }
    await UserModel.findByIdAndUpdate(userid, { myname: myname.trim(), mybio: mybio ? mybio.trim() : '' })
    req.session.loggedUser.myname = myname.trim()
    req.flash('success', 'Profile updated')
    res.redirect('/profile')
  } catch (err) { console.log(err); res.redirect('/profile') }
}

exports.changepassword = async function(req, res) {
  try {
    const userid = req.session.loggedUser._id
    const { oldpassword, newpassword, confirmpassword } = req.body
    const myuser     = await UserModel.findById(userid)
    const myprojects = await ProjectModel.find({ $or: [{ madeBy: userid }, { collaborators: userid }] })
    const passmatch  = await myuser.checkPassword(oldpassword)
    if (!passmatch)
      return res.render('profilepage', { myuser, myprojects, isownprofile: true, formErr: 'Old password is wrong' })
    if (newpassword !== confirmpassword)
      return res.render('profilepage', { myuser, myprojects, isownprofile: true, formErr: 'New passwords do not match' })
    if (newpassword.length < 6)
      return res.render('profilepage', { myuser, myprojects, isownprofile: true, formErr: 'Password must be at least 6 characters' })
    myuser.mypassword = newpassword
    await myuser.save()
    req.flash('success', 'Password changed!')
    res.redirect('/profile')
  } catch (err) { console.log(err); res.redirect('/profile') }
}
