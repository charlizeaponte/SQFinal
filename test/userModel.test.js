const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const User = require("../src/Models/userModel"); 

describe("User Model Test", () => {
  let mongoServer;

  beforeAll(async () => {
    //start mongo server and connect mongoose
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // disconnect and stop mongo server after testing is over
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  test("tc-01: should create a user with valid data", async () => {
    // arrange
    const validUser = new User({
      username: "charlizeaponte",
      email: "caponte@qu.edu",
      password: "Pa55w0rd!",
      description: "Hi my name is Charlize. Would love to connect",
      profilePicture: "http://example.com/pic.jpg",
      followers: ["Sese","Gabby"],
      followings: ["Sese","Gabby"],
      role: "user",
      gender: "female",
      jwtToken: "some.jwt.token",
    });

    // act
    const savedUser = await validUser.save();

    // assert
    expect(savedUser.username).toBe("charlizeaponte");
    expect(savedUser.email).toBe("caponte@qu.edu");
    expect(savedUser.password).toBe("Pa55w0rd!");
    expect(savedUser.description).toBe("Hi my name is Charlize. Would love to connect");
    expect(savedUser.profilePicture).toBe("http://example.com/pic.jpg");
    expect(savedUser.followers).toContain("Sese","Gabby");
    expect(savedUser.followings).toContain("Sese","Gabby");
    expect(savedUser.role).toBe("user");
    expect(savedUser.gender).toBe("female");
    expect(savedUser.jwtToken).toBe("some.jwt.token");
  });

  test("tc-02: should fail to create a user without required fields", async () => {
    // arrange
    const invalidUser = new User({
      // missing username, email, password
      role: "user",
    });

    // act & assert
    let err;
    try {
      await invalidUser.save();
    } catch (error) {
      err = error;
    }

    expect(err).toBeInstanceOf(mongoose.Error.ValidationError);
    expect(err.errors.username).toBeDefined();
    expect(err.errors.email).toBeDefined();
    expect(err.errors.password).toBeDefined();
  });

  test("tc-03: should be able to create user with default values when the optional fields are missing", async () => {
    // arrange
    const user = new User({
        username: "charlizeaponte",
        email: "caponte@qu.edu",
        password: "Pa55w0rd!",
      role: "user",
    });

    // act
    const savedUser = await user.save();

    // assert
    expect(savedUser.description).toBe("");
    expect(savedUser.profilePicture).toBe("YOUR_DEFAULT_AVATAR_URL");
    expect(savedUser.followers).toEqual([]);
    expect(savedUser.followings).toEqual([]);
  });

  test("tc-04: should not allow a user to use duplicate usernames or emails", async () => {
    // arrange
    const user1 = new User({
        username: "charlizeaponte",
        email: "caponte@qu.edu",
        password: "Pa55w0rd!",
        role: "user",
    });

    const user2 = new User({
        username: "charlizeaponte",
        email: "caponte@qu.edu",
        password: "Pa55w0rd!",
        role: "user",
    });

    await user1.save();

    // act & assert
    let error;
    try {
      await user2.save();
    } catch (err) {
      error = err;
    }

    expect(error).toBeDefined();
    expect(error.code).toBe(11000); // mongodb duplicate key error
  });
});
