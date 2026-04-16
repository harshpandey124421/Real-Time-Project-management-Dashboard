const UserModel    = require('../models/usermodel')
const ProjectModel = require('../models/projectmodel')
const TaskModel    = require('../models/taskmodel')
const { isadmin, saveactivity, savenotification } = require('../helpers')

exports.searchuser = async function(req, res) {
  try {
    const searchterm = req.query.username
    if (!searchterm) return res.json({ found: false, msg: 'Type a username' })
    const founduser = await UserModel.findOne({ username: searchterm.toLowerCase().trim() })
    if (!founduser) return res.json({ found: false, msg: 'No user found with that username' })
    if (founduser._id.toString() === req.session.loggedUser._id.toString())
      return res.json({ found: false, msg: 'That is your own account' })
    res.json({ found: true, userid: founduser._id, myname: founduser.myname, username: founduser.username })
  } catch (err) {
    console.log(err)
    res.json({ found: false, msg: 'Something went wrong' })
  }
}

exports.addcollaborator = async function(req, res) {
  try {
    const userid    = req.session.loggedUser._id
    const myproject = await ProjectModel.findById(req.params.projectid)
    if (!myproject || !isadmin(myproject, userid)) {
      req.flash('error', 'Only admin can add collaborators'); return res.redirect('/projects/' + req.params.projectid)
    }
    const { userid: newuserid } = req.body
    const usertoadd = await UserModel.findById(newuserid)
    if (!usertoadd) { req.flash('error', 'User not found'); return res.redirect('/projects/' + req.params.projectid) }

    const alreadyin = myproject.collaborators.some(c => c.toString() === newuserid)
    if (alreadyin) { req.flash('error', usertoadd.myname + ' is already in this project'); return res.redirect('/projects/' + req.params.projectid) }

    await ProjectModel.findByIdAndUpdate(req.params.projectid, { $push: { collaborators: newuserid } })
    await savenotification(newuserid, 'You were added to project: ' + myproject.projectname, '/projects/' + myproject._id)
    await saveactivity(myproject._id, userid, req.session.loggedUser.myname + ' added ' + usertoadd.myname + ' as collaborator')

    req.flash('success', usertoadd.myname + ' added!')
    res.redirect('/projects/' + req.params.projectid)
  } catch (err) { console.log(err); res.redirect('/projects/' + req.params.projectid) }
}

exports.removecollaborator = async function(req, res) {
  try {
    const userid    = req.session.loggedUser._id
    const myproject = await ProjectModel.findById(req.params.projectid)
    if (!myproject || !isadmin(myproject, userid)) {
      req.flash('error', 'Only admin can remove collaborators'); return res.redirect('/projects/' + req.params.projectid)
    }
    const { userid: removeuserid } = req.body
    await ProjectModel.findByIdAndUpdate(req.params.projectid, { $pull: { collaborators: removeuserid } })
    await TaskModel.updateMany({ belongsTo: req.params.projectid, assignedTo: removeuserid }, { assignedTo: null })
    await savenotification(removeuserid, 'You were removed from project: ' + myproject.projectname, '/projects/browse')
    await saveactivity(myproject._id, userid, req.session.loggedUser.myname + ' removed a collaborator')

    req.flash('success', 'Collaborator removed')
    res.redirect('/projects/' + req.params.projectid)
  } catch (err) { console.log(err); res.redirect('/projects/' + req.params.projectid) }
}
