const generate = require('project-name-generator');
module.exports = (config) => {

    const getZtAddress = async () => {
        const getStatusReply = await config.ztController.status();
        return getStatusReply.data.address;
    }

    return ({
        createNetwork: async () => {
            if (!config.db.get("networkid")) {
                const myZtAddress = await getZtAddress();
                const rndName = generate({ words: 3 }).raw
                const mainNetworkName = [rndName[0], rndName[1], "AVADO"].join(" ");
                console.log(`Creating main network ${mainNetworkName}`);
                const mainNetwork = await config.ztController.createNetwork(
                    myZtAddress,
                    {
                        name: mainNetworkName,
                        v4AssignMode: {
                            "zt": true
                        },
                        allowDNS: true,
                        bridge: true,
                        dns: {
                            servers: ["172.30.0.2"]
                        },
                        private: true,
                        ipAssignmentPools: [
                            {
                                "ipRangeStart": "172.30.4.2",
                                "ipRangeEnd": "172.30.4.254"
                            }
                        ],
                        routes: [
                            {
                                "target": "172.30.0.0/22"   // lan
                            }
                        ],
                        rules: [
                            {
                                "type": "ACTION_ACCEPT"
                            }
                        ],
                    });
                console.log(`Creating network`);

                if (
                    mainNetwork && mainNetwork.data && mainNetwork.data.id
                ) {
                    const mainNetworkId = mainNetwork.data.id;
                    console.log(`created a new main network. ID=${mainNetworkId}`);
                    console.log(`adding myself ${myZtAddress} to ${mainNetworkId}`);
                    const addMemberRes = await config.ztController.postMember(
                        mainNetwork.data.id,
                        myZtAddress,
                        {
                            authorized: true,
                            ipAssignments: ["172.30.4.1"]
                        }
                    );
                    console.log(`Added myself to ${mainNetworkId} res=${addMemberRes.status}`);
                    console.log(`Joining network ${mainNetworkId}`);
                    const joinRes = await config.ztService.join(mainNetworkId);
                    // console.log(`Join ${mainNetworkId} res=`, joinRes);

                    // console.log(joinRes);

                    return ({ networkid: mainNetworkId });

                }
            } else {
                console.log(`problem on network creation`);
            }

        }
    })
}

