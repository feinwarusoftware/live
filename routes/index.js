const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const cp = require("child_process");
const utils = require("../utils");

const router = express.Router();

/**
 * MAIN.
 */

router.get("/", (req, res) => {
    return res.render("index.hbs", { streamers: utils.streamers });
});

router.get("/test", (req, res) => {
    return res.render("test.hbs");
});

router.get("/:streamer", (req, res) => {
    for (let i = 0; i < utils.streamers.length; i++) {
        if (utils.streamers[i].channel == req.params.streamer) {
            return res.render("streamer.hbs", {
                channel: utils.streamers[i].channel
            });
        }
    }
    return res.status(404).send("Not found");
});

router.get("/:streamer/dashboard", (req, res) => {
    for (let i = 0; i < utils.streamers.length; i++) {
        if (utils.streamers[i].channel == req.params.streamer) {
            files = [];
            fs.readdirSync("./media").forEach(file => {
                files.push(file);
            })
            return res.render("dashboard.hbs", {
                channel: utils.streamers[i].channel,
                files: files
            });
        }
    }
    return res.status(404).send("Not found");
});

/*
router.get("/auth/discord", (req, res) => {
    
});

router.get("/auth/discord/callback", (req, res) => {
    
});

router.get("/auth/streamer", (req, res) => {

});
*/

let stream;

router.post("/play", (req, res) => {
    if (!req.query.channel || !req.query.file) {
        return res.status(404).send("Not found");
    }

    for (let i = 0; i < utils.streamers.length; i++) {
        if (utils.streamers[i].channel == req.query.channel) {

            if (stream) {
                stream.kill("SIGKILL");
            }

            stream = cp.spawn("ffmpeg", ["-re", "-i", "C:\\Users\\lukas\\Documents\\live\\media\\"+req.query.file, "-b:v", "1M", "-vcodec", "libx264", "-vprofile", "baseline", "-g", "30", "-acodec", "aac", "-strict", "-2", "-f", "flv", "rtmp://localhost/live/"+utils.streamers[i].key], { stdio: "ignore" });
            stream.on("error", (err) => {
                console.log(err);
            });
            stream.on("exit", (code) => {
                console.log("stream exited with code: "+code);
            });

            //ffmpeg -re -i example-vid.mp4 -b:v 1M -vcodec libx264 -vprofile baseline -g 30 -acodec aac -strict -2 -f flv rtmp://79.97.226.172/live/C71A162E1C22BC85F277278FC3FA5

            /*
            if (stream) {
                stream.kill();
            }

            stream = ffmpeg("C:\\Users\\lukas\\Documents\\live\\media\\" + req.query.file)
                .native()
                .videoCodec("libx264")
                .audioCodec("aac")
                .outputFormat("flv")
                .on("end", () => {
                    console.log("file has been converted succesfully");
                })
                .on("error", err => {
                    console.log("an error happened: " + err.message);
                })
                .save("rtmp://localhost/live/"+utils.streamers[i].key);
            */

            return res.status(200).send("Success");
        }
    }

    return res.status(404).send("Not found");
});

router.post("/on_publish_done", (req, res) => {

	console.log(req.body);
	console.log(req.headers);

    return res.status(200).send("Success");
});

/**
 * END.
 */

//index

//:streamer
//:streamer/dashboard

//auth/discord
//auth/discord/callback

//auth/streamer

//on_publish
//on_publish_done

/*
const keys = {
	rawrxd: "dragon1320"
};

router.get("/live", (req, res) => {
    res.render("live.hbs");
});

router.post('/on_publish', function (req, res) {

	let streamer = keys[req.body.name]; 
	if (streamer) {
		res.redirect(streamer);
		return;
	}

	res.status(404).send("Not found");
});
*/

/**
 * PASSPORT TEMP.
 */

router.get("/auth", (req, res) => {

    /// add state
    res.redirect("https://discordapp.com/oauth2/authorize?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Fauth%2Fcallback&scope=identify&client_id=372462428690055169");
});

const expressJwt = require("express-jwt");
const authenticate = expressJwt({
    secret: "server secret"
});

router.get("/auth/callback", (req, res) => {

    if (!req.query.code) {

        //rip
        res.redirect("/error");
        return;
    }

    axios({
        method: "post",
        url: "https://discordapp.com/api/oauth2/token?client_id=372462428690055169&client_secret=suPM0FelWSAtZZSh5lpwqw__sCp86upn&grant_type=authorization_code&code=" + req.query.code + "&redirect_uri=http%3A%2F%2Flocalhost%3A80%2Fauth%2Fcallback"
    }).then(response => {
        //console.log(response.data);

        axios({
            method: "get",
            url: "https://discordapp.com/api/v6/users/@me",
            headers: {
                "Authorization": "Bearer " + response.data.access_token
            }
        }).then(response => {
            if (typeof req.session.user === "undefined") {
                req.session.user = response.data;
                res.redirect("/session");
            }
        }).catch(error => {
            console.log(error);
        });

    }).catch(error => {
        console.log(error);
    });
});

router.get("/secret", (req, res) => {
    console.log(req.session.user);
    if (!req.session.user) {
        res.redirect("/");
        return;
    }
    res.json(req.session.user);
});

router.get("/cookie", (req, res, next) => {
    if (typeof req.session.views === "undefined") {
        req.session.views = 0;
        return res.end("Welcome to the file session demo. Refresh page!");
    }
});

/*
const expressJwt = require("express-jwt");
const authenticate = expressJwt({
    secret: "server secret"
});

router.get("/me", authenticate, function (req, res) {
    res.status(200).json(req.user);
});

router.post("/auth", passport.authenticate(
    "local", {
        session: false
    }), serialize, generateToken, respond);

function serialize(req, res, next) {
    db.updateOrCreate(req.user, function (err, user) {
        if (err) {
            return next(err);
        }
        // we store the updated information in req.user again
        req.user = {
            id: user.id
        };
        next();
    });
}

const db = {
    updateOrCreate: function (user, cb) {
        // db dummy, we just cb the user
        cb(null, user);
    }
};

function generateToken(req, res, next) {
    req.token = jwt.sign({
        id: req.user.id,
    }, "server secret", {
        expiresIn: 20
    });
    next();
}

function respond(req, res) {
    res.status(200).json({
        user: req.user,
        token: req.token
    });
}
*/

/**
 * END.
 */

module.exports = router;