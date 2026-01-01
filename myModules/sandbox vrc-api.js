/*
-------------------------------------

    VRChat API Requests

-------------------------------------
*/
// Libraries
const { loglv } = require("./config.js");
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const fs = require('fs');
require('dotenv').config()

let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
console.log(`${loglv().log}${selflog} Loaded`)

var vrchat = new VRChat({
    application: {
        name: "Api-Osc-Interface_DEV",
        version: "1.2-DEV",
        contact: process.env["CONTACT_EMAIL"]
    },
    authentication: {
        credentials: {
            username: process.env["VRC_ACC_LOGIN_1"],
            password: process.env["VRC_ACC_PASSWORD_1"],
            totpSecret: process.env["VRC_ACC_TOTPSECRET_1"]
        }
    },
    keyv: new KeyvFile({ filename: "./datasets/vrcA.json" }),
});



var vrcpropcount = {
    'prop_id': {
        "Name": 'sample',
        "Count": 999
    }
}
fs.readFile('./datasets/propcounts.json', 'utf8', (err, data) => { vrcpropcount = JSON.parse(data) })


var cacheItem = {}
main()
async function main() {
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);

    // let data = await getMutualFriends()

    // await equipPortal()

    for (const item in vrcpropcount) {
        console.log(item)
        var res = await vrchat.getProp({ 'path': { 'propId': 'prop_' + item } })
        console.log(res.data)
        cacheItem[res.data.name] = res.data
        if (res.data.itemTemplate) {
            console.log(res.data.itemTemplate)
            let res2 = await vrchat.getInventoryTemplate({ 'path': { 'inventoryTemplateId': res.data.itemTemplate } })
            cacheItem[res.data.name].itemTemplate = res2.data
        }
    }

    // let data = await vrchat.getFile({'path':{'fileId':'file_f411e553-4a87-4986-be84-dee85f7bcf82'}})

    fs.writeFile('./output.json', JSON.stringify(cacheItem), 'utf-8', (err) => { if (err) { console.log(err) } })


}



async function getMutualFriends() {
    return new Promise(async (resolve, reject) => {
        let { data: auth } = await vrchat.verifyAuthToken()
        auth.ok == true ? console.log(auth.token) : console.log(`Couldn't return authcookie for whatever reason..`)
        const vrcapihttp = `https://api.vrchat.cloud/api/1/`
        const vrcuserid = `usr_469ba82d-a0eb-4938-b199-e773af70c8f9`
        const vrcapiEndpoint = `users/${vrcuserid}/mutuals/friends`

        var getReq = {
            method: 'GET',
            headers: { 'User-Agent': '14anthony7095/Curl', 'Cookie': 'auth=' + auth.token }
        }

        var request = await fetch(vrcapihttp + '' + vrcapiEndpoint, getReq)
        var data = await request.json()
        console.log(data)
        resolve(data)
    })
}


async function equipPortal() {
    return new Promise(async (resolve, reject) => {
        let { data: auth } = await vrchat.verifyAuthToken()
        auth.ok == true ? console.log(auth.token) : console.log(`Couldn't return authcookie for whatever reason..`)
        const vrcapihttp = `https://api.vrchat.cloud/api/1/`
        const vrcinvid = `inv_240faddb-318e-4365-809e-2094747c4f1c` // Magic Gateway
        // const vrcinvid = `inv_81612f95-8f84-4fd0-82c9-e86fcb5bb23a` // Beta Portal
        const vrcapiEndpoint = `inventory/${vrcinvid}/equip`

        var bodyJson = { "equipSlot": "portal" }
        var putReq = {
            method: 'PUT',
            headers: { 'User-Agent': '14anthony7095/Curl', 'Cookie': 'auth=' + auth.token, 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyJson)
        }

        var request = await fetch(vrcapihttp + '' + vrcapiEndpoint, putReq)
        var data = await request.json()
        console.log(data)
        resolve(data)
    })
}


// setInterval(() => { console.log('30s') }, 30_000);

