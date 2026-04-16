const TaskModel    = require('../models/taskmodel')
const ProjectModel = require('../models/projectmodel')
const { isadmin, saveactivity, savenotification } = require('../helpers')

exports.addtask = async function(req, res) {
  try {
    const { taskname, taskdesc, taskstatus, taskpriority, taskdeadline, projectid, assignedTo } = req.body
    const userid    = req.session.loggedUser._id
    const myproject = await ProjectModel.findById(projectid)

    if (!myproject || !isadmin(myproject, userid)) {
      req.flash('error', 'Only admin can add tasks'); return res.redirect('/projects/' + projectid)
    }
    if (!taskname || !taskname.trim()) {
      req.flash('error', 'Task name is required'); return res.redirect('/projects/' + projectid)
    }

    const newtask = await TaskModel.create({
      taskname: taskname.trim(), taskdesc: taskdesc ? taskdesc.trim() : '',
      taskstatus: taskstatus || 'todo', taskpriority: taskpriority || 'medium',
      taskdeadline: taskdeadline || null, belongsTo: projectid,
      madeBy: userid, assignedTo: assignedTo || null
    })

    if (assignedTo && assignedTo !== userid.toString()) {
      await savenotification(assignedTo, req.session.loggedUser.myname + ' assigned you task: "' + taskname + '"', '/projects/' + projectid)
    }
    await saveactivity(projectid, userid, req.session.loggedUser.myname + ' added task: "' + taskname + '"')

    req.flash('success', 'Task added')
    res.redirect('/projects/' + projectid)
  } catch (err) {
    console.log(err)
    req.flash('error', 'Could not add task')
    res.redirect('/projects/' + req.body.projectid)
  }
}

exports.changestatus = async function(req, res) {
  try {
    const { newstatus, projectid } = req.body
    const userid    = req.session.loggedUser._id
    const mytask    = await TaskModel.findById(req.params.taskid)
    const myproject = await ProjectModel.findById(projectid)

    if (!mytask || !myproject) { req.flash('error', 'Task not found'); return res.redirect('/projects/' + projectid) }

    const amiadmin       = isadmin(myproject, userid)
    const isassignedtome = mytask.assignedTo && mytask.assignedTo.toString() === userid.toString()

    if (!amiadmin && !isassignedtome) {
      req.flash('error', 'You can only update tasks assigned to you'); return res.redirect('/projects/' + projectid)
    }

    await TaskModel.findByIdAndUpdate(req.params.taskid, { taskstatus: newstatus })
    await saveactivity(projectid, userid, req.session.loggedUser.myname + ' moved "' + mytask.taskname + '" to ' + newstatus)
    res.redirect('/projects/' + projectid)
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

exports.showedittask = async function(req, res) {
  try {
    const userid = req.session.loggedUser._id
    const mytask = await TaskModel.findById(req.params.taskid)
    if (!mytask) { req.flash('error', 'Task not found'); return res.redirect('/dashboard') }

    const myproject = await ProjectModel.findById(mytask.belongsTo)
      .populate('collaborators', 'myname username')
      .populate('madeBy', 'myname username')

    const amiadmin       = isadmin(myproject, userid)
    const isassignedtome = mytask.assignedTo && mytask.assignedTo.toString() === userid.toString()
    if (!amiadmin && !isassignedtome) { req.flash('error', 'Not allowed'); return res.redirect('/projects/' + mytask.belongsTo) }

    const allmembers = [myproject.madeBy, ...myproject.collaborators]
    res.render('edittaskpage', { mytask, formErr: null, amiadmin, allmembers })
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

exports.doedittask = async function(req, res) {
  try {
    const { taskname, taskdesc, taskstatus, taskpriority, taskdeadline, assignedTo } = req.body
    const userid = req.session.loggedUser._id
    const mytask = await TaskModel.findById(req.params.taskid)
    if (!mytask) { req.flash('error', 'Task not found'); return res.redirect('/dashboard') }

    const myproject = await ProjectModel.findById(mytask.belongsTo)
      .populate('collaborators', 'myname username')
      .populate('madeBy', 'myname username')

    const amiadmin       = isadmin(myproject, userid)
    const isassignedtome = mytask.assignedTo && mytask.assignedTo.toString() === userid.toString()
    if (!amiadmin && !isassignedtome) { req.flash('error', 'Not allowed'); return res.redirect('/projects/' + mytask.belongsTo) }

    if (!taskname || !taskname.trim()) {
      const allmembers = [myproject.madeBy, ...myproject.collaborators]
      return res.render('edittaskpage', { mytask, formErr: 'Task name cannot be empty', amiadmin, allmembers })
    }

    const updatedata = { taskname: taskname.trim(), taskdesc: taskdesc ? taskdesc.trim() : '', taskstatus, taskpriority, taskdeadline: taskdeadline || null }
    if (amiadmin) updatedata.assignedTo = assignedTo || null

    await TaskModel.findByIdAndUpdate(req.params.taskid, updatedata)
    await saveactivity(mytask.belongsTo, userid, req.session.loggedUser.myname + ' updated task: "' + taskname + '"')
    req.flash('success', 'Task updated')
    res.redirect('/projects/' + mytask.belongsTo)
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

exports.deletetask = async function(req, res) {
  try {
    const userid = req.session.loggedUser._id
    const mytask = await TaskModel.findById(req.params.taskid)
    if (!mytask) return res.redirect('/dashboard')

    const myproject = await ProjectModel.findById(mytask.belongsTo)
    if (!isadmin(myproject, userid)) { req.flash('error', 'Only admin can delete tasks'); return res.redirect('/projects/' + mytask.belongsTo) }

    await saveactivity(mytask.belongsTo, userid, req.session.loggedUser.myname + ' deleted task: "' + mytask.taskname + '"')
    await TaskModel.findByIdAndDelete(req.params.taskid)
    req.flash('success', 'Task deleted')
    res.redirect('/projects/' + mytask.belongsTo)
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

exports.addcomment = async function(req, res) {
  try {
    const { commenttext, projectid } = req.body
    const userid = req.session.loggedUser._id
    if (!commenttext || !commenttext.trim()) { req.flash('error', 'Comment cannot be empty'); return res.redirect('/projects/' + projectid) }

    await TaskModel.findByIdAndUpdate(req.params.taskid, {
      $push: { comments: { commenttext: commenttext.trim(), madeBy: userid } }
    })
    req.flash('success', 'Comment added')
    res.redirect('/projects/' + projectid)
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}
