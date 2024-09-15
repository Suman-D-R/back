const jwt = require('jsonwebtoken');

exports.userAuth = async (req, res, next) => {
  try {
    let bearerToken = req.header('Authorization');
    if (!bearerToken)
      throw {
        code: 400,
        message: 'Authorization token is required',
      };
    bearerToken = bearerToken.split(' ')[1];

    const userData = await jwt.verify(bearerToken, process.env.JWT_SECRET);
    req.data = userData;
    next();
  } catch (error) {
    next(error);
  }
};

exports.adminAuth = async (req, res, next) => {
  try {
    let bearerToken = req.header('Authorization');
    if (!bearerToken)
      throw {
        code: 400,
        message: 'Authorization token is required',
      };
    bearerToken = bearerToken.split(' ')[1];
    const userData = await jwt.verify(bearerToken, process.env.JWT_SECRET);
    if (userData.userType !== 'admin') {
      throw {
        code: 403,
        message: 'Unauthorized',
      };
    }
    next();
  } catch (error) {
    next(error);
  }
};
