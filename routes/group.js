const express = require('express');
const router = express.Router();
const Group = require('../model/createGroup');
const isLoggedIn = require('../middleware/auth');

// Utility function
const calculateSeatsLeft = (group) => {
  const memberCount = group.members ? group.members.length : 0;
  return group.maxMembers - memberCount;
};

const mapGroupData = (group) => ({
  ...group.toObject(),
  seatsLeft: calculateSeatsLeft(group),
});

// Available Groups
router.get('/availablegroup', isLoggedIn, async (req, res) => {
  const email = req.session.user?.email;
  const groups = await Group.find();
  const mappedGroups = groups.map(mapGroupData);
  res.render('availablegroup', { groups: mappedGroups, currentUserEmail: email });
});

// Joined Groups
router.get('/joinedgroup', isLoggedIn, async (req, res) => {
  const email = req.session.user?.email;
  const groups = await Group.find({ 'members.email': email });
  const mappedGroups = groups.map(mapGroupData);
  res.render('joinedgroup', { groups: mappedGroups });
});

// Created Groups
router.get('/createdgroup', isLoggedIn, async (req, res) => {
  const email = req.session.user?.email;
  const groups = await Group.find({ 'admin.email': email });
  const mappedGroups = groups.map(mapGroupData);
  res.render('createdgroup', { groups: mappedGroups, currentUserEmail: email });
});

// Create Group (POST)
router.post('/creategroup', isLoggedIn, async (req, res) => {
  try {
    const { groupName, destination, budget, maxMembers, modeOfTransport } = req.body;

    const user = req.session.user;

    const newGroup = new Group({
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
  } catch (err) {
    console.error('Error saving group:', err);
    res.status(500).send('Server error while creating group');
  }
});

// Join Group Request
router.post('/join/:id', isLoggedIn, async (req, res) => {
  const group = await Group.findById(req.params.id);
  const email = req.session.user?.email;

  const alreadyRequested = group.requests.some(r => r.email === email);
  const alreadyMember = group.members.some(m => m.email === email);
  const isAdmin = group.admin.email === email;

  if (!alreadyRequested && !alreadyMember && !isAdmin) {
    group.requests.push({
      email,
      name: req.session.user.name,
      gender: req.session.user.gender,
      age: req.session.user.age
    });
    await group.save();
  }

  res.redirect('/availablegroup');
});

// Accept Request
router.get('/accept/:groupId/:email', isLoggedIn, async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  const requesterEmail = req.params.email;

  const request = group.requests.find(r => r.email === requesterEmail);
  if (request && group.members.length < group.maxMembers) {
    group.members.push(request);
  }

  group.requests = group.requests.filter(r => r.email !== requesterEmail);
  await group.save();
  res.redirect('/createdgroup');
});

// Decline Request
router.get('/decline/:groupId/:email', isLoggedIn, async (req, res) => {
  const group = await Group.findById(req.params.groupId);
  group.requests = group.requests.filter(r => r.email !== req.params.email);
  await group.save();
  res.redirect('/createdgroup');
});

// Delete Group
router.post('/group/delete/:id', isLoggedIn, async (req, res) => {
  await Group.findByIdAndDelete(req.params.id);
  res.redirect('/createdgroup');
});

module.exports = router;
