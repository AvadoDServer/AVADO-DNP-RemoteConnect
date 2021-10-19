// const chokidar = require('chokidar');
const fs = require('fs');
const path = require("path");
const restify = require("restify");
const corsMiddleware = require("restify-cors-middleware");
const Controller = require('./zerotier-controller');
const Service = require('zerotier-service');
const JSONdb = require('simple-json-db');
const authTokenFilePath = process.argv[2];
const dataDir = process.argv[3];
// const autobahn = require("autobahn");
// const logs = require("./logs.js")(module);
// const calls = require("./calls");

/**
 * 1. Setup crossbar connection
 * ============================
 *
 * Will register the VPN user managment node app to the the DAppNode's crossbar WAMP
 * It automatically registers all handlers exported in the calls/index.js file
 * Each handler is wrapped with a custom function to format its success and error messages
 */
//  const url = "ws://my.wamp.dnp.dappnode.eth:8080/ws";
//  const realm = "dappnode_admin";

//  console.log(`Connecting to WAMP`);
 

//  const connection = new autobahn.Connection({ url, realm });
 
//  connection.onopen = function(session, details) {
//    logs.info(`Connected to DAppNode's WAMP
//    url:     ${url}
//    realm:   ${realm}
//    session: ${(details || {}).authid}`);
 
//    for (const callId of Object.keys(calls)) {
//      registerHandler(session, callId + ".zerotier.dnp.dappnode.eth", calls[callId]);
//    }
 
//    /*
//     * Utilities to encode arguments to publish with the Crossbar format (args, kwargs)
//     * - Publisher:
//     *     publish("event.name", arg1, arg2)
//     * - Subscriber:
//     *     subscribe("event.name", function(arg1, arg2) {})
//     */
//    function publish(event, ...args) {
//      // session.publish(topic, args, kwargs, options)
//      session.publish(event, args);
//    }
 
//    /**
//     * Emits the devices list to the UI
//     * @param {array} devices = [{
//     *   id: "MyPhone",
//     *   isAdmin: false
//     * }, ... ]
//     */
//    eventBus.onSafe(
//      eventBusTag.emitDevices,
//      async () => {
//        const devices = (await calls.listDevices()).result;
//        publish("devices.vpn.dnp.dappnode.eth", devices);
//      },
//      { isAsync: true }
//    );
//  };
 

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
        "http://*.dappnode.eth:81",
    ]
});

server.pre(cors.preflight);
server.use(cors.actual);

server.use(restify.plugins.bodyParser());


// require("./routes-supervisord")(server, config);
// require("./routes-db")(server, config);
require("./routes-zt")(server, config);

// receive ping of client
server.get("/ping", async (req, res, next) => {
    if (!req.connection.remoteAddress) {
        res.send(400);
        return next();
    }
    const pingTime = Date.now();
    console.log(`received ping from ${req.connection.remoteAddress} (${pingTime})`);

    db.set(`ping-${req.connection.remoteAddress}`, pingTime);
    res.send(200);
    return next();
});

// server.get("/lastseen/:ip", async (req, res, next) => {
//     if (!req.params.ip) {
//         res.send(400);
//         return next();
//     }
//     const reply = db.get(`ping-${req.params.ip}`);
//     res.send(200, reply || "0");
//     return next();
// });

// const nodeinfo = require("./polkadot");

// server.get("/nodeinfo", async (req, res, next) => {
//     console.log("get node info");
//     nodeinfo("ws://my.polkadotcustom.avado.dnp.dappnode.eth:9944/").then((info) => {
//         res.send(200, info);
//         return next();
//     }).catch((e) => {
//         res.send(401,"error" +  e);
//         return next();
//     })
// });

// server.get("/hostnodeinfo", async (req, res, next) => {
//     axios.get(`http://10.191.0.1:82/nodeinfo`).then((r) => {
//         res.send(200, r.data);
//         return next();
//     }).catch((e) => {
//         res.send(402, e);
//         return next();
//     })
// });


// if (!db.has('network')) {
//     console.log("Initialize ZT network");

// }


async function startServer() {

    const { createNetwork } = require("./util/zt")(config);

    if (!db.has('networkid')) {
        console.log("Initialize ZT network");
        const {networkid} = await createNetwork();
        db.set('networkid', networkid);
        console.log(`created network ${networkid}`);
    } else {
        console.log(`AVADO network id is ${db.get('networkid')}`);
    }

    server.listen(81, function () {
        console.log("%s listening at %s", server.name, server.url);
    });


}

startServer();

// const remoteAddress = "10.191.0.1";
// const ping = () => {
//     console.log(`ping network host (${remoteAddress})`);
//     axios.get(`http://${remoteAddress}:82/ping`, { timeout: 5000 }).then((r) => {
//         console.log("ping reply received", r.data);
//         db.set(`ping-${remoteAddress}`, Date.now());
//         setTimeout(ping, 60 * 1000);
//     }).catch((e) => {
//         console.log(`ping reply not received (${e.message})`);
//         setTimeout(ping, 5 * 1000);
//     })
// };

// ping();