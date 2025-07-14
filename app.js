const path = require('path');
const express = require('express');
const app = express();
const port = 4444;
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const hbs = require('hbs');
const isLoggedIn = require('./middleware/auth');



mongoose.connect('mongodb+srv://pratima:mongodb123@cluster0.gddilur.mongodb.net/triplinkDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.error("Connection error:", err));

// <------------------------------User Schema----------------------------------->
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  age: Number,
  gender: String,
  email: { type: String, unique: true },  //email should not be repeated
  password: String
});

const User = mongoose.model('User', userSchema);  // Create a model named user in database

app.set('view engine', 'hbs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'esgxhytiukihn',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://pratima:mongodb123@cluster0.gddilur.mongodb.net/triplinkDB'
  })
}));

// Register hbs helpers
hbs.registerHelper('subtract', (a, b) => a - b);  // for seats
hbs.registerHelper('eq', (a, b) => a === b);      //user==admin
hbs.registerHelper('includes', (arr, val) => arr.some(item => item.email === val));   //user already the member of group
hbs.registerHelper('lt', (a, b) => a < b);        //seats are available

// Middleware to expose session user
app.use((req, res, next) => {
  if (req.session.email) {
    req.session.user = {
      email: req.session.email,
      name: req.session.firstName,
      gender: req.session.gender,
      age: req.session.age
    };
  }
  next();
});

// Routes
// app.use('/', require('./routes/createGroup'));
app.use('/', require('./routes/group'));

app.get('/', (req, res) => res.redirect('/beforelogin'));
app.get('/signup', (req, res) => res.render('signup'));
app.get('/login', (req, res) => res.render('login'));
app.get('/beforelogin', (req, res) => res.render('beforelogin', { email: req.session.email }));
app.get('/createGroup', isLoggedIn, (req, res) => {
  res.render('createGroup');
});

app.post('/signup', async (req, res) => {
  const { firstName, lastName, age, gender, email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) return res.send('Passwords do not match');

  const existing = await User.findOne({ email });
  if (existing) return res.send('User already exists');

  await new User({ firstName, lastName, age, gender, email, password }).save();
  Object.assign(req.session, { email, firstName, lastName, gender, age, password });
  res.redirect('/beforelogin');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.password !== password) return res.send('Invalid credentials');

  Object.assign(req.session, {
    email: user.email,
    firstName: user.firstName,
    gender: user.gender,
    age: user.age
  });
  res.redirect('/beforelogin');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.listen(port, () => console.log(`http://localhost:${port}`));
