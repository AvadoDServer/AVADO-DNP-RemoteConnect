const random_name = require('node-random-name');

module.exports = (server, config) => {

    const zt = require("./util/zt")(config);

    // ************************************************************************
    // ZT network
    // ************************************************************************

    // returns zerotier controller status & generic info about this client
    server.get("/network/status", async (req, res, next) => {
        console.log("Get network status");
        setTimeout(async () => {
            console.log("fetch status");
            const status = await config.ztController.status();
            const info = await config.ztController.info();
            console.log("ok rcvg status", status.data);
            const networkId = config.db.get("networkid");
            let response = {
                networkid: networkId,
                status: status ? status.data : undefined,
                info: info ? info.data : undefined,
            };
            res.send(200, response);
            return next();

        }, 0);
    });


    // allow nodeid access to this network
    server.get("/network/add/:nodeid", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            res.send(404);
            return next();
        }
        if (!req.params.nodeid) {
            res.send(400);
            return next();
        }

        try {
            const addMemberReply = await config.ztController.postMember(
                config.db.get("networkid"),
                req.params.nodeid,
                {
                    authorized: true,
                }
            );
            res.send(200, addMemberReply.data);
            return next();
        } catch (e) {
            res.send(500, e.message);
            return next();
        }
    });

    // disallow nodeid access to this network
    server.get("/network/remove/:nodeid", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            res.send(404);
            return next();
        }
        if (!req.params.nodeid) {
            res.send(400);
            return next();
        }
        try {
            const removeMemberReply = await config.ztController.postMember(
                config.db.get("networkid"),
                req.params.nodeid,
                {
                    authorized: false,
                }
            );
            res.send(200, removeMemberReply.data);
            return next();
        } catch (e) {
            res.send(500, e.message);
            return next();
        }
    });

    // delete nodeid from network altogether
    server.get("/network/delete/:nodeid", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            res.send(404);
            return next();
        }
        if (!req.params.nodeid) {
            res.send(400);
            return next();
        }

        try {
            console.log(`Delete member ${req.params.nodeid} from ${config.db.get("networkid")}`)
            const deleteMemberReply = await config.ztController.deleteMember(config.db.get("networkid"), req.params.nodeid);
            res.send(200, deleteMemberReply.data);
            return next();
        } catch (e) {
            res.send(500, e.message);
            return next();
        }
    });


    const memberInfo = async (memberid) => {
        try {
            console.log(`Fetch info on member ${memberid} of network ${config.db.get("networkid")}`)
            const reply = await config.ztController.getMember(config.db.get("networkid"), memberid);
            if (reply.data) {
                reply.data.name = config.db.get(`name_${memberid}`) || "New client";
                console.log(`Setting node name to ${reply.data.name}`);
                const ip = reply.data.ipAssignments && reply.data.ipAssignments[0] ? reply.data.ipAssignments[0] : "";
                console.log(`the ip of client is ${ip}`);
            }
            return reply.data;
        } catch (e) {
            console.log("error", e);
            return;
        }
    }

    server.get("/network/members", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            res.send(400);
            return next();
        }
        const members = await config.ztController.getMembers(config.db.get("networkid"));
        if (!members || !members.data) {
            console.log("No members found in this network.");
            res.send(200);
            return next();
        }

        const mi = Object.keys(members.data).map(async (member) => {
            const m = await memberInfo(member);
            return m;
        });

        Promise.all(mi).then((mir) => {
            res.send(200, mir);
            return next();
        })
    });
}
