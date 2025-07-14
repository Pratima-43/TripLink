const express = require('express');
const router = express.Router();
const CreateGroup = require('../model/createGroup');
const isLoggedIn = require('../middleware/auth');

router.get('/createGroup', isLoggedIn, (req, res) => {
  res.render('createGroup');
});

router.post('/creategroup', isLoggedIn, async (req, res) => {
  const { groupName, destination, budget, maxMembers, modeOfTransport } = req.body;

  const user = req.session.user;
  const newGroup = new CreateGroup({
    groupName,
    destination,
    budget,
    maxMembers,
    modeOfTransport,
    admin: {
      userId: req.session.userId,
      name: user.name,
      email: user.email,
      gender: user.gender,
      age: user.age
    },
    members: [{
      userId: req.session.userId,
      name: user.name,
      email: user.email,
      gender: user.gender,
      age: user.age
    }],
    requests: []
  });

  await newGroup.save();
  res.redirect('/availablegroup');
});

module.exports = router;
