const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/Models/userModel"); 
const Article = require("../src/Models/articleModel");

describe("Article Test", () => {
  let mongoServer;
  let validUser;

  beforeAll(async () => {
    // start mongo server and connect to mongoose
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // disconnect and stop mongo server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // create a valid user
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

  afterEach(async () => {
    // clean up collections
    await User.deleteMany({});
    await Article.deleteMany({});
  });

  test("TC-01: should create an article with user and description", async () => {
    // arrange
    const article = new Article({
      user: validUser._id,
      description: "Charlize's first article!",
      imgurl: "http://example.com/article-image.jpg",
      likes: [],
      comment: [],
    });

    // act
    const savedArticle = await article.save();

    // assert
    expect(savedArticle.user.toString()).toBe(validUser._id.toString());
    expect(savedArticle.description).toBe("Charlize's first article!");
    expect(savedArticle.imgurl).toBe("http://example.com/article-image.jpg");
    expect(savedArticle.likes).toEqual([]);
    expect(savedArticle.comment).toEqual([]);
    expect(savedArticle.createdAt).toBeDefined();
    expect(savedArticle.updatedAt).toBeDefined();
  });

  test("TC-02: should allow likes to reference users", async () => {
    // arrange
    const article = new Article({
      user: validUser._id,
      description: "Article with likes",
      likes: [validUser._id],
    });

    // act
    const savedArticle = await article.save();

    // assert
    expect(savedArticle.likes.length).toBe(1);
    expect(savedArticle.likes[0].toString()).toBe(validUser._id.toString());
  });

  test("TC-03: should allow comments to reference comment model ids", async () => {
    // arrange
    const fakeCommentId = new mongoose.Types.ObjectId();
    const fakeCommentId2 = new mongoose.Types.ObjectId();
    const article = new Article({
      user: validUser._id,
      description: "Article with comment",
      comment: [fakeCommentId,fakeCommentId2 ],
    });

    // act
    const savedArticle = await article.save();

    // assert
    expect(savedArticle.comment.length).toBe(2);
    expect(savedArticle.comment[0].toString()).toBe(fakeCommentId.toString());
  });
});
