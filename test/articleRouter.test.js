const express = require('express');
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/Models/userModel");
const articleRouter = require("../src/routes/articleRoute");
const articleController = require("../src/controllers/articleController");
const authController = require("../src/controllers/authController");

// Mock the authController to simulate a successful JWT verification
jest.mock("../src/controllers/authController", () => ({
  verify: (req, res, next) => {
    req.user = { username: "charlizeaponte" }; // mock a valid user
    next();
  }
}));

describe('Article Router Tests', () => {
  let mongoServer;
  let validUser;
  let app;
  let articleServiceMock;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    app = express();
    app.use(express.json());
    app.use('/articles', articleRouter);

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

  beforeEach(() => {
    // arrange
    req = {}; 
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test('TC-01: check if POST /articles creates a new article', async () => {
    const newArticle = {
      title: "Test Article",
      content: "This is a test article",
      author: "charlizeaponte"
    };

    // arrange
    articleServiceMock = jest.spyOn(articleController, 'createArticle').mockImplementation((req, res) => {
      res.status(201).json({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author
      });
    });

    // arrange
    req = { body: newArticle, user: validUser };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // act
    await articleController.createArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      title: newArticle.title,
      content: newArticle.content,
      author: newArticle.author
    });

   
    articleServiceMock.mockRestore();
  });
});
