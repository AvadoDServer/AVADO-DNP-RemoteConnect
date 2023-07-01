const fs = require('fs');
const path = require("path");
const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware");
const Controller = require('./zerotier-controller');
const Service = require('zerotier-service');
const JSONdb = require('simple-json-db');
const authTokenFilePath = process.argv[2];
const dataDir = process.argv[3];

if (!authTokenFilePath || !dataDir) {
    console.log("please provide");
    console.log("-file location of Zt secret");
    console.log("-a folder to persist data to reload after restart");
    console.log(process.argv);
    process.exit();
}

const databaseFile = path.join(dataDir, 'database.json');
console.log("databaseFile", databaseFile)
const db = new JSONdb(databaseFile);


// Get ZT auth token to create & manage networks
const authToken = fs.readFileSync(authTokenFilePath, 'utf8');

// ZT controller manages creating networks & managing members
const controller = new Controller({ authToken });

// ZT service manages network connections
const service = new Service({ authToken });

const config = {
    dataDir: dataDir,
    db: db,
    ztController: controller,
    ztService: service,
};

console.log("Monitor starting...");

const server = restify.createServer({
    name: "MONITOR",
    version: "1.0.0"
});

const cors = corsMiddleware({
    preflightMaxAge: 5, //Optional
    origins: [
        /^http:\/\/localhost(:[\d]+)?$/,
        "http://*.ava.do:80",
        "http://*.ava.do",
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);
server.use(restify.plugins.bodyParser());

require("./routes-db")(server, config);
require("./routes-zt")(server, config);

// receive ping of client
server.get("/ping", async (req, res) => {
    if (!req.connection.remoteAddress) {
        return res.send(400);
    }
    const pingTime = Date.now();
    console.log(`received ping from ${req.connection.remoteAddress} (${pingTime})`);

    db.set(`ping-${req.connection.remoteAddress}`, pingTime);
    return res.send(200);
});

async function startServer() {
    const { createNetwork } = require("./util/zt")(config);

    if (!db.has('networkid')) {
        console.log("Initialize ZT network");
        const {networkid} = await createNetwork();
        db.set('networkid', networkid);
        console.log(`created network ${networkid}`);
    } else {
        console.log(`Existing AVADO ZT network found - id is ${db.get('networkid')}`);
    }

    server.listen(81, function () {
        console.log("%s listening at %s", server.name, server.url);
    });
}

startServer();
