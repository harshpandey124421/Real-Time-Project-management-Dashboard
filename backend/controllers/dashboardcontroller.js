const ProjectModel      = require('../models/projectmodel')
const TaskModel         = require('../models/taskmodel')

exports.showdashboard = async function(req, res) {
  try {
    const userid = req.session.loggedUser._id

    const allprojects = await ProjectModel.find({
      $or: [{ madeBy: userid }, { collaborators: userid }]
    }).sort({ createdAt: -1 })

    const mytasks = await TaskModel.find({ assignedTo: userid }).populate('belongsTo', 'projectname')

    const totaltasks      = mytasks.length
    const todocount       = mytasks.filter(t => t.taskstatus === 'todo').length
    const inprogresscount = mytasks.filter(t => t.taskstatus === 'inprogress').length
    const donecount       = mytasks.filter(t => t.taskstatus === 'done').length

    const today     = new Date()
    const threedays = new Date()
    threedays.setDate(today.getDate() + 3)

    const duesoontasks = mytasks.filter(t =>
      t.taskdeadline && t.taskstatus !== 'done' &&
      new Date(t.taskdeadline) >= today && new Date(t.taskdeadline) <= threedays
    )
    const overduetasks = mytasks.filter(t =>
      t.taskdeadline && t.taskstatus !== 'done' && new Date(t.taskdeadline) < today
    )

    const projectswithcount = []
    for (let p of allprojects) {
      const ptasks = await TaskModel.find({ belongsTo: p._id })
      projectswithcount.push({
        _id: p._id, projectname: p.projectname, projectdesc: p.projectdesc,
        projectstatus: p.projectstatus, projectdeadline: p.projectdeadline,
        githubrepo: p.githubrepo,
        totaltasks: ptasks.length,
        donetasks:  ptasks.filter(t => t.taskstatus === 'done').length,
        iamadmin:   p.madeBy.toString() === userid.toString(),
        membercount: p.collaborators.length + 1
      })
    }

    res.render('dashboardpage', {
      allprojects: projectswithcount,
      totalprojects:  allprojects.length,
      activeprojects: allprojects.filter(p => p.projectstatus === 'active').length,
      totaltasks, todocount, inprogresscount, donecount,
      duesoontasks, overduetasks
    })
  } catch (err) {
    console.log(err)
    res.render('dashboardpage', {
      allprojects: [], totalprojects: 0, activeprojects: 0,
      totaltasks: 0, todocount: 0, inprogresscount: 0, donecount: 0,
      duesoontasks: [], overduetasks: []
    })
  }
}
