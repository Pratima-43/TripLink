const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  destination: { type: String, required: true },
  budget: { type: Number, required: true },
  maxMembers: { type: Number, required: true },
  modeOfTransport: { type: String, required: true },

  admin: {
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    gender: String,
    age: Number
  },

  members: [{
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    email: String,
    gender: String,
    age: Number
  }],

  requests: [{
    email: String,
    name: String,
    gender: String,
    age: Number
  }]
});

module.exports = mongoose.model('Group', groupSchema, 'creategroup');
