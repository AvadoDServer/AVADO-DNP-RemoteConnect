module.exports = (server, config) => {

    const zt = require("./util/zt")(config);

    // ************************************************************************
    // ZT network
    // ************************************************************************

    // returns zerotier controller status & generic info about this client
    server.get("/network/status", async (req, res) => {
        console.log("Get network status");
        setTimeout(async () => {
            console.log("fetch status");
            const status = await config.ztController.status();
            const info = await config.ztController.info();
            console.log("ok rcvg status", status.data);
            const networkId = config.db.get("networkid");
            const network = await config.ztController.getNetwork(networkId);
            let response = {
                networkid: networkId,
                network: network ? network.data : undefined,
                status: status ? status.data : undefined,
                info: info ? info.data : undefined,
            };
            return res.send(200, response);
        }, 0);
    });

    // allow nodeid access to this network
    server.get("/network/add/:nodeid", async (req, res) => {
        if (!config.db.get("networkid")) {
            return res.send(404);
        }
        if (!req.params.nodeid) {
            return res.send(400);
        }

        try {
            const addMemberReply = await config.ztController.postMember(
                config.db.get("networkid"),
                req.params.nodeid,
                {
                    authorized: true,
                }
            );
            return res.send(200, addMemberReply.data);
        } catch (e) {
            return res.send(500, e.message);
        }
    });

    // disallow nodeid access to this network
    server.get("/network/remove/:nodeid", async (req, res) => {
        if (!config.db.get("networkid")) {
            return res.send(404);
        }
        if (!req.params.nodeid) {
            return res.send(400);
        }
        try {
            const removeMemberReply = await config.ztController.postMember(
                config.db.get("networkid"),
                req.params.nodeid,
                {
                    authorized: false,
                }
            );
            return res.send(200, removeMemberReply.data);
        } catch (e) {
            return res.send(500, e.message);
        }
    });

    // delete nodeid from network altogether
    server.get("/network/delete/:nodeid", async (req, res) => {
        if (!config.db.get("networkid")) {
            return res.send(404);
        }
        if (!req.params.nodeid) {
            return res.send(400);
        }

        try {
            console.log(`Delete member ${req.params.nodeid} from ${config.db.get("networkid")}`)
            const deleteMemberReply = await config.ztController.deleteMember(config.db.get("networkid"), req.params.nodeid);
            return res.send(200, deleteMemberReply.data);
        } catch (e) {
            return res.send(500, e.message);
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

    // set network name
    server.post("/network/setname", async (req, res) => {
        const networkId = config.db.get("networkid");
        console.log(`Changing network ${networkId}'s name to ${req.body.name}`);
        await config.ztController.postNetwork(networkId, { name: req.body.name });
        return res.send(200);
    });

    // get list of members in this network
    server.get("/network/members", async (req, res) => {
        if (!config.db.get("networkid")) {
            return res.send(400);
        }
        const members = await config.ztController.getMembers(config.db.get("networkid"));
        if (!members || !members.data) {
            console.log("No members found in this network.");
            return res.send(200);
        }

        const mi = Object.keys(members.data).map(async (member) => {
            const m = await memberInfo(member);
            return m;
        });

        Promise.all(mi).then((mir) => {
            return res.send(200, mir);
        })
    });
}
