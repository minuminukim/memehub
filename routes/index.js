const express = require("express");
const router = express.Router();

const { User, Meme } = require("../db/models");
const { logoutUser } = require("../auth");

const asyncHandler = (handler) => (req, res, next) => {
  return handler(req, res, next).catch(next);
};

/* GET home page -- default sorted by likes. */
router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    console.log("Hello from index router");
    // fetch memes by most comments
    // const trendingMemes = Meme.findAll();

    // fetch memes by likes
    // const bestMemes = Meme.findAll();

    res.render("index", { title: "Memehub" });
  })
);

// GET home page sorted by recent
router.get("/recent", (req, res, next) => {
  res.render("index", { title: "Memehub" });
});

// GET home page sorted by most comments
router.get("/hot", (req, res, next) => {
  res.render("index", { title: "Memehub" });
});

// GET following feed
router.get("/you", (req, res, next) => {
  res.render("index", { title: "Memehub" });
});

module.exports = router;
