var express = require('express');
var parser = require('body-parser');
var Sequelize = require('sequelize');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var models = require('./models');
var calenderToken = "";



var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(__dirname + '/public'));

app.use(express.json());
app.use(parser.urlencoded({extended: true}));

var Users = models.users;
var Courses = models.courses;
var CoursesTaken = models.coursesTaken;

Users.sync();
Courses.sync();
CoursesTaken.sync();
Users.belongsToMany(Courses, {through: 'coursesTaken'});
Courses.belongsToMany(Users, {through: 'coursesTaken'});

passport.use(new Strategy(function(username, password, cb)
{
	console.log("Users: ");
	console.log(models.users);
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

app.get('/', require('connect-ensure-login').ensureLoggedIn(), function(req, res)
{
	var userId = 0;
	if (req.session.passport) userId = req.session.passport.user;
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

app.get('/course/:courseId', require('connect-ensure-login').ensureLoggedIn(), function(req, res)
{
	var userId = 0;
	if (req.session.passport) userId = req.session.passport.user;
	var id = req.params.courseId;
	Users.find(
	{
		where:
		{
			id: userId
		}
	}).then(function(user)
	{
		Courses.find(
			{
				where:
				{
					id: id
				}
			}
		).then(function(course)
		{
			res.render('course', {user, course});
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
	}).then(course =>
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

	Users.find(
	{
		where:
		{
			id: info.userId
		}
	}).then(function(user)
	{
		user.getCourses().then(function(courses)
		{
			var alreadyEnrolled = false;
			for (var i = 0; i < courses.length && !alreadyEnrolled; i++)
			{
				if (courses[i].id == info.courseId) alreadyEnrolled = true;
			}
			if (alreadyEnrolled) res.send(`Already enrolled in this course.`);
			else
			{
				CoursesTaken.create(
				{
					userId: info.userId,
					courseId: info.courseId
				}).then(function(user)
				{
					res.send(`Successfully enrolled.`);
				});
			}
		});
	});
});

app.delete('/unenroll', function(req, res)
{
	console.log(req.body);
	Users.find(
		{
			where:
			{
				id: req.body.userId
			}
		}
	).then(function(user)
	{
		user.getCourses(
			{
				where:
				{
					id: req.body.courseId
				}
			}
		).then(function(courses)
		{
			if (courses[0] == undefined) res.send("Not enrolled in this course.")
			else
			{
				CoursesTaken.destroy(
					{
						where:
						{
							userId: req.body.userId,
							courseId: req.body.courseId
						}
					}
				).then(function()
				{
					res.send("Unenrolled from course.");
				});
			}
		});
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

app.listen(process.env.PORT || 1337, function()
{
	console.log("Listening");
});

function loggedInUser(session)
{
  if (session.passport == undefined) return undefined;
  if (session.passport.user == undefined) return undefined;
  return session.passport;
}
