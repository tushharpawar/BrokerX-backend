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
    !["google", "facebook"].includes(provider)
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
      user = new User({
        email: verifiedEmail,
        name,
        userImage,
        fullName,
        balance: 0,
      });
      await user.save();
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
  const { provider, id_token } = req.body;

  if (!provider || !id_token || !["google", "facebook"].includes(provider)) {
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

    const user = await User.findOne({ email: verifiedEmail })

    if (!user) {
      throw new NotFoundError("User does not exist");
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

module.exports = {
  signInWithOauth,
  signUpWithOauth,
  refreshToken,
};
