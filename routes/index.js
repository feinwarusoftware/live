const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

/**
 * MAIN.
 */

const streamers = [
    {
        key: "C71A162E1C22BC85F277278FC3FA5",
        discord: "168690518899949569",
        channel: "dragon1320",
        live: false
    },
    {
        key: "3F4121A43D9A8554DA883A775A746",
        discord: "190914446774763520",
        channel: "mattheous",
        live: false
    },
    {
        key: "ADE1B5717EB3ED78663F3126D1544",
        discord: "230875863644635139",
        channel: "fa99les",
        live: false
    },
    {
        key: "73E5D898BB8BB676668DB3ABB2EF2",
        discord: "161573813379792899",
        channel: "kamui",
        live: false
    },
    {
        key: "DD25CA47B14319B45A31EE28F5BB7",
        discord: "349886534989643779",
        channel: "paristonhill",
        live: false
    },
    {
        key: "AB4D17575FB12D42A58DAB4C73417",
        discord: "262345465306021888",
        channel: "towelroyale",
        live: false
    },
    {
        key: "8BB129F6EA1834C3A859992D798DD",
        discord: "331641326816854028",
        channel: "tweektweak",
        live: false
    }
];

router.get("/", (req, res) => {
    return res.render("index.hbs");
});

router.get("/:streamer", (req, res) => {
    for (let i = 0; i < streamers.length; i++) {
        if (streamers[i].channel == req.params.streamer) {
            return res.render("streamer.hbs", { channel: streamers[i].channel });
        }
    }
    return res.status(404).send("Not found");
});

router.get("/:streamer/dashboard", (req, res) => {
    return res.render("dashboard.hbs");
});

/*
router.get("/auth/discord", (req, res) => {
    
});

router.get("/auth/discord/callback", (req, res) => {
    
});

router.get("/auth/streamer", (req, res) => {

});
*/

router.post("/play", (req, res) => {
    //filepath
    //streamkey
});

router.post("/on_publish", (req, res) => {
    for (let i = 0; i < streamers.length; i++) {
        if (streamers[i].key == req.body.name) {
            streamers[i].live = true;
            return res.redirect(streamers[i].channel);
        }
    }

	return res.status(404).send("Not found");
});

router.post("/on_publish_done", (req, res) => {
    
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