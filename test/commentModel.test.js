const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/Models/userModel");
const Comment = require("../src/Models/commentModel");

describe("Comment Test", () => {
  let mongoServer;
  let validUser;

  beforeAll(async () => {
    // start Mongo DB server
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // stop mongodb server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // create a unique user for each test
    validUser = new User({
      username: `charlizeaponte_${Date.now()}`,
      email: `caponte_${Date.now()}@qu.edu`,
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
    // clean up between tests
    await User.deleteMany({});
    await Comment.deleteMany({});
  });

  test("TC-01: should create a comment with valid user and description", async () => {
    // arrange
    const comment = new Comment({
      user: validUser._id,
      description: "This is a sample comment",
    });

    // act
    const savedComment = await comment.save();

    // assert
    expect(savedComment.user.toString()).toBe(validUser._id.toString());
    expect(savedComment.description).toBe("This is a sample comment");
  });

  test("TC-02: should not allow a description longer than 500 characters", async () => {
    // arrange
    const longText = "a".repeat(501);
    const comment = new Comment({
      user: validUser._id,
      description: longText,
    });

    // act & assert
    let err;
    try {
      await comment.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeDefined();
    expect(err.errors.description).toBeDefined();
  });
});
