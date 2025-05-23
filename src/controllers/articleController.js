const Article = require("../Models/articleModel");
const User = require("../Models/userModel");
const Comment = require("../Models/commentModel");

const createArticle = async (req, res) => {
  req.body.user = req.user._id;
  const newArticle = new Article(req.body);
  try {
    await newArticle.save();
    res.status(200).send({
      status: "success",
      message: "article has been created",
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
/* Made the method safer and not injecting data into html
Fixed issue:Change this code to not construct database queries directly from user-controlled data. (https://sonarcloud.io/project/issues?open=AZaZzF3zxttRV5zrRk8t&id=charlizeaponte_SQFinal)
 */
const updateArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (req.user._id !== article.user.toString()) {
      return res.status(401).send({
        status: "failure",
        message: "you are not authorized",
      });
    }

    const allowedUpdates = {};
    const fields = ["description", "imgurl"]; 
    fields.forEach((field) => {
      if (req.body[field]) {
        allowedUpdates[field] = req.body[field];
      }
    });

    await Article.updateOne({ _id: req.params.id }, { $set: allowedUpdates });

    res.status(200).send({
      status: "success",
      message: "article has been updated",
    });

  } catch (error) {
    res.status(500).send({
      status: "failure",
      message: error.message,
    });
  }
};
const deleteArticle = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (req.user._id === article.user.toString() || req.user.role === "admin") {
      await Comment.deleteMany({ user: req.user._id });
      await Article.findByIdAndDelete(req.params.id);
      res.status(200).send({
        status: "success",
        message: "article has been deleted",
      });
    } else {
      res.status(401).send({
        status: "failure",
        message: "you are not authorized",
      });
    }
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const getTimeline = async (req, res) => {
  try {
    const userid = req.user._id;
    const page = parseInt(req.query.page) - 1 || 0;
    const limit = parseInt(req.query.limit) || 1;
    const user = await User.findById(userid).select("followings");
    const myArticles = await Article.find({ user: userid })
      .skip(page * limit)
      .limit(limit)
      .sort({ createdAt: "desc" })
      .populate("user", "username profilePicture");
    const followingsArticles = await Promise.all(
      user.followings.map((followingId) => {
        return Article.find({
          user: followingId,
          createdAt: {
            $gte: new Date(new Date().getTime() - 86400000).toISOString(),
          },
        })
          .skip(page * limit)
          .limit(limit)
          .sort({ createdAt: "desc" })
          .populate("user", "username profilePicture");
      })
    ); 
    /* added let to arr to make it explicit. 
    Fixes issue: Add the "let", "const" or "var" keyword to this declaration of "arr" to make it explicit. (https://sonarcloud.io/project/issues?open=AZaZzF3zxttRV5zrRk8r&id=charlizeaponte_SQFinal)
     */
     let arr = myArticles.concat(...followingsArticles);
    res.status(200).send({
      status: "success",
      Articles: arr,
      limit: arr.length,
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const getArticlesUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    const articles = await Article.find({ user: user._id });
    res.status(200).json(articles);
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const getArticle = async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id }).populate(
      "comment"
    );
    res.status(200).json(article);
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const likeUnlike = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article.likes.includes(req.user._id)) {
      await article.updateOne({ $push: { likes: req.user._id } });
      res.status(200).send({
        status: "success",
        message: "the article has been liked",
      });
    } else {
      await article.updateOne({ $pull: { likes: req.user._id } });
      res.status(200).send({
        status: "success",
        message: "the article has been disliked",
      });
    }
 /* Change e.message to error.message . 
    Fixes issue: Handle this exception or don't catch it at all.. (https://sonarcloud.io/project/issues?open=AZaZzF3zxttRV5zrRk8s&id=charlizeaponte_SQFinal)
     */
  } catch (error) {
    res.status(500).send({
      status: "failure",
      message: error.message,
    });
  }
};
module.exports = {
  createArticle,
  updateArticle,
  deleteArticle,
  getTimeline,
  getArticlesUser,
  getArticle,
  likeUnlike,
};
