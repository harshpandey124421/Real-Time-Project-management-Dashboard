const ProjectModel     = require('../models/projectmodel')
const TaskModel        = require('../models/taskmodel')
const JoinRequestModel = require('../models/joinrequestmodel')
const ActivityModel    = require('../models/activitymodel')
const { isadmin, ismember, saveactivity, savenotification, parsegithubrepo } = require('../helpers')

// browse public projects
exports.browseprojects = async function(req, res) {
  try {
    const userid     = req.session.loggedUser._id
    const allpublic  = await ProjectModel.find({ ispublic: true }).populate('madeBy', 'myname username')
    const browseable = allpublic.filter(p => !ismember(p, userid))
    const myrequests = await JoinRequestModel.find({ requestedBy: userid, status: 'pending' })
    const myrequestids = myrequests.map(r => r.projectid.toString())
    res.render('browseprojectspage', { browseable, myrequestids })
  } catch (err) {
    console.log(err)
    res.redirect('/dashboard')
  }
}

// show add project form
exports.showaddproject = function(req, res) {
  res.render('addprojectpage', { formErr: null, oldData: {} })
}

// save new project
exports.doaddproject = async function(req, res) {
  try {
    const { projectname, projectdesc, projectstatus, projectdeadline, ispublic, githubrepo } = req.body
    const userid = req.session.loggedUser._id
    if (!projectname || !projectname.trim())
      return res.render('addprojectpage', { formErr: 'Project name is required', oldData: req.body })

    const newproject = await ProjectModel.create({
      projectname: projectname.trim(),
      projectdesc: projectdesc ? projectdesc.trim() : '',
      projectstatus: projectstatus || 'active',
      projectdeadline: projectdeadline || null,
      ispublic: ispublic === 'on',
      githubrepo: githubrepo ? githubrepo.trim() : '',
      madeBy: userid
    })
    await saveactivity(newproject._id, userid, req.session.loggedUser.myname + ' created this project')
    req.flash('success', 'Project created!')
    res.redirect('/dashboard')
  } catch (err) {
    console.log(err)
    res.render('addprojectpage', { formErr: 'Could not save project', oldData: req.body })
  }
}

// view single project
exports.viewproject = async function(req, res) {
  try {
    const userid = req.session.loggedUser._id
    const myproject = await ProjectModel.findById(req.params.projectid)
      .populate('madeBy', 'myname username')
      .populate('collaborators', 'myname username')

    if (!myproject) { req.flash('error', 'Project not found'); return res.redirect('/dashboard') }
    if (!ismember(myproject, userid)) { req.flash('error', 'You are not a member'); return res.redirect('/dashboard') }

    const mytasks = await TaskModel.find({ belongsTo: myproject._id })
      .populate('assignedTo', 'myname username')
      .populate('comments.madeBy', 'myname username')
      .sort({ createdAt: -1 })

    const taskcount = {
      total: mytasks.length,
      todo: mytasks.filter(t => t.taskstatus === 'todo').length,
      inprogress: mytasks.filter(t => t.taskstatus === 'inprogress').length,
      done: mytasks.filter(t => t.taskstatus === 'done').length
    }
    const progresspct = taskcount.total > 0 ? Math.round((taskcount.done / taskcount.total) * 100) : 0

    const allmembers = [myproject.madeBy, ...myproject.collaborators]

    // member stats for progress section
    const memberstats = allmembers.map(m => {
      const membertasks = mytasks.filter(t => t.assignedTo && t.assignedTo._id.toString() === m._id.toString())
      return {
        myname: m.myname, username: m.username,
        total: membertasks.length,
        done:  membertasks.filter(t => t.taskstatus === 'done').length,
        inprogress: membertasks.filter(t => t.taskstatus === 'inprogress').length
      }
    })

    const recentactivity = await ActivityModel.find({ projectid: myproject._id })
      .populate('madeBy', 'myname')
      .sort({ createdAt: -1 }).limit(10)

    let pendingrequests = []
    if (isadmin(myproject, userid)) {
      pendingrequests = await JoinRequestModel.find({ projectid: myproject._id, status: 'pending' })
        .populate('requestedBy', 'myname username')
    }

    // parse github info
    const githubinfo = parsegithubrepo(myproject.githubrepo)

    res.render('projectdetailpage', {
      myproject, mytasks, taskcount, progresspct,
      amiadmin: isadmin(myproject, userid),
      allmembers, memberstats, recentactivity, pendingrequests,
      githubinfo, myid: userid.toString()
    })
  } catch (err) {
    console.log(err)
    req.flash('error', 'Something went wrong')
    res.redirect('/dashboard')
  }
}

