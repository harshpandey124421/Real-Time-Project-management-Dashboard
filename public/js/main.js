// Real Time Project Management Dashboard - JS
// Made by Harsh Kumar, GLA University

// ---- show/hide add task form ----
function showhideTaskForm() {
  var formarea  = document.getElementById('taskformarea')
  var togglebtn = document.getElementById('togglebtntext')
  if (!formarea) return
  if (formarea.style.display === 'none') {
    formarea.style.display = 'block'
    togglebtn.innerText    = '✕ Cancel'
  } else {
    formarea.style.display = 'none'
    togglebtn.innerText    = '+ Add New Task'
  }
}

// ---- show/hide collaborator search box ----
function showhideCollabBox() {
  var box = document.getElementById('addcollabbox')
  if (!box) return
  box.style.display = box.style.display === 'none' ? 'block' : 'none'
}

// ---- search user by username ----
function searchUser() {
  var input      = document.getElementById('usernamesearch')
  var resultbox  = document.getElementById('searchresult')
  var addform    = document.getElementById('addcollabform')
  var useridInput = document.getElementById('collabUserId')
  if (!input) return

  var username = input.value.trim()
  if (!username) {
    resultbox.style.display = 'none'
    return
  }

  fetch('/collaborators/searchuser?username=' + encodeURIComponent(username))
    .then(function(res) { return res.json() })
    .then(function(data) {
      resultbox.style.display = 'block'
      if (data.found) {
        resultbox.className = 'searchresult searchresult-found'
        resultbox.innerHTML = '✓ Found: <strong>' + data.myname + '</strong> (@' + data.username + ')'
        useridInput.value   = data.userid
        addform.style.display = 'inline'
      } else {
        resultbox.className   = 'searchresult searchresult-notfound'
        resultbox.innerHTML   = '✗ ' + data.msg
        addform.style.display = 'none'
        useridInput.value     = ''
      }
    })
    .catch(function() {
      resultbox.style.display = 'block'
      resultbox.className     = 'searchresult searchresult-notfound'
      resultbox.innerHTML     = '✗ Search failed, try again'
    })
}

// ---- tabs on project detail page ----
function showtab(tabname) {
  // hide all tab contents
  var allcontent = document.querySelectorAll('.tabcontent')
  allcontent.forEach(function(el) { el.style.display = 'none' })

  // remove active from all tab buttons
  var alllinks = document.querySelectorAll('.tablink')
  alllinks.forEach(function(el) { el.classList.remove('active') })

  // show selected tab
  var target = document.getElementById('tab-' + tabname)
  if (target) target.style.display = 'block'

  // mark button active
  event.target.classList.add('active')
}

// ---- toggle task comments ----
function togglecomments(taskid) {
  var box = document.getElementById('comments-' + taskid)
  if (!box) return
  box.style.display = box.style.display === 'none' ? 'block' : 'none'
}

// ---- copy text to clipboard ----
function copytext(inputid) {
  var input = document.getElementById(inputid)
  if (!input) return
  input.select()
  document.execCommand('copy')
  // brief visual feedback
  var original = input.nextElementSibling.innerText
  input.nextElementSibling.innerText = 'Copied!'
  setTimeout(function() { input.nextElementSibling.innerText = original }, 1500)
}

// ---- show/hide join request form on browse page ----
function showrequestform(projectid) {
  var form = document.getElementById('reqform-' + projectid)
  if (!form) return
  form.style.display = form.style.display === 'none' ? 'block' : 'none'
}

// ---- scroll chat to bottom ----
function scrollchatdown() {
  var chatbox = document.getElementById('chatbox')
  if (chatbox) chatbox.scrollTop = chatbox.scrollHeight
}

// ---- auto hide flash messages ----
window.onload = function() {
  var successmsg = document.getElementById('successmsg')
  var errormsg   = document.getElementById('errormsg')

  if (successmsg) {
    setTimeout(function() {
      successmsg.style.transition = 'opacity 0.5s'
      successmsg.style.opacity    = '0'
      setTimeout(function() { successmsg.remove() }, 500)
    }, 4000)
  }
  if (errormsg) {
    setTimeout(function() {
      errormsg.style.transition = 'opacity 0.5s'
      errormsg.style.opacity    = '0'
      setTimeout(function() { errormsg.remove() }, 500)
    }, 4000)
  }

  // scroll chat to bottom on page load
  scrollchatdown()
}
