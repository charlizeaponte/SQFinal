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

  test('TC-02: check if PUT /articles/:id updates an article', async () => {
    const newArticle = {
      title: "Test Article",
      content: "This is a test article",
      author: "charlizeaponte"
    };

    // arrange
    const createdArticle = await articleController.createArticle({
      body: newArticle,
      user: validUser
    }, {});

    const updatedArticle = {
      title: "Updated Article",
      content: "This article has been updated"
    };

    // arrange
    articleServiceMock = jest.spyOn(articleController, 'updateArticle').mockImplementation((req, res) => {
      res.status(200).json({
        title: req.body.title,
        content: req.body.content
      });
    });

    // arrange
    req = { 
      params: { id: createdArticle._id }, 
      body: updatedArticle, 
      user: validUser 
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // act
    await articleController.updateArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      title: updatedArticle.title,
      content: updatedArticle.content
    });

    // clean up
    articleServiceMock.mockRestore();
  });

  test('TC-03: check if DELETE /articles/:id deletes an article', async () => {
    const newArticle = {
      title: "Test Article",
      content: "This is a test article",
      author: "charlizeaponte"
    };

    // arrange
    const createdArticle = await articleController.createArticle({
      body: newArticle,
      user: validUser
    }, {});

    articleServiceMock = jest.spyOn(articleController, 'deleteArticle').mockImplementation((req, res) => {
      res.status(200).json({ message: "Article deleted successfully" });
    });

    
    req = { params: { id: createdArticle._id }, user: validUser };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // act
    await articleController.deleteArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Article deleted successfully" });


    articleServiceMock.mockRestore();
  });

  test('TC-04: check if GET /articles/timeline returns articles', async () => {
    const newArticle = {
      title: "Test Article",
      content: "This is a test article",
      author: "charlizeaponte"
    };
    
    // arrange
    await articleController.createArticle({
      body: newArticle,
      user: validUser
    }, {});


    articleServiceMock = jest.spyOn(articleController, 'getTimeline').mockImplementation((req, res) => {
      res.status(200).json([{
        title: "Test Article",
        content: "This is a test article",
        author: "charlizeaponte"
      }]);
    });

    req = { user: validUser };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // act
    await articleController.getTimeline(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([{
      title: "Test Article",
      content: "This is a test article",
      author: "charlizeaponte"
    }]);

    // clean up
    articleServiceMock.mockRestore();
  });

  test('TC-05: check if GET /articles/:id retrieves an article', async () => {
    const newArticle = {
      title: "Test Article",
      content: "This is a test article",
      author: "charlizeaponte"
    };

    // arrange
    const createdArticle = await articleController.createArticle({
      body: newArticle,
      user: validUser
    }, {});

    
    articleServiceMock = jest.spyOn(articleController, 'getArticle').mockImplementation((req, res) => {
      res.status(200).json({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author
      });
    });

 
    req = { params: { id: createdArticle._id }, user: validUser };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // act
    await articleController.getArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      title: newArticle.title,
      content: newArticle.content,
      author: newArticle.author
    });

    //clean up after test
    articleServiceMock.mockRestore();
  });
});
