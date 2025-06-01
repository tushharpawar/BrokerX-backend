const User = require("../../models/User")
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  UnauthenticatedError,
  NotFoundError,
} = require("../../errors");
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

// Get user profile
const getProfile = async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  const userId = decodedToken.userId;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  try {
    res.status(StatusCodes.OK).json({
      user: {
        fullName: user.name,
        id: user.id,
        userImage: user.userImage,
        email: user.email,
        balance: user.balance,
      },
    });
  } catch (error) {
    throw new BadRequestError(error);
  }
};


// Update user profile
const updateProfile = async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];

  const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  const userId = decodedToken.userId;

  const user = await User.findById(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const { fullName, userImage } = req.body;

  if ( !fullName && !userImage) {
    throw new BadRequestError("No Update Fields provided");
  }

  try {
    if(fullName) {
      user.name = fullName;
    }
    if (userImage) user.userImage = userImage;

    await user.save();

    res.status(StatusCodes.OK).json({ msg: "Profile updated successfully" });
  } catch (error) {
    throw new BadRequestError(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
