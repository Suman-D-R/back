const Joi = require('@hapi/joi');

const newUserValidator = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(4).required(),
    password: Joi.string().min(8).required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    next(error);
  } else {
    req.validatedBody = value;
    next();
  }
};

module.exports = { newUserValidator };
