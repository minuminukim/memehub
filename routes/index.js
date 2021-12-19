const express = require("express");
const router = express.Router();

const { User, Meme, Comment, Like, Follow } = require("../db/models");
const { requireAuth } = require("../auth");
const { asyncHandler, isntLoggedIn } = require("../utils");
const { memesByComments, memesByLikes } = require("./utils/meme-sorts");
const { checkFollow, getFollow } = require("./utils/follows-helpers");
const fetchDevelopers = require("./utils/fetch-developers");

/* GET home page -- default sorted by likes. */
router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    const currentUserId = isntLoggedIn(req)
      ? null
      : parseInt(req.session.auth.userId, 10);

    const memes = await Meme.findAll({
      include: [Comment, Like, User],
    });

    // fetch memes by most comments
    const trendingMemes = memes
      .filter((meme) => meme.Comments.length)
      .sort((a, b) => memesByComments(a, b))
      .slice(0, 6);

    // fetch memes by likes
    const feedMemes = memes.sort((a, b) => memesByLikes(a, b)).slice(0, 20);

    /* Recommended Followers:
       Hardcoding here because this section won't be dynamic for demo
     */

    // query for developer user objects & their followers
    const devsAndFollowers = await User.findAll({
      where: {
        username: ["davidlee", "willduffy", "anthonyadams", "minukim"],
      },
      include: [{ model: User, as: "followers" }],
    });

    /* Map to an array with relevant data + include an isFollowing check
       for the current user
    */
    const developers = devsAndFollowers.map((dev) => {
      const {
        id,
        username,
        firstName,
        lastName,
        biography,
        profilePicture,
        followers,
      } = dev.dataValues;

      let isFollowing = false;
      let followId = 0;

      for (const follower of followers) {
        if (follower.id == currentUserId) {
          console.log("test");
          isFollowing = true;
          followId = follower.Follow.id;
          break;
        }
      }

      const fullName = `${firstName} ${lastName}`;
      return {
        id,
        username,
        fullName,
        biography,
        profilePicture,
        isFollowing,
        followId,
      };
    });

    // console.log(JSON.stringify(developers, null, 2));

    // If user logged in, render landing-page, else render index
    return res.render(currentUserId === null ? "landing-page" : "index", {
      title: "Memehub",
      trendingMemes,
      feedMemes,
      currentUserId,
      developers,
      i: 1,
    });
  })
);

// GET home page sorted by recent
router.get(
  "/recent",
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const currentUserId = isntLoggedIn(req)
      ? null
      : parseInt(req.session.auth.userId, 10);
    const developers = await fetchDevelopers(currentUserId);

    const feedMemes = await Meme.findAll({
      order: [["id", "DESC"]],
      include: User,
    });

    res.render("index", {
      title: "Memehub",
      feedMemes,
      currentUserId,
      developers,
    });
  })
);

// GET home page sorted by most likes
router.get(
  "/hot",
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const currentUserId = isntLoggedIn(req)
      ? null
      : parseInt(req.session.auth.userId, 10);
    const developers = await fetchDevelopers(currentUserId);

    const memes = await Meme.findAll({
      include: [Like, User],
    });
    const feedMemes = memes.sort((a, b) => memesByLikes(a, b));
    res.render("index", {
      title: "Memehub",
      feedMemes,
      currentUserId,
      developers,
    });
  })
);

// GET home page sorted by most comments
router.get(
  "/trending",
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const currentUserId = isntLoggedIn(req)
      ? null
      : parseInt(req.session.auth.userId, 10);
    const developers = await fetchDevelopers(currentUserId);

    const memes = await Meme.findAll({
      include: [Comment, User],
    });

    const feedMemes = memes.sort((a, b) => memesByComments(a, b));

    res.render("index", {
      title: "Memehub",
      feedMemes,
      currentUserId,
      developers,
    });
  })
);

// GET following feed
router.get(
  "/you",
  requireAuth,
  asyncHandler(async (req, res, next) => {
    const currentUserId = isntLoggedIn(req)
      ? null
      : parseInt(req.session.auth.userId, 10);
    const developers = await fetchDevelopers(currentUserId);

    // get logged in user & the users they're following
    const currentUser = await User.findByPk(currentUserId, {
      include: [{ model: User, as: "followings" }],
    });

    // returns an array of promises of following memes
    const memePromises = currentUser.followings.map(
      asyncHandler(async ({ id }) => {
        const memes = await Meme.findAll({
          where: { userId: id },
          include: User,
          order: [["id", "DESC"]],
        });

        return memes;
      })
    );

    // resolve promises and flatten
    const resolvedMemes = await Promise.all(memePromises);
    const feedMemes = resolvedMemes.flat();

    // TODO: re-factor
    res.render("index", { title: "Memehub", feedMemes, developers });
  })
);

module.exports = router;
