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
            console.log("ok rcvg status", status.data);
            const networkId = config.db.get("networkid");
            let response = {
                networkid: networkId,
                status: status ? status.data : undefined,
            };
            res.send(200, response);
            return next();

        }, 0);
    });


    // add member to this network
    server.get("/network/add/:memberid", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            res.send(404);
            return next();
        }
        if (!req.params.memberid) {
            res.send(400);
            return next();
        }

        try {
            const addMemberReply = await config.ztController.postMember(
                config.db.get("networkid"),
                req.params.memberid,
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

    server.get("/network/delete/:memberid", async (req, res, next) => {
        if (!config.db.get("networkid")) {
            res.send(404);
            return next();
        }
        if (!req.params.memberid) {
            res.send(400);
            return next();
        }

        try {
            console.log(`Delete member ${req.params.memberid} from ${config.db.get("networkid")}`)
            const deleteMemberReply = await config.ztController.deleteMember(config.db.get("networkid"), req.params.memberid);
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
                reply.data.name = random_name({ seed: memberid });
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
            console.log("fetching info on member", member);
            const m = await memberInfo(member);
            return m;
        });

        Promise.all(mi).then((mir) => {

            console.log("mi=", mir);

            res.send(200, mir);
            return next();

        })


    });


    // server.get("/network/memberinfo/:memberid", async (req, res, next) => {
    //     if (!config.db.get("networkid")) {
    //         res.send(404);
    //         return next();
    //     }

    //     if (!req.params.memberid) {
    //         res.send(400);
    //         return next();
    //     }

    //     const reply = await memberInfo(req.params.memberid);
    //     if (reply) {
    //         res.send(200, reply.data);
    //         return next();
    //     } else {
    //         res.send(500, "no reply received");
    //         return next();
    //     }

    // });

    // // join network as a client
    // server.get("/network/join/:networkid", async (req, res, next) => {

    //     if (!req.params.networkid) {
    //         res.send(400);
    //         return next();
    //     }

    //     try {
    //         const reply = await config.ztService.join(req.params.networkid);
    //         config.db.set("networkid", req.params.networkid);
    //         config.db.set("mode", "client");
    //         res.send(200, reply.data);
    //         return next();
    //     } catch (e) {
    //         res.send(500, e.message);
    //         return next();
    //     }
    // });


    // // leave network as a client
    // server.get("/network/leave/:networkid", async (req, res, next) => {


    //     if (!req.params.networkid) {
    //         res.send(400);
    //         return next();
    //     }

    //     console.log(`leave network ${req.params.networkid}`)


    //     try {
    //         const reply = await config.ztService.leave(req.params.networkid);
    //         config.db.set("networkid", null);
    //         config.db.set("mode", "init");
    //         res.send(200, reply.data);
    //         return next();
    //     } catch (e) {
    //         res.send(500, e.message);
    //         return next();
    //     }
    // });


    // // which networks am I part of ?
    // server.get("/network/membership", async (req, res, next) => {
    //     config.ztService.networks(function (err, res2, body) {
    //         if (err) {
    //             console.error(err.message)
    //             res.send(500, err.message);
    //             return next();
    //         }
    //         else {
    //             console.log("/service/status", body);
    //             res.send(200, body);
    //             return next();
    //         }
    //     })
    // });

}