// show edit project form
exports.showeditproject = async function(req, res) {
  try {
    const myproject = await ProjectModel.findById(req.params.projectid)
    if (!myproject || !isadmin(myproject, req.session.loggedUser._id)) {
      req.flash('error', 'Not allowed'); return res.redirect('/dashboard')
    }
    res.render('editprojectpage', { myproject, formErr: null })
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

// save edited project
exports.doeditproject = async function(req, res) {
  try {
    const { projectname, projectdesc, projectstatus, projectdeadline, ispublic, githubrepo } = req.body
    const userid    = req.session.loggedUser._id
    const myproject = await ProjectModel.findById(req.params.projectid)
    if (!myproject || !isadmin(myproject, userid)) {
      req.flash('error', 'Not allowed'); return res.redirect('/dashboard')
    }
    if (!projectname || !projectname.trim())
      return res.render('editprojectpage', { myproject, formErr: 'Project name cannot be empty' })

    await ProjectModel.findByIdAndUpdate(req.params.projectid, {
      projectname: projectname.trim(),
      projectdesc: projectdesc ? projectdesc.trim() : '',
      projectstatus, projectdeadline: projectdeadline || null,
      ispublic: ispublic === 'on',
      githubrepo: githubrepo ? githubrepo.trim() : ''
    })
    await saveactivity(myproject._id, userid, req.session.loggedUser.myname + ' updated project details')
    req.flash('success', 'Project updated')
    res.redirect('/projects/' + req.params.projectid)
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

// delete project
exports.deleteproject = async function(req, res) {
  try {
    const userid    = req.session.loggedUser._id
    const myproject = await ProjectModel.findById(req.params.projectid)
    if (!myproject || !isadmin(myproject, userid)) {
      req.flash('error', 'Only admin can delete'); return res.redirect('/dashboard')
    }
    await TaskModel.deleteMany({ belongsTo: req.params.projectid })
    await ActivityModel.deleteMany({ projectid: req.params.projectid })
    await JoinRequestModel.deleteMany({ projectid: req.params.projectid })
    await ProjectModel.findByIdAndDelete(req.params.projectid)
    req.flash('success', 'Project deleted')
    res.redirect('/dashboard')
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

// send join request
exports.sendjoinrequest = async function(req, res) {
  try {
    const userid    = req.session.loggedUser._id
    const projectid = req.params.projectid
    const myproject = await ProjectModel.findById(projectid)

    if (ismember(myproject, userid)) {
      req.flash('error', 'You are already a member'); return res.redirect('/projects/browse')
    }
    const existing = await JoinRequestModel.findOne({ requestedBy: userid, projectid, status: 'pending' })
    if (existing) {
      req.flash('error', 'You already sent a request for this project'); return res.redirect('/projects/browse')
    }

    await JoinRequestModel.create({ requestedBy: userid, projectid, message: req.body.message || '' })
    await savenotification(
      myproject.madeBy,
      req.session.loggedUser.myname + ' (@' + req.session.loggedUser.username + ') wants to join ' + myproject.projectname,
      '/projects/' + projectid
    )
    req.flash('success', 'Join request sent!')
    res.redirect('/projects/browse')
  } catch (err) { console.log(err); res.redirect('/projects/browse') }
}

// accept join request
exports.acceptrequest = async function(req, res) {
  try {
    const userid  = req.session.loggedUser._id
    const joinreq = await JoinRequestModel.findById(req.params.requestid)
      .populate('requestedBy', 'myname username')
      .populate('projectid')

    if (!joinreq || !isadmin(joinreq.projectid, userid)) {
      req.flash('error', 'Not allowed'); return res.redirect('/dashboard')
    }

    await ProjectModel.findByIdAndUpdate(joinreq.projectid._id, { $addToSet: { collaborators: joinreq.requestedBy._id } })
    await JoinRequestModel.findByIdAndUpdate(req.params.requestid, { status: 'accepted' })
    await savenotification(joinreq.requestedBy._id, 'Your request to join ' + joinreq.projectid.projectname + ' was accepted!', '/projects/' + joinreq.projectid._id)
    await saveactivity(joinreq.projectid._id, userid, joinreq.requestedBy.myname + ' joined the project')

    req.flash('success', joinreq.requestedBy.myname + ' added!')
    res.redirect('/projects/' + joinreq.projectid._id)
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

// reject join request
exports.rejectrequest = async function(req, res) {
  try {
    const userid  = req.session.loggedUser._id
    const joinreq = await JoinRequestModel.findById(req.params.requestid)
      .populate('requestedBy', 'myname')
      .populate('projectid')

    if (!joinreq || !isadmin(joinreq.projectid, userid)) {
      req.flash('error', 'Not allowed'); return res.redirect('/dashboard')
    }

    await JoinRequestModel.findByIdAndUpdate(req.params.requestid, { status: 'rejected' })
    await savenotification(joinreq.requestedBy._id, 'Your request to join ' + joinreq.projectid.projectname + ' was rejected.', '/projects/browse')

    req.flash('success', 'Request rejected')
    res.redirect('/projects/' + joinreq.projectid._id)
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}
