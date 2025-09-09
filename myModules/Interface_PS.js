const fetch = require("node-fetch");
const { loglv } = require("./config");
require('dotenv').config()

var deviceCodes= ['0']
deviceCodes.push( process.env["PISHOCK_DEVICE1"], process.env["PISHOCK_DEVICE2"], process.env["PISHOCK_DEVICE3"])

function PiShock(intensity=1,duration=1,deviceNum=1) {
    console.log(`${loglv().log}\x1b[0m[\x1b[33mPiShock\x1b[0m] Device ${deviceNum}: Shocking ${intensity}% for ${duration}secs` )
    fetch('https://do.pishock.com/api/apioperate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            Username: process.env["VRC_ACC_NAME_1"],
            Apikey: process.env["PISHOCK_APIKEY"],
            Code: deviceCodes[deviceNum],
            Name: '14aOSC',
            Op: 0,
            Duration: duration,
            Intensity: intensity
        })
    })
}
exports.PiShock = PiShock;

function PiShockAll(intensity=1,duration=1) {
    PiShock(intensity,duration,1)
    PiShock(intensity,duration,2)
    PiShock(intensity,duration,3)
}
exports.PiShockAll = PiShockAll;

// PiShockAll(30,3)