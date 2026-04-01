// PM Dashboard JS - Harsh Kumar, GLA University

window.onload = function() {
  var successmsg = document.getElementById('successmsg')
  var errormsg   = document.getElementById('errormsg')

  if (successmsg) {
    setTimeout(function() {
      successmsg.style.transition = 'opacity 0.5s'
      successmsg.style.opacity = '0'
      setTimeout(function() { successmsg.remove() }, 500)
    }, 4000)
  }
  if (errormsg) {
    setTimeout(function() {
      errormsg.style.transition = 'opacity 0.5s'
      errormsg.style.opacity = '0'
      setTimeout(function() { errormsg.remove() }, 500)
    }, 4000)
  }
}
