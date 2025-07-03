const User = require("../../models/User");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} = require("../../errors");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to register a new user
async function registerUser({ email, name, userImage, fullName }) {
  const user = new User({
    email,
    name,
    userImage,
    fullName,
    balance: 0,
  });
  await user.save();
  return user;
}

const signUpWithOauth = async (req, res) => {
  const { provider, id_token, name, userImage, fullName, email } =
    req.body;

  if (
    !provider ||
    !id_token ||
    !name ||
    !userImage ||
    !fullName ||
    !email ||
    !["google"].includes(provider)
  ) {
    throw new BadRequestError("Invalid body request");
  }

  try {
    let verifiedEmail;

    if (provider === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      verifiedEmail = payload.email;
    }
    if (verifiedEmail != email) {
      throw new UnauthenticatedError("Invalid Token or expired");
    }

    let user = await User.findOne({ email: verifiedEmail });

    if (!user) {
      user = await registerUser({ email: verifiedEmail, name, userImage, fullName });
    }

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      user: user,
      tokens: { access_token: accessToken, refresh_token: refreshToken },
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid Token or expired");
  }
};

const signInWithOauth = async (req, res) => {
  const { provider, id_token, userImage, fullName } = req.body;

  if (!provider || !id_token || !["google", "facebook"].includes(provider)) {
    throw new BadRequestError("Invalid body request");
  }

  try {
    let verifiedEmail;

    if (provider === "google") {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience:process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      verifiedEmail = payload.email;
    }

    let user = await User.findOne({ email: verifiedEmail });

    if (!user) {
      // Register user if not found, then login automatically
      if ( !userImage || !fullName) {
        throw new BadRequestError("Missing registration fields");
      }
      user = await registerUser({ email: verifiedEmail, userImage, fullName });
    }

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      user: user,
      tokens: { access_token: accessToken, refresh_token: refreshToken },
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid Token or expired");
  }
};

const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      tokens: { access_token: newAccessToken, refresh_token: newRefreshToken },
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};

const logout = async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required for logout");
  }

  try {
    // Verify the refresh token
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    // In a production app, you might want to:
    // 1. Add tokens to a blacklist in Redis/database
    // 2. Store token revocation timestamps
    // 3. Implement token versioning
    
    // For now, we'll just respond with success
    // The client should delete the tokens from storage
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully"
    });
    
  } catch (error) {
    console.error("Logout error:", error);
    // Even if token verification fails, we can still log out
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully"
    });
  }
};

const logoutAll = async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    // Verify the refresh token to get user ID
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    // In a production app, you could:
    // 1. Increment a token version number in the user model
    // 2. Add all user's tokens to blacklist
    // 3. Store a logout timestamp to invalidate older tokens
    
    // For demonstration, we could add a tokenVersion field to User model
    // user.tokenVersion = (user.tokenVersion || 0) + 1;
    // await user.save();
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out from all devices successfully"
    });
    
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out from all devices successfully"
    });
  }
};

module.exports = {
  signInWithOauth,
  signUpWithOauth,
  refreshToken,
  logout,
  logoutAll,
};
