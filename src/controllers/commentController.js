const Comment = require("../Models/commentModel");
const Article = require("../Models/articleModel");
const mongoose = require("mongoose");

const addComment = async (req, res) => {
  try {
    const { articleId, ...comment } = req.body;
    comment.user = req.user._id;
    const commenttosave = new Comment(comment);
    const savedcomment = await commenttosave.save();
    /**
     * Fixed Issue: Change this code to not construct database queries directly from user-controlled data (https://sonarcloud.io/project/issues?open=AZaZzF5rxttRV5zrRk8v&id=charlizeaponte_SQFinal)
     */
    await Article.findOneAndUpdate(
      { _id: mongoose.Types.ObjectId(articleId) },  
      { $push: { comments: savedcomment._id } },   
      { runValidators: true }                      
    );
    res.status(200).send({
      status: "success",
      message: "Comment has been created",
    });
  } catch (e) {
    res.status(500).send({
      status: "failure",
      message: e.message,
    });
  }
};
const getbyPostId = async (req, res) => {
  const ArticleId = req.params.ArticleId;
  try {
    const article = await Article.findOne({ _id: ArticleId }).populate(
      "comment"
    );
    res.status(200).send({
      status: "success",
      comments: article.comment,
    });
    /* Change e.message to error.message . 
    Fixes issue: Handle this exception or don't catch it at all.. (https://sonarcloud.io/project/issues?open=AZaZzF5rxttRV5zrRk8u&id=charlizeaponte_SQFinal)
     */
  } catch (error) {
    res.status(500).send({
      status: "failure",
      message: error.message,
    });
  }
};

module.exports = { addComment, getbyPostId };
