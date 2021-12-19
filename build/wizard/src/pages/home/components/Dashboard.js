import React from "react";
import spinner from "../../../assets/spinner.svg";
import API from "../../../util/API";
import CTE from "react-click-to-edit";
import update from 'immutability-helper';
import { CopyToClipboard } from 'react-copy-to-clipboard';
// import downloadandroid from "../../../assets/download-android.svg";
// import downloadios from "../../../assets/download-ios.svg";
// import downloadmac from "../../../assets/download-mac.svg";
// import downloadwin from "../../../assets/download-win.svg";
import ReactTooltip from 'react-tooltip';
import { faCopy, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./Dashboard.css";

// const baseurl = "https://download.zerotier.com/RELEASES/1.6.6/dist";

const ClickToCopy = ({ children, text }) => {
    const [copied, setCopied] = React.useState(false);
    return (

        <span className="icon-text">
            <span>{children}</span>&nbsp;
            <CopyToClipboard text={text}
                className="icon"
                onCopy={() => {
                    setCopied(true)
                    setTimeout(() => { setCopied(false) }, 2000);
                }}>
                <FontAwesomeIcon
                    icon={faCopy}
                />
            </CopyToClipboard>
            {copied && (<span className="is-size-6">&nbsp;Copied!</span>)}
        </span>
    )
}

const Comp = () => {

    const [showSpinner, setShowSpinner] = React.useState(true);
    const [network, setNetwork] = React.useState();
    const [networkMembers, setNetworkMembers] = React.useState();
    // const [copied, setCopied] = React.useState(false);

    // React.useEffect(() => {
    //     setTimeout(() => {
    //         setCopied(false);
    //         ReactTooltip.rebuild()
    //     }, 4000);
    //     ReactTooltip.rebuild()
    // }, [copied]);

    const fetchMembers = async () => {
        const m = await API.networkMembers();
        setNetworkMembers(m);
    }

    React.useEffect(() => {
        let timer;
        API.networkStatus().then((network) => {
            setNetwork(network);
            fetchMembers();
            setShowSpinner(false);
            if (network.networkid) {
                timer = setInterval(async () => {
                    fetchMembers();
                }, 5000)
            }
        });

        return (() => {
            clearInterval(timer);
        })

    }, []);

    if (showSpinner) {
        return (
            <section className="is-medium has-text-white">
                <div className="">
                    <div className="container">
                        <div className="columns is-mobile">
                            <div className="column is-8-desktop is-10 is-offset-1  has-text-centered">
                                <p className="is-size-5 has-text-weight-bold">Loading</p>
                                <div className="spacer"></div>
                                <img alt="spinner" src={spinner} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
    const setAuth = (address, authorized) => {

        // toggle UI immediately
        const toggle = (address, authorized) => {
            const i = networkMembers.findIndex((m) => { return m.address === address });
            if (i !== -1) {
                const member = networkMembers[i];
                member.authorized = authorized;
                const updatedNetworkMembers = update(networkMembers, { $splice: [[i, 1, member]] })
                setNetworkMembers(updatedNetworkMembers);
            }
        }

        console.log(`Toggle ${address}`);
        if (authorized) {
            API.networkAdd(address);
            toggle(address, authorized);
        } else {
            API.networkRemove(address);
            toggle(address, authorized);
        }
    }

    const networkTable = () => {
        if (!networkMembers) {
            return null;
        }
        // the AVADO itself is also part of the network, since it's the network owner we don't want it to be managed.
        // So filter it out
        const externalMembers = networkMembers.filter((member) => { return member.address !== network.status.address })
        const renderedMembers = externalMembers.length > 0 ? externalMembers.map((member) => {

            return (
                <tr key={member.address}>
                    <td width="5%"><input type="checkbox" checked={member.authorized} onChange={() => { setAuth(member.address, !member.authorized) }} /></td>
                    <td data-tip="click to edit">{member.address}</td>
                    <td>{member.authorized && member.ipAssignments && member.ipAssignments.length > 0 ? (<>yes</>) : (<>no</>)}</td>
                    <td>

                        <CTE

                            inputClassName="has-text-white"
                            initialValue={member.name}
                            endEditing={async (value) => {
                                await API.setNodeName(member.address, { value });
                                fetchMembers();
                            }}
                        />

                    </td>
                    <td>
                        <button
                            disabled={member.authorized}
                            className="button is-small"
                            onClick={() => {
                                API.networkDelete(member.address)
                            }}><span>Delete</span><span className="icon is-small"><FontAwesomeIcon
                                icon={faTrash}
                            /></span></button>
                    </td>
                </tr>
            );
        }) : (
            <tr><td colSpan="5">No members yet - please join this network to get your device listed here !</td></tr>
        );

        return (
            <div className="card-table">

                <div className="content">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Allowed</th>
                                <th>Node ID</th>
                                <th>Connected</th>
                                <th>Description</th>
                                <th>Commands</th>
                                {/* <th>Qualification or relegation</th> */}
                            </tr>
                        </thead>
                        <tbody>
                            {renderedMembers}
                        </tbody>
                    </table>
                </div>
            </div>

        )
    }

    return (
        <>
            <ReactTooltip />
            <section className="is-medium has-text-white">
                <div className="columns is-mobile">
                    <div className="column is-8-desktop is-10">
                        <h1 className="title is-1 is-spaced has-text-white">AVADO Remote connection</h1>
                    </div>
                </div>
                <p>Here you can configure your computer, tablet or phone to connect remotely to your AVADO - please read the <a target="_blank" rel="noopener noreferrer" href="https://wiki.ava.do/tutorials/remote-connect">instructions</a> first !</p>
                <br />

                <section className="is-medium has-text-white">
                    <div className="set_setting">
                        <h3 className="is-size-3 has-text-white">My AVADO network</h3>


                        <table className="table no-lines">
                            <tbody className="is-size-5 has-text-white">
                                <tr>
                                    <td>ID</td>
                                    <td>
                                        <ClickToCopy text={network && network.networkid}>{network && network.networkid}</ClickToCopy>
                                    </td>
                                </tr>
                                <tr>
                                    <td>Name</td>
                                    <td>
                                        <CTE
                                            inputClassName="input"
                                            initialValue={network.network.name}
                                            endEditing={async (value) => {
                                                API.setNetworkName(value);
                                                console.log(`new name ${value}`)
                                            }}
                                        />
                                    </td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </section>
                <section className="is-medium has-text-white">
                    <div className="set_setting">
                        <h3 className="is-size-3">Network members</h3>
                        {networkTable() || (<>No members yet</>)}
                    </div>
                </section>
                <br />
                <div className="notification is-link">
                    <p>If you're looking for the old VPN connection page - please go <a target="_top" href="http://my.avado/#/devices">here</a>.<br/>Please note that the VPN package will be removed in future versions</p>
                </div>
                {/* 
                <h1 className="title is-1 is-spaced has-text-white">Setup instructions</h1>

                <h3 className="title is-4 is-spaced has-text-white">On your laptop/phone</h3>
                <ol>
                    <li>1. Download and install the Remote Connect client for your device</li>
                    <li>

                        <a href={`${baseurl}/ZeroTier%20One.msi`} target="_blank" rel="noopener noreferrer" title="Windows">
                            <span className="icon is-large">
                                <img alt="Download" src={downloadwin} />
                            </span>
                        </a>
                        <a href={`${baseurl}/ZeroTier%20One.pkg`} target="_blank" rel="noopener noreferrer" title="Mac">
                            <span className="icon is-large">
                                <img alt="Download" src={downloadmac} />
                            </span>
                        </a>
                        <a href="https://play.google.com/store/apps/details?id=com.zerotier.one" target="_blank" rel="noopener noreferrer" title="Android">
                            <span className="icon is-large">
                                <img alt="Download" src={downloadandroid} />
                            </span>
                        </a>
                        <a href="https://itunes.apple.com/us/app/zerotier-one/id1084101492?mt=8" target="_blank" rel="noopener noreferrer" title="iOS">
                            <span className="icon is-large">
                                <img alt="Download" src={downloadios} />
                            </span>
                        </a>
                        <br />
                    </li>
                    <li>2. From the client - join the network <b>{network.networkid}</b> and check these checkboxes <b>Allow managed</b>, <b>"Allow DNS"</b> and <b>"Allow Global"</b></li>
                </ol>
                <br /><br />
                <h3 className="title is-4 is-spaced has-text-white">On your AVADO</h3>
                <ol>
                    <li>3. Your device will show up in the member-list below after a few seconds (you can click the description to edit the name of the device)</li>
                    <li>4. Check the checkbox to allow access from that device to your avado</li>
                </ol>
                <br /><br />
                <h3 className="title is-4 is-spaced has-text-white">On your laptop/phone</h3>
                <ol>
                    <li>5. disconnect from the AVADO WiFi and connect back to your home WiFi</li>
                    <li>6. wait until the client's status says <b>"OK"</b> (it might say "REQUESTING_CONFIGURATION" for a minute or so - just wait until this disappears)</li>
                    <li>7. now try connecting to <a href="http://my.ava.do">http://my.ava.do</a> <b>"OK"</b></li>
                </ol> */}

            </section>
            <br /><br />

        </>
    );

};

export default Comp;