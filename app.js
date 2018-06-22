var express = require('express');
var parser = require('body-parser');
var Sequelize = require('sequelize');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;

var sequelize = new Sequelize('personal','dave','password',
{
	host: 'localhost',
	dialect: 'postgres',
	operatorsAliases: false,
	logging: false
});

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(__dirname + '/public'));

app.use(express.json());
app.use(parser.urlencoded({extended: true}));

sequelize.authenticate()
.then(() =>
{
 	console.log('Connection has been established successfully.');
})
.catch(err =>
{
	console.error('Unable to connect to the database:', err);
});

var Users = sequelize.define('users',
{
	username: Sequelize.STRING,
	firstName: Sequelize.STRING,
	lastName: Sequelize.STRING,
	email: Sequelize.STRING,
	password: Sequelize.STRING
});

var Courses = sequelize.define('courses',
{
	code: Sequelize.STRING,
	name: Sequelize.STRING,
	description: Sequelize.STRING,
	time: Sequelize.STRING
});

var CoursesTaken = sequelize.define('coursesTaken',
{
	userId:
	{
		type: Sequelize.INTEGER,
		references: {model: 'users', key: 'id'}
	},
	courseId:
	{
		type: Sequelize.INTEGER,
		references: {model: 'courses', key: 'id'}
	}
});

Courses.sync();
Users.sync();
CoursesTaken.sync();
Users.belongsToMany(Courses, {through: 'coursesTaken'});
Courses.belongsToMany(Users, {through: 'coursesTaken'});

passport.use(new Strategy(function(username, password, cb)
{
	Users.find(
	{
		where: {username: username}
	}).then(function(user, err)
    {
		if (err) { return cb(err); }
		if (!user) { return cb(null, false); }
		if (user.password != password) { return cb(null, false); }
		return cb(null, user);
    });
}));

passport.serializeUser(function(user, cb)
{
	cb(null, user.id);
});

passport.deserializeUser(function(id, cb)
{
  Users.find(
  	{
  		where: {id: id}
  	}).then(function (user, err)
	{
		if (err) { return cb(err); }
		cb(null, user);
	});
});

app.use(require('cookie-parser')());
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function(req, res)
{
	var userId = 0;
	if (req.session.passport) userId = req.session.passport.user;
	console.log(userId);
	Users.find(
	{
		where:
		{
			id: userId
		}
	}).then(function(user)
	{
		Courses.findAll().then(function(rows)
		{
			res.render('home', {user, courses: rows});
		});
	});
});

app.get('/account', require('connect-ensure-login').ensureLoggedIn(), function(req, res)
{
	var id = req.session.passport.user || 0;
	var courses = [];
	var user = null;

	Users.find(
		{
			where:
			{
				id: id
			}
		}).then(function(user)
		{
			user.getCourses().then(function(courses)
			{
				res.render('account', {user, courses});
			});
		});
});

app.post('/submitcourse', function(req, res)
{
	var info = req.body;

	Courses.create(
		{
			code: info.code,
			name: info.name,
			description: info.description,
			time: info.time
		}
	).then(course =>
	{
		console.log(`Course ${course.code} created`);
		res.send(course);
	})
});

app.post('/submituser', function(req, res)
{
	var info = req.body;

	Users.create(
		{
			username: info.firstName + info.lastName,
			firstName: info.firstName,
			lastName: info.lastName,
			email: info.email,
			password: info.password
		}
	).then(user =>
	{
		console.log(`User ${user.username} created`);
		res.send(user);
	})
});

app.post('/enroll', function(req, res)
{
	var info = req.body;

	CoursesTaken.create(
	{
		userId: info.userId,
		courseId: info.courseId
	}).then(function(user)
	{
		console.log(`Added course ${info.courseId} to user ${info.userId}`);
		res.send(user);
	});
});

app.get('/login',function(req, res)
{
	res.render('login', {user: null});
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }), function(req, res)
{
	res.redirect('/');
});

app.get('/logout', function(req, res)
{
	req.logout();
	res.redirect('/');
});

app.get('*', function(req, res)
{
	res.status(404);
	res.send("Page not found.")
});

app.listen(1337, function()
{
	console.log("Listening");
});

function loggedInUser(session)
{
  if (session.passport == undefined) return undefined;
  if (session.passport.user == undefined) return undefined;
  return session.passport;
}
