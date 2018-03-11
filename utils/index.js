"use strict";

const fs = require("fs");

function loadConfig(filepath) {
    return JSON.parse(fs.readFileSync(filepath));
}

let streamers = loadConfig("streamers.json");
for (let i = 0; i < streamers.length; i++) {
    streamers[i].live = false;
}

module.exports = {
    loadConfig,
    streamers
}
