'use strict';

const Joi = require('joi');

function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message).join('; ');
      return res.status(400).json({ message: messages });
    }
    next();
  };
}

const schemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  verifyOTP: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  resendOTP: Joi.object({
    email: Joi.string().email().required(),
  }),

  createRoom: Joi.object({
    type: Joi.string().valid('practice', 'interview', 'collaboration').default('practice'),
    problemId: Joi.string().optional(),
    settings: Joi.object().optional(),
  }),

  reportProblem: Joi.object({
    type: Joi.string().valid('bug', 'incorrect', 'unclear', 'other').required(),
    description: Joi.string().min(10).max(1000).required(),
  }),

  submitRating: Joi.object({
    sessionId: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
    toUserId: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
    score: Joi.number().min(1).max(5).required(),
    feedback: Joi.string().max(500).optional().allow(''),
  }),
};

module.exports = { validate, schemas };
