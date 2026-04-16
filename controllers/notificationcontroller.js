const NotificationModel = require('../models/notificationmodel')

exports.shownotifications = async function(req, res) {
  try {
    const userid = req.session.loggedUser._id
    const allnotifications = await NotificationModel.find({ userid }).sort({ createdAt: -1 }).limit(50)
    await NotificationModel.updateMany({ userid, isread: false }, { isread: true })
    res.render('notificationspage', { allnotifications })
  } catch (err) { console.log(err); res.redirect('/dashboard') }
}
