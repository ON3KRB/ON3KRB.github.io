// Main navigation helpers (UTC clock + mobile drawer)
(function(){
  function updateClock(){
    var n = new Date();
    var h = String(n.getUTCHours()).padStart(2,'0');
    var m = String(n.getUTCMinutes()).padStart(2,'0');
    var s = String(n.getUTCSeconds()).padStart(2,'0');
    var el = document.getElementById('navClock');
    if (el) el.textContent = `${h}:${m}:${s} UTC`;
  }
  updateClock();
  setInterval(updateClock, 1000);

  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer){
    burger.addEventListener('click', function(){
      burger.classList.toggle('open');
      drawer.classList.toggle('open');
    });
    drawer.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        burger.classList.remove('open');
        drawer.classList.remove('open');
      });
    });
  }
})();
