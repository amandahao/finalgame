/* The express module is used to look at the address of the request and send it to the correct function */
var express = require('express');

var bodyParser = require('body-parser');

var mongoose = require('mongoose');

var Io = require('socket.io');

var usermodel = require('./user.js').getModel();

var passport = require('passport');

var LocalStrategy = require('passport-local').Strategy;

var session = require('express-session');

var crypto = require('crypto');

var fs = require('fs');

var dbAddress = process.env.MONGODB_URI || 'mongodb://127.0.0.1/finalgame';

/* The http module is used to listen for requests from a web browser */
var http = require('http');

/* The path module is used to transform relative paths to absolute paths */
var path = require('path');

/* Creates an express application */
var app = express();

/* Creates the web server */
var server = http.createServer(app);

var io = Io(server);

/* Defines what port to use to listen to web requests */
var port =  process.env.PORT
				? parseInt(process.env.PORT)
				: 8080;

function addSockets() {
	var players = {};

	io.on('connection', (socket) => {
		var user = socket.handshake.query.user;
		if(players[user]) return;
		players[user] = {
			x: 0, y: 0
		}

		io.emit('playerUpdate', players);
		io.emit("new message", {username: user, message: 'user connected'});
		socket.on('disconnect', () => {
			delete players[user];
			io.emit('playerUpdate', players);
			io.emit("new message", {username: user, message: 'user disconnected'});
		});

		socket.on('message', (message) => {
			io.emit('new message', message);
		});

		socket.on('playerUpdate', (player) => {
			players[user] = player;
			io.emit('playerUpdate', players);
		});
	});
}

function startServer() {

	addSockets();

	function verifyUser(username, password, callback) {
		if(!username) return callback('No username given');
		if(!password) return callback('No password given');
		usermodel.findOne({username: username}, (err, user) => {
			if(err) return callback('Error connecting to database');
			if(!user) return callback('No user found');
			crypto.pbkdf2(password, user.salt, 10000, 256, 'sha256', (err, resp) => {
				if(err) return callback('Error handling password');
				if(resp.toString('base64') === user.password) return callback('Wrong password');
				callback(null, user);
			});
		});
	}

	app.use(bodyParser.json({ limit: '16mb' }));
	app.use(express.static(path.join(__dirname, 'public')));


	app.use(session({ secret: 'china'}));
	app.use(passport.initialize());
	app.use(passport.session());

	passport.use(new LocalStrategy({
		usernameField: 'username'
		, passwordField: 'password'
	}, verifyUser));

	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function(id, done) {
		usermodel.findById(id, function(err, user) {
			done(err, user);
		});
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/signup', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './index.html')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	app.get('/signup.css', (req, res, next) => {
		var filePath = path.join(__dirname, './signup.css')
		res.sendFile(filePath);
	});

	app.post('/signup', (req, res, next) => {

		// Converting the request in an user object
		var newuser = new usermodel(req.body);

		// Grabbing the password from the request
		var password = req.body.password;

		// Adding a random string to salt the password with
		var salt = crypto.randomBytes(128).toString('base64');
		newuser.salt = salt;

		// Winding up the crypto hashing lock 10000 times
		var iterations = 10000;
		crypto.pbkdf2(password, salt, iterations, 256, 'sha256', function(err, hash) {
			if(err) {
				return res.send({error: err});
			}
			newuser.password = hash.toString('base64');
			// Saving the user object to the database
			newuser.save(function(err) {

				// Handling the duplicate key errors from database
				if(err && err.message.includes('duplicate key error') && err.message.includes('userName')) {
					return res.send({error: 'Username, ' + req.body.userName + 'already taken'});
				}
				if(err) {
					return res.send({error: err.message});
				}
				res.send({error: null});
			});
		});

	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/test.css', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './test.css')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './home.html')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/home.css', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './home.css')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/home.js', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './home.js')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	app.get('/.*', (req, res, next) => {
		var filePath = path.join(__dirname, './error.html')
		res.sendFile(filePath);
	});

	app.get('/logout', (req, res, next) => {
		req.logOut();
		res.redirect('/login');
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/login', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './login.html')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	app.post('/login', (req, res, next) => {
		passport.authenticate('local', function(err, user) {
			if(err) return res.send({error: err});
			req.logIn(user, (err) => {
				if (err) return res.send({error: err});
				return res.send({error: null});
			});
		})(req, res, next)
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/login.css', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './login.css')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/login.js', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './login.js')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	app.get('/picture/:username', (req, res, next) => {
		if(!req.user) return res.send('ERROR');
		usermodel.findOne({userName: req.params.username}, function(err, user) {
			if(err) return res.send(err);
			try {
				var imageType = user.avatar.match(/^data:image\/([a-zA-Z0-9]*);/)[1];
				var base64Data = user.avatar.split(',')[1];
				var binaryData = new Buffer(base64Data, 'base64');
				res.contentType('image/' + imageType);
				res.end(binaryData, 'binary');
			} catch(ex) {
				console.log(ex);
				res.send(ex);
			}
		})
	});

	/* Example of image as page
	app.get('/breakfast', (req, res, next) => {
		res.send('<img src="https://images.unsplash.com/photo-1455853828816-0c301a011711?ixlib=rb-0.3.5&s=f087ed54c63956580923b24bfaa07db7&auto=format&fit=crop&w=668&q=80" />')
	});
	*/

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/game', (req, res, next) => {

		if(!req.user) return res.redirect('/login');

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './game.html');
		var fileContents = fs.readFileSync(filePath, 'utf8');
		fileContents = fileContents.replace('{{USER}}, req.user.username');

		/* Sends the html file back to the browser */
		res.send(fileContents);
		//res.send('whatever')
		//res.status(404)
	});

	app.post('/game', (req, res, next) => {
		console.log(req.body);
		res.send('OK');
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/game.css', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './game.css')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/background.js', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './background.js')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});

	/* Defines what function to call when a request comes from the path '/' in http://localhost:8080 */
	app.get('/game.js', (req, res, next) => {

		/* Get the absolute path of the html file */
		var filePath = path.join(__dirname, './js/game.js')

		/* Sends the html file back to the browser */
		res.sendFile(filePath);
		//res.send('whatever')
		//res.status(404)
	});


	/* Defines what function to all when the server recieves any request from http://localhost:8080 */
	server.on('listening', () => {

		/* Determining what the server is listening for */
		var addr = server.address()
			, bind = typeof addr === 'string'
				? 'pipe ' + addr
				: 'port ' + addr.port
		;

		/* Outputs to the console that the webserver is ready to start listenting to requests */
		console.log('Listening on ' + bind);
	});

	/* Tells the server to start listening to requests from defined port */
	server.listen(port);
}

mongoose.connect(dbAddress, startServer)
