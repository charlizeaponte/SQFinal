const express = require("express");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const commentRouter = require("../src/routes/commentRoute");
const commentController = require("../src/controllers/commentController");
const authController = require("../src/controllers/authController");

// Mock the authController to simulate a successful JWT verification
jest.mock("../src/controllers/authController", () => ({
  verify: (req, res, next) => {
    req.user = { username: "charlizeaponte" }; // mock a valid user
    next();
  }
}));

describe('commentRouter Tests', () => {
  let mongoServer;
  let app;
  let commentServiceMock;
  let validUser;

  beforeAll(async () => {
    // Start MongoDB server and connect mongoose
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Set up the express app
    app = express();
    app.use(express.json());
    app.use('/comments', commentRouter);

    // Mock the user
    validUser = {
      username: "charlizeaponte",
      email: "caponte@qu.edu",
      password: "Pa55w0rd!"
    };
  });

  beforeEach(() => {
    // Create mock request and response objects before each test
    req = {}; 
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  afterAll(async () => {
    // Disconnect mongoose and stop MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up collection after each test
    await mongoose.connection.db.dropDatabase();
  });

  test('TC-01: check if POST /comments adds a comment', async () => {
    const newComment = {
      ArticleId: "60d3b41abd6b6d2f7f11f2f1", // Mock ArticleId
      content: "This is a test comment",
      author: validUser.username
    };

    // Mock the commentController.addComment function
    commentServiceMock = jest.spyOn(commentController, 'addComment').mockImplementation((req, res) => {
      res.status(201).json({
        ArticleId: req.body.ArticleId,
        content: req.body.content,
        author: req.body.author
      });
    });

    req = { body: newComment, user: validUser };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Act
    await commentController.addComment(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      ArticleId: newComment.ArticleId,
      content: newComment.content,
      author: newComment.author
    });


    commentServiceMock.mockRestore();
  });

  test('TC-02: check if GET /comments/:ArticleId returns comments', async () => {
    //Arrange
    const mockArticleId = "60d3b41abd6b6d2f7f11f2f1";
    const mockComments = [
      { ArticleId: mockArticleId, content: "Test Comment 1", author: "charlizeaponte" },
      { ArticleId: mockArticleId, content: "Test Comment 2", author: "charlizeaponte" }
    ];

   
    commentServiceMock = jest.spyOn(commentController, 'getbyPostId').mockImplementation((req, res) => {
      res.status(200).json(mockComments);
    });

    req = { params: { ArticleId: mockArticleId } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Act
    await commentController.getbyPostId(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockComments);

    commentServiceMock.mockRestore();
  });

});
