const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");
const bodyParser = require("body-parser");
const sassMiddleware = require("node-sass-middleware");
const debug = require("debug")("live:server");
const http = require("http");
const passport = require("passport");
const Strategy = require("passport-oauth2").Strategy;
const jwt = require("jsonwebtoken");
const session = require("express-session");
const FileStore = require("session-file-store")(session);

const port = process.env.PORT || "80";
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server);
const routes = require("./routes");

/**
 * PASSPORT TEMP.
 */

const db = [];

passport.serializeUser(function (user, done) {
	done(null, user);
});

passport.deserializeUser(function (user, done) {
	done(null, user);
});

passport.use(new Strategy({
	authorizationURL: "https://discordapp.com/api/oauth2/authorize",
	tokenURL: "https://discordapp.com/api/oauth2/token",
	clientID: "372462428690055169",
	clientSecret: "suPM0FelWSAtZZSh5lpwqw__sCp86upn",
	callbackURL: "http://localhost:80/auth/discord/callback",
	//revocationURL: "https://discordapp.com/api/oauth2/token/revoke",
	scope: ["identify"]
}, (accessToken, refreshToken, profile, cb) => {
	cb(null, {
		profile: profile,
		accessToken: accessToken,
		refreshToken: refreshToken
	});
}));

/*
passport.use(new Strategy((username, password, done) => {
	if (username == "yaboi" && password == "1234") {
		done(null, {
			id: 666,
			firstname: "ya",
			lastname: "boi",
			email: "ya@boi.net",
			verified: true
		});
	} else {
		done(null, false);
	}
}));
*/

/**
 * END.
 */

http.createServer(app).listen(port);

app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "hbs");

app.use(session({
	name: "server-session-cookie-id",
	secret: "keyboard cat",
	saveUninitialized: false,
	resave: false,
	cookie: {},
	store: new FileStore()
}));
app.use(favicon(path.join(__dirname, "static", "favicon.ico")));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(sassMiddleware({
	src: path.join(__dirname, "static"),
	dest: path.join(__dirname, "static"),
	indentedSyntax: true, // true: sass, false: scss.
	sourceMap: true
}));
app.use(express.static(path.join(__dirname, "static")));
app.use(passport.initialize());

/**
 * PASSPORT TEMP.
 */

app.get("/auth/discord", passport.authenticate("oauth2"));

app.get("/auth/discord/callback",
	passport.authenticate("oauth2", {
		failureRedirect: "/error"
	}),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect("/");
	});

app.get("/session", (req, res) => {
	console.log(req.session);
	res.redirect("/");
});

/**
 * END.
 */

app.use(routes);

app.use((req, res, next) => {
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

app.use((err, req, res, next) => {
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	res.status(err.status || 500);
	res.render("error");
});

/*
const io = require("socket.io")(server);

io.on("connection", function (socket) {

	console.log("welcome ya boii");

	socket.on("disconnect", function () {
		console.log("ya boii left us, -f");
	});

	socket.on("chat message", function (msg) {

		io.emit("chat message", msg);
	});
});
*/

server.listen(port, "127.0.0.1");
server.on("error", (err) => {
	if (err.syscall !== "listen") {
		throw err;
	}

	let bind = typeof port === "string" ?
		"Pipe " + port :
		"Port " + port;

	switch (err.code) {
		case "EACCES":
			console.error(bind + " requires elevated privileges");
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(bind + " is already in use");
			process.exit(1);
			break;
		default:
			throw err;
	}
});
server.on("listening", () => {
	let addr = server.address();
	let bind = typeof addr === "string" ?
		"pipe " + addr :
		"port " + addr.port;
	debug("Listening on " + bind);
});