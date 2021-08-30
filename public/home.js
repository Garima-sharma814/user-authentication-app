const btn = document.querySelector('#disabled');

if(req.body.userRole === 'admin' || req.body.userRole === 'Admin') {
  btn.display = 'block';
}