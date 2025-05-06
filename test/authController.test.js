const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const { signup, login, logout, verify, refresh } = require("../src/controllers/authController");
const User = require("../src/Models/userModel");
const bcrypt = require("bcrypt");

jest.mock("../src/utils/generateToken", () => ({
  generateAccessToken: jest.fn(() => "access-token-mock"),
  generateRefreshToken: jest.fn(() => "refresh-token-mock"),
}));

jest.setTimeout(15000); //timeout added to handle delays

describe("authController Test", () => {
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

    const hashedPassword = await bcrypt.hash("Pa55w0rd!", 10);
    validUser = new User({
      username: "charlizeaponte",
      email: "caponte@qu.edu",
      password: hashedPassword,
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

  test("TC-01: should sign up a new user successfully", async () => {
    const req = {
      body: {
        username: "newuser",
        email: "newuser@qu.edu",
        password: "Test123!",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "user saved successfully",
        data: { user: "newuser" },
      })
    );
  });

  test("TC-02: should fail login if password is incorrect", async () => {
    const req = {
      body: {
        username: "charlizeaponte",
        password: "WrongPassword",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        message: "password is incorrect",
      })
    );
  });

  test("TC-03: should fail login if user does not exist", async () => {
    const req = {
      body: {
        username: "ghostuser",
        password: "DoesNotMatter",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        message: "user does not exist",
      })
    );
  });

  test("TC-04: should log in successfully with correct credentials", async () => {
    const req = {
      body: {
        username: "charlizeaponte",
        password: "Pa55w0rd!",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "logged in successfully",
        accessToken: "access-token-mock",
        refreshToken: "refresh-token-mock",
        data: expect.objectContaining({
          username: "charlizeaponte",
          email: "caponte@qu.edu",
        }),
      })
    );
  });

  test("TC-05: should fail login with missing credentials", async () => {
    const req = {
      body: {
        username: null,
        password: null,
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        message: "user does not exist",
      })
    );
  });

  test("TC-06: should log out user successfully with valid refresh token", async () => {
    const req = {
      body: {
        refreshToken: "some.jwt.token",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await logout(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "success",
        message: "You've been logged out",
      })
    );
  });

  test("TC-07: should fail logout if refresh token is missing", async () => {
    const req = {
      body: {},
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await logout(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failure",
        message: "logout error",
      })
    );
  });

  test("TC-08: should verify token successfully with valid JWT", async () => {
    const req = {
        headers: {
          authorization: 'Bearer valid-jwt-token'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      const next = jest.fn();
      
      await verify(req, res, next);
      expect(next).toHaveBeenCalled();
  });

  test("TC-09: should fail verify token with missing authorization header", async () => {
    const req = { headers: {} };  
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      
    const next = jest.fn();

  await verify(req, res, next);

  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.send).toHaveBeenCalledWith("You are not authorized");
  expect(next).not.toHaveBeenCalled();
  });

  test("TC-10: should refresh token successfully", async () => {
    const req = {
      body: {
        token: "valid-refresh-token",
      },
    };
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn()
      };
      
  
    await refresh(req, res);
  
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      accessToken: "access-token-mock",
      refreshToken: "refresh-token-mock",
    });
  });  

  test("TC-11: should fail refresh token with missing refresh token", async () => {
    const req = { body: {} };  
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  
    await refresh(req, res);
  
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      status: "failure",
      message: "You are not authenticated!",
    });
  });  
});
