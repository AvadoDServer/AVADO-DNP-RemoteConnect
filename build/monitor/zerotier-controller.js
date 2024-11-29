var assert = require('assert')
var request = require('nanorequest')
const axios = require('axios');
const http = require('http');


class Service {
    constructor({ authToken, host = 'localhost', port = 9993 }) {
        assert(
            typeof authToken === 'string',
            'We need an authToken to talk to the service.'
        )
        this._host = host
        this._port = port

        this._headers = {
            'X-ZT1-Auth': authToken,
            'content-type': 'application/json'
        }

        this.defaultOpts = {
            host: this._host,
            port: this._port,
            headers: this._headers
        }

        this.authToken = authToken;

        this.controller = this.controller.bind(this)
        this.network = this.network.bind(this)
        this._status = this._status.bind(this)

    }



    get(opts) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.defaultOpts.host,
                port: this.defaultOpts.port,
                path: opts.path,
                method: 'GET',
                headers: {
                    'X-ZT1-AUTH': this.authToken, // Custom header
                },
            };
            console.log(`GET request`, options);
            const req = http.request(options, (res) => {
                let data = '';

                // Collect response data chunks
                res.on('data', (chunk) => {
                    data += chunk;
                });

                // Handle end of response
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        console.log(`http fetch returns`, data);
                        resolve({ data: JSON.parse(data) }); // Resolve with { data }
                    } else {
                        reject(
                            new Error(
                                `HTTP error! Status: ${res.statusCode}, Message: ${res.statusMessage}`
                            )
                        );
                    }
                });
            });

            // Handle errors
            req.on('error', (error) => {
                reject(new Error(`Request error: ${error.message}`));
            });

            // Finalize the request
            req.end();
        });
    }


    // get(opts, cb) {
    //     opts = {
    //         method: 'get',
    //         url: `http://${this.defaultOpts.host}:${this.defaultOpts.port}${opts.path}`,
    //         headers: this.defaultOpts.headers
    //     }
    //     console.log(`get opts`, opts);
    //     return axios.request(opts).then((r) => {
    //         console.log(`get returns`, r);
    //         return r
    //     })
    // }

    post(opts, cb) {
        opts = {
            method: 'post',
            timeout: 2000,
            url: `http://${this.defaultOpts.host}:${this.defaultOpts.port}${opts.path}`,
            headers: this.defaultOpts.headers,
            data: opts.body
        }
        return axios.request(opts).then((r) => {
            return r
        })
    }


    delete(opts, cb) {
        opts = {
            method: 'delete',
            timeout: 2000,
            url: `http://${this.defaultOpts.host}:${this.defaultOpts.port}${opts.path}`,
            headers: this.defaultOpts.headers
        }
        return axios.request(opts).then((r) => {
            return r
        })
    }

    controller(cb) {
        return this.get({ path: '/controller' }, cb)
    }

    _status(cb) {
        return this.get({ path: '/status' }, cb)
    }

    network(cb) {
        return this.get({ path: '/controller/network' }, cb)
    }

    createNetwork(controllerId, options, cb) {
        const address = `/controller/network/${controllerId}______`;
        return this.post({
            path: address,
            body: options
        }, cb);
    }

    getNetwork(networkId, cb) {
        return this.get({ path: `/controller/network/${networkId}` }, cb)
    }

    postNetwork(networkId, options, cb) {
        return this.post({
            path: `/controller/network/${networkId}`,
            body: options
        }, cb)
    }

    deleteNetwork(networkId, cb) {
        return this.delete({ path: `/controller/network/${networkId}` }, cb)
    }

    getMembers(networkId, cb) {
        return this.get({ path: `/controller/network/${networkId}/member` }, cb)
    }

    getMember(networkId, memberId, cb) {
        return this.get({ path: `/controller/network/${networkId}/member/${memberId}` }, cb)
    }

    postMember(networkId, address, options, cb) {
        return this.post({
            path: `/controller/network/${networkId}/member/${address}`,
            body: options
        }, cb);
    }

    deleteMember(networkId, address, cb) {
        return this.delete({
            path: `/controller/network/${networkId}/member/${address}`,
        }, cb);
    }


    status(cb) {
        return this.get({ path: '/status' }, cb)
    }

    info(cb) {
        return this.get({ path: '/info' }, cb)
    }
}

module.exports = Service;
