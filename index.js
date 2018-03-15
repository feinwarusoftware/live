const express = require("express");
const path = require("path");
const favicon = require("serve-favicon");
const logger = require("morgan");
const bodyParser = require("body-parser");
const sassMiddleware = require("node-sass-middleware");
const debug = require("debug")("live:server");
const app = express();
const http = require("http");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const uuid = require("uuid");
const port = process.env.PORT || "80";
const server = http.createServer(app);
const routes = require("./routes");
const WebSocketServer = require("websocket").server;
const utils = require("./utils");
const hbs = require("hbs");

// hbs
hbs.registerHelper("json", function(context) {
	return JSON.stringify(context);
});
//

app.set("views", path.join(__dirname, "templates"));
app.set("view engine", "hbs");

app.use(session({
	name: "server-session-cookie-id",
	secret: "keyboard cat",
	saveUninitialized: false,
	resave: false,
	cookie: {
		maxAge: 604800000
	},
	store: new FileStore()
}));
app.use(favicon(path.join(__dirname, "static", "favicon.ico")));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(sassMiddleware({
	root: path.join(__dirname, "static"),
	src: "/scss",
	dest: "/css",
	indentedSyntax: false, // true: sass, false: scss.
	sourceMap: true
}));
app.use(express.static(path.join(__dirname, "static")));

////

app.get("/session", (req, res) => {
	console.log(req.session);
	res.redirect("/");
	res.status(200);
});

////

let wsServer = new WebSocketServer({
	httpServer: server
});

let history = [];
let clients = [];
let chat = [];

function htmlEntities(str) {
	return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

let colors = ["red", "green", "blue", "magenta", "purple", "plum", "orange"];
colors.sort((a, b) => {
	return Math.random() > 0.5;
});

app.post("/on_publish", (req, res) => {
    for (let i = 0; i < utils.streamers.length; i++) {
        if (utils.streamers[i].key == req.body.name) {

			utils.streamers[i].live = true;

			for (let i = 0; i < clients.length; i++) {
				clients[i].sendUTF(JSON.stringify({
					type: "live_update",
					data: {
						channel: utils.streamers[i].channel,
						status: true
					}
				}));
			}

            return res.redirect(utils.streamers[i].channel);
        }
    }

    return res.status(404).send("Not found");
});

app.post("/on_publish_done", (req, res) => {
    for (let i = 0; i < utils.streamers.length; i++) {
        if (utils.streamers[i].key == req.body.name) {

			utils.streamers[i].live = false;

			for (let i = 0; i < clients.length; i++) {
				clients[i].sendUTF(JSON.stringify({
					type: "live_update",
					data: {
						channel: utils.streamers[i].channel,
						status: false
					}
				}));
			}

			return res.status(200).send("Success");
        }
    }

    return res.status(404).send("Not Found");
});

app.use(routes);

server.listen(port);

wsServer.on("request", req => {
	console.log("Connection from origin "+req.origin);

	let conn = req.accept(null, req.origin);

	let index = chat.push(conn) - 1;

	console.log("Connection accepted");

	if (history.length > 0) {
		JSON.stringify({
			type: "history",
			data: history
		});
	}

	conn.on("message", msg => {
		if (msg.type === "utf8") {

			if (msg === undefined) {
				return;
			}
			const json = JSON.parse(msg.utf8Data);

			if (json.type === "message") {
				console.log("Received message from "+req.origin);

				let obj = {
					type: "message",
					data: {
						user: json.data.user,
						text: htmlEntities(json.data.text)
					}
				}

				history.push(obj);
				history = history.slice(-100);

				for (let i = 0; i < chat.length; i++) {
					chat[i].sendUTF(JSON.stringify(obj));
				}
			}
		}
	});

	conn.on("close", conn => {
		console.log("Peer "+conn.remoteAddress+" disconnected");
		chat.splice(index, 1);
	});
});

/*
// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
	console.log((new Date())+' Connection from origin '+request.origin+'.');

	// accept connection - you should check 'request.origin' to
	// make sure that client is connecting from your website
	// (http://en.wikipedia.org/wiki/Same_origin_policy)
	var connection = request.accept(null, request.origin);
	// we need to know client index to remove them on 'close' event
	var index = clients.push(connection) - 1;

	console.log((new Date()) + ' Connection accepted.');

	/*
	// send back chat history
	if (history.length > 0) {
		connection.sendUTF(
			JSON.stringify({
				type: 'history',
				data: history
			}));
	}

	// user sent some message
	connection.on('message', function (message) {
		if (message.type === 'utf8') { // accept only text
			// first message sent by user is their name

			if (userName === false) {
				// remember user name
				userName = htmlEntities(message.utf8Data);
				// get random color and send it back to the user
				userColor = colors.shift();
				connection.sendUTF(
					JSON.stringify({
						type: 'color',
						data: userColor
					}));
				console.log((new Date()) + ' User is known as: ' + userName +
					' with ' + userColor + ' color.');

			} else { // log and broadcast the message
				console.log((new Date()) + ' Received Message from ' +
					userName + ': ' + message.utf8Data);

				// we want to keep history of all sent messages
				var obj = {
					time: (new Date()).getTime(),
					text: htmlEntities(message.utf8Data),
					author: userName,
					color: userColor
				};
				history.push(obj);
				history = history.slice(-100);

				// broadcast message to all connected clients
				var json = JSON.stringify({
					type: 'message',
					data: obj
				});
				for (var i = 0; i < clients.length; i++) {
					clients[i].sendUTF(json);
				}
			}
		}
	});
	//*

	// user disconnected
	connection.on("close", (conn) => {
		console.log((new Date())+" Peer "+conn.remoteAddress+" disconnected.");
		clients.splice(index, 1);
	});
});
*/

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