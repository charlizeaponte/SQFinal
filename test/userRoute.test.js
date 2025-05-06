const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const userRouter = require("../src/routes/userRoute");
const userController = require("../src/controllers/userController");
const authController = require("../src/controllers/authController");

// Mock controllers
jest.mock('../src/controllers/userController');
jest.mock('../src/controllers/authController');

describe('userRouter Tests', () => {
  let mongoServer;
  let app;
  let validUser;
  let req;
  let res;

  beforeAll(async () => {
    // Start in-memory MongoDB server and connect mongoose
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Set up the express app
    app = express();
    app.use(express.json());
    app.use('/users', userRouter);

    // Create a mock user object
    validUser = {
      username: "charlizeaponte",
      email: "caponte@qu.edu",
      password: "Pa55w0rd!",
      description: "Hi my name is Charlize. Would love to connect",
      profilePicture: "http://example.com/pic.jpg",
      followers: ["Sese", "Gabby"],
      followings: ["Sese", "Gabby"],
      role: "user",
      gender: "female"
    };
  });

  beforeEach(() => {
    // Mock request and response objects before each test
    req = {}; // Populate this with any necessary request data
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn()
    };
  });

  afterAll(async () => {
    // Disconnect mongoose and stop in-memory MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    // Clean up collections after each test
    await mongoose.connection.dropDatabase();
  });

  test('TC-01: check if POST /users/signup calls the signup controller', async () => {
    // Arrange
    const signupMock = jest.spyOn(authController, 'signup').mockImplementation((req, res) => {
      res.status(201).json({ message: "User created successfully" });
    });

    // Act
    req = { body: validUser };
    await authController.signup(req, res);

    // Assert 
    expect(signupMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ message: "User created successfully" });

    signupMock.mockRestore(); // Clean up the mock
  });

  test('TC-02: check if POST /users/login calls the login controller', async () => {
    // Arrange
    const loginMock = jest.spyOn(authController, 'login').mockImplementation((req, res) => {
      res.status(200).json({ message: "User logged in successfully" });
    });

    // Act
    req = { body: { email: validUser.email, password: validUser.password } };
    await authController.login(req, res);

    // Assert
    expect(loginMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "User logged in successfully" });

    loginMock.mockRestore(); 
  });

  test('TC-03: check if GET /users/:id calls getUser controller', async () => {
    // Arrange
    const getUserMock = jest.spyOn(userController, 'getUser').mockImplementation((req, res) => {
      res.status(200).json(validUser);
    });

    // act
    req = { params: { id: "some-user-id" } };
    await userController.getUser(req, res);

    // Assert 
    expect(getUserMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(validUser);

    getUserMock.mockRestore(); // Clean up the mock
  });

  test('TC-04: check if PUT /users/:id calls updateUser controller', async () => {
    //arrange
    const updateUserMock = jest.spyOn(userController, 'updateUser').mockImplementation((req, res) => {
      res.status(200).json({ message: "User updated successfully" });
    });

   //act
    req = { params: { id: "some-user-id" }, body: validUser };
    await userController.updateUser(req, res);

    // Assert 
    expect(updateUserMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "User updated successfully" });

    updateUserMock.mockRestore(); 
  });
});

