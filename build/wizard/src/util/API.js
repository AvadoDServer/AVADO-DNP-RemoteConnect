import axios from "axios";
const packageAPI = "http://remoteconnect.my.ava.do:81";

const API = {
    networkStatus: async () => {
        return (await axios.get(`${packageAPI}/network/status`)).data;
    },
    networkMembers: async () => {
        return (await axios.get(`${packageAPI}/network/members`)).data;
    },
    networkAdd: async (address) => {
        return (await axios.get(`${packageAPI}/network/add/${address}`)).data;
    },
    networkRemove: async (address) => {
        return (await axios.get(`${packageAPI}/network/remove/${address}`)).data;
    },
    networkDelete: async (address) => {
        return (await axios.get(`${packageAPI}/network/delete/${address}`)).data;
    },
    setNodeName: async (address, name) => {
        await axios.post(`${packageAPI}/db/set/name_${address}`, name);
    },
    getNodeName: async (address, name) => {
        return (await axios.get(`${packageAPI}/db/get/name_${address}`, name)).data;
    },
    setNetworkName: async (name) => {
        await axios.post(`${packageAPI}/network/setname`, { name });
    },
}

export default API;