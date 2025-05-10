const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { updateUser, followUser, unfollowUser, searchUsers, getUser, deleteUser, getUserByUsername } = require('../src/controllers/userController');
const User = require("../src/Models/userModel");
const bcrypt = require("bcrypt");

const mockRes = {
  status: jest.fn().mockReturnThis(),
  send: jest.fn(),
};

describe("User Controller Test", () => {
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

  afterEach(async () => {
    await User.deleteMany({});
    mockRes.status.mockClear();
    mockRes.send.mockClear();
  });

  beforeEach(async () => {
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

  test("TC-01: check if the getUser function returns user info successfully", async () => {
    // Arrange
    const req = { params: { id: validUser._id.toString() } };
  
    // Act
    await getUser(req, mockRes);
  
    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      message: "user info",
      status: "success",
      user: {
        _id: expect.any(mongoose.Types.ObjectId),
        username: validUser.username,
        email: validUser.email,
        description: validUser.description,
        profilePicture: validUser.profilePicture,
        followers: validUser.followers.map(f => f.toString()), 
        followings: validUser.followings.map(f => f.toString()), 
        gender: validUser.gender,
      },
    });
  });  

  test("TC-02: check if the updateUser function fails to updates the user", async () => {
    // Arrange
    const req = {
      user: { _id: validUser._id },
      params: { id: validUser._id.toString() },
      body: { description: "Updated description" },
    };

    // Act
    await updateUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      "message": "you can't update this account.",
      "status": "failure",
    });
  });


  test("TC-03: check if the followUser function allows following another user", async () => {
    // Arrange
    const userToFollow = new User({
      username: "newUser",
      email: "newuser@qu.edu",
      password: "newUser123",
      followers: [],
      followings: [],
      role: "user",
      gender: "male",
    });
    await userToFollow.save();

    const req = { user: { _id: validUser._id }, params: { username: userToFollow.username } };

    // Act
    await followUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      status: "success",
      message: "user has been followed",
    });

    const updatedCurrentUser = await User.findById(validUser._id);
    expect(updatedCurrentUser.followings).toContainEqual(userToFollow._id);
    const updatedUserToFollow = await User.findById(userToFollow._id);
    expect(updatedUserToFollow.followers).toContainEqual(validUser._id);
  });

  test("TC-04: check if the unfollowUser function allows unfollowing a user", async () => {
    // Arrange
    const userToUnfollow = new User({
      username: "unfollowedUser",
      email: "unfolloweduser@qu.edu",
      password: "unfollowed123",
      followers: [validUser._id],
      followings: [validUser._id],
      role: "user",
      gender: "male",
    });
    await userToUnfollow.save();

    const req = { user: { _id: validUser._id }, params: { username: userToUnfollow.username } };

    // Act
    await unfollowUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      status: "success",
      message: "you don't follow this user",
    });

    const updatedCurrentUser = await User.findById(validUser._id);
    expect(updatedCurrentUser.followings).not.toContainEqual(userToUnfollow._id);
    const updatedUserToUnfollow = await User.findById(userToUnfollow._id);
    expect(updatedUserToUnfollow.followers).toContainEqual(validUser._id);
  });

  test("TC-05: check if the searchUsers function returns correct search results", async () => {
    // Arrange
    const req = { query: { search: "charlize", limit: 1 } };

    // Act
    await searchUsers(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      status: "success",
      totalUsers: 1,
      limit: 1,
      users: expect.arrayContaining([
        expect.objectContaining({
          username: validUser.username,
          profilePicture: validUser.profilePicture,
        }),
      ]),
    });
  });

  test("TC-06: check if getUser handles errors when user not found", async () => {
    // Arrange
    const req = { params: { id: "nonexistentUserId" } };

    // Act
    await getUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
    "message": "Cast to ObjectId failed for value \"nonexistentUserId\" (type string) at path \"_id\" for model \"User\"",
    "status": "failure",
    });
  });

  test("TC-07: updateUser returns error if the user ID in params does not match the authenticated user ID", async () => {
    // Arrange
    const req = {
      user: { _id: "differentUserId" },
      params: { id: validUser._id.toString() },
      body: { description: "Updated description", password: "newPassword123" },
    };

    // Act
    await updateUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      status: "failure",
      message: "you can't update this account.",
    });
  });

  test("TC-08: followUser alerts user when already following the user", async () => {
    // Arrange
    const userToFollow = new User({
      username: "alreadyFollowedUser",
      email: "alreadyfolloweduser@qu.edu",
      password: "password123",
      followers: [],
      followings: [validUser._id],
      role: "user",
      gender: "male",
    });
    await userToFollow.save();
    validUser.followings.push(userToFollow._id);
    await validUser.save();

    const req = { user: { _id: validUser._id }, params: { username: userToFollow.username } };

    // Act
    await followUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
        "message": "you allready follow this user",
        "status": "success",
    });
  });

  test("TC-09: unfollowUser returns alert when not following the user", async () => {
    // Arrange
    const userToUnfollow = new User({
      username: "notFollowedUser",
      email: "notfolloweduser@qu.edu",
      password: "password123",
      followers: [],
      followings: [],
      role: "user",
      gender: "male",
    });
    await userToUnfollow.save();

    const req = { user: { _id: validUser._id }, params: { username: userToUnfollow.username } };

    // Act
    await unfollowUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      "message": "you don't follow this user",
      "status": "success",
    });
  });

  test("TC-10: check if the getUserByUsername function returns user info correctly", async () => {
    // Arrange
    const req = { params: { username: validUser.username } };

    // Act
    await getUserByUsername(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.send).toHaveBeenCalledWith({
      status: "success",
      message: "user info",
      user: expect.objectContaining({
        username: validUser.username,
        email: validUser.email,
        description: validUser.description,
        profilePicture: validUser.profilePicture,
      }),
    });
  });

  test("TC-11: check if the followUser function doesn't follow a user if already following", async () => {
    // Arrange
    const userToFollow = new User({
      username: "anotherUser",
      email: "anotheruser@qu.edu",
      password: "anotherUser123",
      followers: [validUser._id],
      followings: [],
      role: "user",
      gender: "male",
    });
    await userToFollow.save();
    validUser.followings.push(userToFollow._id);
    await validUser.save();
    const req = { user: { _id: validUser._id }, params: { username: userToFollow.username } };

    // Act
    await followUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
      "message": "you allready follow this user",
      "status": "success",
    });
  });

  test("TC-12: check if the unfollowUser function doesn't unfollow a user if not following", async () => {
    // Arrange
    const userToUnfollow = new User({
      username: "unfollowUser",
      email: "unfollowuser@qu.edu",
      password: "unfollowUser123",
      followers: [],
      followings: [],
      role: "user",
      gender: "female",
    });
    await userToUnfollow.save();
    const req = { user: { _id: validUser._id }, params: { username: userToUnfollow.username } };

    // Act
    await unfollowUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.send).toHaveBeenCalledWith({
     "message": "you don't follow this user",
     "status": "success",
    });
  });

  test("TC-13: check if the updateUser function returns an error if the user is not found", async () => {
    // Arrange
    const req = {
      user: { _id: "nonExistentUserId" },
      params: { id: "nonExistentUserId" },
      body: { description: "Updated description", password: "newPassword123" },
    };

    // Act
    await updateUser(req, mockRes);

    // Assert
    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.send).toHaveBeenCalledWith({
      "message": "Cast to ObjectId failed for value \"nonExistentUserId\" (type string) at path \"_id\" for model \"User\"",
      "status": "failure",
    });
  });
});