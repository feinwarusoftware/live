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

router.get("/", (req, res) => {
    if (!req.session.user) {
        return res.status(200).render("index.hbs", { streamers: utils.streamers, user: { id: undefined } });
    }
    return res.status(200).render("index.hbs", { streamers: utils.streamers, user: req.session.user });
});

router.get("/:streamer", (req, res) => {

    if (!req.session.token) {
        req.session.redirect = req.params.streamer; 
        res.redirect("/auth/discord");
    }

    axios({
        method: "get",
        url: "https://discordapp.com/api/v6/users/@me",
        headers: {
            "Authorization": "Bearer "+req.session.token.access_token
        }
    }).then(res2 => {
        req.session.user = res2.data;
        for (let i = 0; i < utils.streamers.length; i++) {
            if (utils.streamers[i].channel == req.params.streamer) {
                return res.render("streamer.hbs", {
                    streamer: utils.streamers[i],
                    user: req.session.user
                });
            }
        } 
    }).catch(err => {
        return res.status(500).send("Error logging in.");
    });
});

router.get("/:streamer/dashboard", (req, res) => {

    if (!req.session.user) {
        res.redirect("/auth/discord");
    }

    for (let i = 0; i < utils.streamers.length; i++) {
        if (utils.streamers[i].channel == req.params.streamer) {

            if (req.session.user.id != utils.streamers[i].discord) {
                return res.status(401).send("Unauthorised.");
            }

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

            return res.status(200).send("Success");
        }
    }

    return res.status(404).send("Not found");
});

let nonces = [];

router.get("/auth/discord", (req, res) => {

    const state = crypto.randomBytes(20).toString("hex");
    nonces.push({ ip: req.ip, state: state });

    return res.redirect("https://discordapp.com/oauth2/authorize?response_type=code&redirect_uri=http%3A%2F%2F79.97.226.172%2Fauth%2Fdiscord%2Fcallback&scope=identify&client_id=372462428690055169&state="+state);
});

router.get("/auth/discord/callback", (req, res) => {

    let index = 0;
    let nonce = undefined;
    for (let i = 0; i < nonces.length; i++) {
        if (nonces[i].ip == req.ip) {
            nonce = nonces[i];
            index = i;
            break;
        }
    }

    if (!nonce) {
        return res.status(500).send("Error logging in.");
    }

    nonces.splice(index, 1);

    if (nonce.state != req.query.state || !req.query.code) {
        return res.status(500).send("Error logging in.");
    }

    axios({
        method: "post",
        url: "https://discordapp.com/api/oauth2/token?client_id=372462428690055169&client_secret=suPM0FelWSAtZZSh5lpwqw__sCp86upn&grant_type=authorization_code&code="+req.query.code+"&redirect_uri=http%3A%2F%2F79.97.226.172%2Fauth%2Fdiscord%2Fcallback",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(res2 => {
        req.session.token = res2.data;
        if (!req.session.redirect) {
            return res.status(500).send("Error logging in.");
        }
        return res.redirect("/"+req.session.redirect);
    }).catch(err => {
        return res.status(500).send("Error logging in.");
    });
});

/*
router.get("/auth/discord/me", (req, res) => {
    
    if (!req.session.token.access_token) {
        return res.status(500).send("Error logging in.");
    }

    axios({
        method: "get",
        url: "https://discordapp.com/api/v6/users/@me",
        headers: {
            "Authorization": "Bearer "+req.session.token.access_token
        }
    }).then(res2 => {
        req.session.user = res2.data;
        return res.redirect("/");
    }).catch(err => {
        return res.status(500).send("Error logging in.");
    });
});
*/

module.exports = router;