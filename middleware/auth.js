function isLoggedIn(req, res, next) {
  if (req.session.email) {
    return next(); // User is logged in 
  }
  res.redirect('/login'); // Not logged in redirect to login
}

module.exports = isLoggedIn;
