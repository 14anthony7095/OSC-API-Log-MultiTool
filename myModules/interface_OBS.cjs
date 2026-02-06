const { OBSWebSocket } = require('obs-websocket-js');
const obs = new OBSWebSocket();
const fs = require('fs');
require('dotenv').config({ 'quiet': true })
const { logEmitter } = require("./Interface_vrc-Log.js");
const { apiEmitter } = require("./Interface_vrc-Api.js");
const { oscEmitter } = require('./Interface_osc_v1.js');


async function sleep(time) { return new Promise((resolve) => { console.log(`Sleeping for ${time} ms`); setTimeout(() => { resolve(1) }, time); }) }
var connected = false
async function main() {
    try {
        const {
            obsWebSocketVersion,
            negotiatedRpcVersion
        } = await obs.connect('ws://192.168.1.210:4455', process.env["OBS_WEBSOCKET_PASSWORD"], {
            rpcVersion: 1
        });
        console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
        connected = true

        obs.callBatch([{ requestType: 'SetInputMute', requestData: { inputName: 'VR Mic', inputMuted: true } }])

        obs.once('ExitStarted', () => {
            connected = false
            console.log('OBS started shutdown');
            obs.disconnect()
            setTimeout(() => { main() }, 300000)
        });

    } catch (error) {
        connected = false
        console.error('Failed to connect', error.code, error.message);
        setTimeout(() => { main() }, 300000)
    }
}
main()

function getOBSstate() { return connected }
exports.getOBSstate = getOBSstate

logEmitter.on('headingToWorld', async () => {
    if (connected == true) {
        await obs.callBatch([{ requestType: 'SetCurrentProgramScene', requestData: { sceneName: 'vrc_switchingWorlds' } }])
    }
})

apiEmitter.on('fetchedDistThumbnail', (url, name, authorname) => {
    fs.writeFile('./assets/obs-worldImage.html', `<html><img style="width: 100%;height: 100%;" src="${url}"></html>`, 'utf8', (err) => {
        if (err) { console.log(err) }
        if (connected == true) {
            obs.callBatch([{ requestType: 'PressInputPropertiesButton', requestData: { inputName: 'WebImage', propertyName: 'refreshnocache' } }])
        }
    })
    fs.writeFile('./assets/obs-world-name.txt', name, 'utf8', (err) => { if (err) { console.log(err) } })
    fs.writeFile('./assets/obs-world-author.txt', `By: ${authorname}`, 'utf8', (err) => { if (err) { console.log(err) } })
})

logEmitter.on('joinedworld', () => {
    if (connected == true) {
        obs.callBatch([{ requestType: 'SetCurrentProgramScene', requestData: { sceneName: 'vrc_inWorld' } }])
    }
})

oscEmitter.on('voiceActive', (value)=>{
    obs.callBatch([{ requestType: 'SetInputMute', requestData: { inputName: 'VR Mic', inputMuted: value } }])
});