var express = require("express");
var router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ログインチェック
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.redirect("/auth/login");
  }
  next();
}

// ----------------------------------------
// ▶ 収支一覧 + フィルタ + サマリー
// ----------------------------------------
router.get("/", requireLogin, async (req, res) => {
  const userId = req.session.userId;

  const { type, start, end } = req.query;

  const where = { userId };

  if (type && type !== "all") {
    where.type = type;
  }

  if (start) {
    where.createdAt = { ...where.createdAt, gte: new Date(start) };
  }

  // 日付フィルタ
if (start || end) {
  where.createdAt = {};

  if (start) {
    where.createdAt.gte = new Date(start); // 例: 12/01 00:00
  }

  if (end) {
    const endDate = new Date(end);

    // ← ここがポイント（翌日の00:00を上限にする）
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(0, 0, 0, 0);

    where.createdAt.lte = endDate;
  }
}

  const items = await prisma.item.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const income = items
    .filter(i => i.type === "income")
    .reduce((sum, i) => sum + i.amount, 0);

  const expense = items
    .filter(i => i.type === "expense")
    .reduce((sum, i) => sum + i.amount, 0);

  const balance = income - expense;

  res.render("items/index", {
    items,
    income,
    expense,
    balance,
    filters: { type, start, end },
  });
});

// ----------------------------------------
// ▶ itemsページ内フォームから新規追加
// ----------------------------------------
router.post("/", requireLogin, async (req, res) => {
  const { event, amount, type, memo } = req.body;

  if (!event || !amount || !type) {
    return res.redirect("/items?error=1");
  }

  await prisma.item.create({
    data: {
      event,
      amount: Number(amount),
      type,
      memo,
      userId: req.session.userId,
    },
  });

  res.redirect("/items");
});

// 編集ページ表示
router.get("/edit/:id", requireLogin, async (req, res) => {
  const item = await prisma.item.findUnique({
    where: { id: Number(req.params.id) }
  });
  res.render("items/edit", { item });
});

// 編集処理
router.post("/edit/:id", requireLogin, async (req, res) => {
  const { event, amount, type, memo } = req.body;

  await prisma.item.update({
    where: { id: Number(req.params.id) },
    data: {
      event,
      amount: Number(amount),
      type,
      memo
    }
  });

  res.redirect("/items");
});

// ▶ 詳細ページ
router.get("/detail", requireLogin, async (req, res) => {
  const id = Number(req.query.id);

  const item = await prisma.item.findUnique({
    where: { id }
  });

  if (!item) return res.redirect("/items");

  res.render("items/detail", { item });
});

// 削除機能
router.get("/delete/:id", requireLogin, async (req, res) => {
  const id = Number(req.params.id);

  await prisma.item.delete({
    where: { id }
  });

  res.redirect("/items");
});


module.exports = router;
