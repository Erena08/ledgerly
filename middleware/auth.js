// middleware/auth.js

module.exports = function requireLogin(req, res, next) {
  if (!req.session.userId) {
    // ログインしてない場合ログインページへ
    return res.redirect("/auth/login");
  }

  // ログインしてるならそのまま次へ
  next();
};
