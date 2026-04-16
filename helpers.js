const ActivityModel     = require('./models/activitymodel')
const NotificationModel = require('./models/notificationmodel')

function isadmin(project, userid) {
  const id = userid.toString()
  const adminid = project.madeBy._id
    ? project.madeBy._id.toString()
    : project.madeBy.toString()
  return adminid === id
}

function ismember(project, userid) {
  if (isadmin(project, userid)) return true
  const id = userid.toString()
  return project.collaborators.some(c => {
    return c._id ? c._id.toString() === id : c.toString() === id
  })
}

async function saveactivity(projectid, userid, text) {
  try {
    await ActivityModel.create({ projectid, madeBy: userid, activitytext: text })
  } catch (err) {
    console.log('Activity log error:', err)
  }
}

async function savenotification(userid, message, link) {
  try {
    await NotificationModel.create({ userid, message, link: link || '' })
  } catch (err) {
    console.log('Notification error:', err)
  }
}

function parsegithubrepo(repourl) {
  if (!repourl) return null
  try {
    const clean = repourl.replace(/\.git$/, '').replace(/\/$/, '')
    const parts = clean.split('github.com/')
    if (parts.length < 2) return null
    const [owner, repo] = parts[1].split('/')
    if (!owner || !repo) return null
    return {
      owner,
      repo,
      httpsclone: 'git clone ' + clean + '.git',
      sshclone:   'git clone git@github.com:' + owner + '/' + repo + '.git',
      repourl:    clean
    }
  } catch (err) {
    return null
  }
}

module.exports = { isadmin, ismember, saveactivity, savenotification, parsegithubrepo }
