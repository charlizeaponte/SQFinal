const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/Models/userModel");
const Article = require("../src/Models/articleModel");
const Comment = require("../src/Models/commentModel");
const {
  createArticle,
  updateArticle,
  deleteArticle,
  getTimeline,
  getArticlesUser,
  getArticle,
  likeUnlike,
} = require("../src/controllers/articleController");

describe("articleController Test", () => {
  let mongoServer;
  let validUser;

  beforeAll(async () => {
    // arrange
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // arrange
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // arrange
    validUser = new User({
      username: "charlizeaponte",
      email: "caponte@qu.edu",
      password: "Pa55w0rd!",
      description: "Hi my name is Charlize. Would love to connect",
      profilePicture: "http://example.com/pic.jpg",
      followers: [],
      followings: [],
      role: "user",
      gender: "female",
      jwtToken: "some.jwt.token",
    });
    await validUser.save();
  });

  afterEach(async () => {
    // arrange
    await User.deleteMany();
    await Article.deleteMany();
    await Comment.deleteMany();
  });

  const createMockRes = () => ({
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    json: jest.fn(),
  });

  test("TC-01: Create article", async () => {
    // arrange
    const req = {
      user: validUser,
      body: {
        title: "Test Article",
        description: "This is a test article.",
        imgurl: "http://example.com/image.jpg",
      },
    };
    const res = createMockRes();

    // act
    await createArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      status: "success",
      message: "article has been created",
    });
  });

  test("TC-02: Update article", async () => {
    // arrange
    const article = await Article.create({
      user: validUser._id,
      title: "Old Title",
      description: "Old description",
      imgurl: "http://old.com/img.jpg",
    });

    const req = {
      user: { _id: validUser._id.toString() },
      params: { id: article._id.toString() },
      body: {
        description: "Updated description",
        imgurl: "http://new.com/img.jpg",
      },
    };
    const res = createMockRes();

    // act
    await updateArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      status: "success",
      message: "article has been updated",
    });
  });

  test("TC-03: Delete article", async () => {
    // arrange
    const article = await Article.create({
      user: validUser._id,
      title: "Delete Me",
      description: "To be deleted",
    });

    const req = {
      user: { _id: validUser._id.toString(), role: validUser.role },
      params: { id: article._id.toString() },
    };
    const res = createMockRes();

    // act
    await deleteArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      status: "success",
      message: "article has been deleted",
    });
  });

  test("TC-04: Get timeline articles", async () => {
    // arrange
    await Article.create({
      user: validUser._id,
      title: "Timeline",
      description: "Timeline desc",
    });

    const req = {
      user: validUser,
      query: { page: "1", limit: "10" },
    };
    const res = createMockRes();

    // act
    await getTimeline(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      status: "success",
      Articles: expect.any(Array),
    }));
  });

  test("TC-05: Get articles by user", async () => {
    // arrange
    const article = await Article.create({
      user: validUser._id,
      title: "By User",
      description: "By user desc",
    });

    const req = { params: { username: validUser.username } };
    const res = createMockRes();

    // act
    await getArticlesUser(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        title: "By User",
        description: "By user desc",
      }),
    ]));
  });

  test("TC-06: Get article by ID", async () => {
    // arrange
    const article = await Article.create({
      user: validUser._id,
      title: "Find Me",
      description: "Find me desc",
    });

    const req = { params: { id: article._id.toString() } };
    const res = createMockRes();

    // act
    await getArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      title: "Find Me",
      description: "Find me desc",
    }));
  });

  test("TC-07: Like and Unlike article", async () => {
    // arrange
    const article = await Article.create({
      user: validUser._id,
      title: "Like Me",
      description: "Like me desc",
    });

    const req = { user: validUser, params: { id: article._id.toString() } };
    const res = createMockRes();

    // act
    await likeUnlike(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      status: "success",
      message: "the article has been liked",
    });

    await likeUnlike(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      status: "success",
      message: "the article has been disliked",
    });
  });

  test("TC-08: Update article - unauthorized user", async () => {
    // arrange
    const article = await Article.create({
      user: new mongoose.Types.ObjectId(), // someone else
      title: "Unauthorized Update",
      description: "You shouldn't touch this",
    });

    const req = {
      user: { _id: validUser._id.toString() }, // not the article owner
      params: { id: article._id.toString() },
      body: { description: "Hacked" },
    };
    const res = createMockRes();

    // act
    await updateArticle(req, res);

    // assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      status: "failure",
      message: "you are not authorized",
    });
  });

  test("TC-09: Update article - error handling", async () => {
    // arrange
    const article = await Article.create({
      user: validUser._id,
      title: "Error Case",
      description: "Error expected",
    });

    const req = {
      user: { _id: validUser._id.toString() },
      params: { id: article._id.toString() },
      body: { description: "Error" },
    };
    const res = createMockRes();

    // act
    jest.spyOn(Article, "updateOne").mockRejectedValueOnce(new Error("DB Failure"));

    // assert
    await updateArticle(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      status: "failure",
      message: "DB Failure",
    });
  });
});
