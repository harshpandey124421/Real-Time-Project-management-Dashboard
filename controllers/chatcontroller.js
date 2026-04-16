const ChatModel    = require('../models/chatmodel')
const ProjectModel = require('../models/projectmodel')
const { ismember, savenotification } = require('../helpers')

exports.showchat = async function(req, res) {
  try {
    const userid    = req.session.loggedUser._id
    const myproject = await ProjectModel.findById(req.params.projectid)
      .populate('madeBy', 'myname username')
      .populate('collaborators', 'myname username')

    if (!myproject || !ismember(myproject, userid)) {
      req.flash('error', 'Not allowed'); return res.redirect('/dashboard')
    }

    const messages = await ChatModel.find({ projectid: myproject._id })
      .populate('madeBy', 'myname username')
      .sort({ createdAt: 1 })

    res.render('chatpage', { myproject, messages, myid: userid.toString() })
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}

exports.sendmessage = async function(req, res) {
  try {
    const userid    = req.session.loggedUser._id
    const { messagetext } = req.body
    const myproject = await ProjectModel.findById(req.params.projectid)
      .populate('collaborators', '_id')

    if (!myproject || !ismember(myproject, userid)) {
      req.flash('error', 'Not allowed'); return res.redirect('/dashboard')
    }
    if (!messagetext || !messagetext.trim()) {
      req.flash('error', 'Message cannot be empty'); return res.redirect('/chat/' + req.params.projectid)
    }

    await ChatModel.create({ projectid: myproject._id, madeBy: userid, messagetext: messagetext.trim() })

    // notify other members
    const allids = [myproject.madeBy, ...myproject.collaborators.map(c => c._id || c)]
    for (let mid of allids) {
      if (mid.toString() !== userid.toString()) {
        await savenotification(mid, req.session.loggedUser.myname + ' sent a message in ' + myproject.projectname, '/chat/' + myproject._id)
      }
    }
    res.redirect('/chat/' + req.params.projectid)
  } catch (err) { console.log(err); res.redirect('/chat/' + req.params.projectid) }
}
