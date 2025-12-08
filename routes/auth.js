var express = require("express");
var router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");


// ----------------------
// 新規登録ページ表示
// ----------------------
router.get("/register", (req, res) => {
  res.render("auth/register", { error: null });
});


// ----------------------
// 新規登録処理
// ----------------------
router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  // 既に使われているメールのチェック
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.render("auth/register", { error: "このメールは既に使われています。" });
  }

  // パスワードハッシュ化
  const hashedPassword = await bcrypt.hash(password, 10);

  // ユーザー登録
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  // セッション保存（ログイン状態にする）
  req.session.userId = user.id;

  res.redirect("/items"); // ログイン後のページへ
});

// ----------------------
// ログインページ表示
// ----------------------
router.get("/login", (req, res) => {
  res.render("auth/login", { error: null });
});


// ----------------------
// ログイン処理
// ----------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.render("auth/login", { error: "メールまたはパスワードが違います。" });
  }

  // パスワード照合
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("auth/login", { error: "メールまたはパスワードが違います。" });
  }

  // セッションにユーザーIDを保存
  req.session.userId = user.id;

  res.redirect("/items"); // ログイン後のページ
});

// ----------------------
// ログアウト
// ----------------------
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
});

module.exports = router;
