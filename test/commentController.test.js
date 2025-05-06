const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/Models/userModel");
const Comment = require("../src/Models/commentModel");
const Article = require("../src/Models/articleModel");
const { addComment, getbyPostId } = require("../src/controllers/commentController");

describe("commentController Test", () => {
  let mongoServer;
  let validUser;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Comment.deleteMany({});
    await Article.deleteMany({});

    validUser = new User({
      username: "charlizeaponte",
      email: "caponte@qu.edu",
      password: "Pa55w0rd!",
      description: "Hi my name is Charlize. Would love to connect",
      profilePicture: "http://example.com/pic.jpg",
      followers: ["Sese", "Gabby"],
      followings: ["Sese", "Gabby"],
      role: "user",
      gender: "female",
      jwtToken: "some.jwt.token",
    });

    await validUser.save();
  });

  test("TC-01: addComment - should successfully add comment to article", async () => {
    // Arrange
    const article = await Article.create({
      user: validUser._id,
      title: "Test Article",
      description: "This is a test article",
    });

    const req = {
      body: {
        articleId: article._id.toString(),
        text: "Nice article!",
      },
      user: { _id: validUser._id },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Act
    await addComment(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      status: "success",
      message: "Comment has been created",
    });

    const updatedArticle = await Article.findById(article._id).populate("comments");
    expect(updatedArticle.comments.length).toBe(1);
  });

  test("TC-02: getbyPostId - should return comments for article", async () => {
    // Arrange
    const comment = await Comment.create({
      user: validUser._id,
      text: "Great read!",
    });

    const article = await Article.create({
      user: validUser._id,
      title: "Another Article",
      description: "Another test article",
      comments: [comment._id],
    });

    const req = {
      params: { ArticleId: article._id.toString() },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    // Act
    await getbyPostId(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        comments: expect.anything(),
      })
    );
  });
});
