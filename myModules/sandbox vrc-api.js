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
const { distance, closestMatch } = require("closest-match");
// const { logEmitter } = require("./Interface_vrc-Log.js");
require('dotenv').config({ 'quiet': true })


let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
console.log(`${loglv().log}${selflog} Loaded`)

var vrchat = new VRChat({ application: { name: "Api-Osc-Interface_DEV", version: "1.2-DEV", contact: process.env["CONTACT_EMAIL"] }, authentication: { credentials: { username: process.env["VRC_ACC_LOGIN_1"], password: process.env["VRC_ACC_PASSWORD_1"], totpSecret: process.env["VRC_ACC_TOTPSECRET_1"] } }, keyv: new KeyvFile({ filename: "./datasets/vrcA.json" }) });


var vrcpropcount = {
    'prop_id': {
        "Name": 'sample',
        "Count": 999
    }
}
fs.readFile('./datasets/propcounts.json', 'utf8', (err, data) => { vrcpropcount = JSON.parse(data) })



var worldlist = [
    'wrld_c47775b6-dd53-4f8d-b130-8332d58c3910',
    'wrld_1c0d1975-d3a9-4c12-8187-6f0df3e2b41f',
    'wrld_fa3dcecb-f855-405f-96c0-6ed08f1de05d',
    'wrld_fea70c68-2e61-493d-9501-ac158b21d698',
    'wrld_5e6e41ed-be82-4c84-b849-e6201422baff',
    'wrld_a2ce1007-139e-4508-8250-eab157c8c2f3',
    'wrld_a2899a4a-2341-4dab-ab30-0f37ad2f73a0',
    'wrld_6fd1d57b-c299-4900-84e1-c7ac9da0fa6d',
    'wrld_971ff150-4d17-4057-91a0-e383dc683470',
    'wrld_0dc0bbb1-51fb-4096-bc70-8d96eebdb101',
    'wrld_542334f4-de69-4252-867f-4922a61b10d0'
]

// maindev()
function maindev() {
    var dict = ['01 - Akiho Nagase V2', 'Haishima test', 'Ana Birb', 'Jay Seth （CC）']
    var selectedAvy = 'Jay Seth (Color Change)'

    console.log(selectedAvy + `\n`)
    for (const item in dict) {
        console.log(dict[item] + ` = ` + distance(selectedAvy, dict[item]))
    }
    console.log(`\n` + closestMatch(selectedAvy, dict))

}

// main()
async function main() {
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);


    // 2026.01.28 01:35:17 Debug      -  [Behaviour] Switching Yugenki to avatar 01 - Akiho Nagase V2

    // [Behaviour] Switching USER_DISPLAYNAME to avatar AVATAR_NAME
    // [API] Requesting Get analysis/FILE_ID/FILE_VERISON/security {{}} retryCount: 2




}

function formatBytes(bytes, decimals = 1) {
    return new Promise((resolve, reject) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        resolve(parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i])
    })
}

var userAvatars = []
/* logEmitter.on('avatarchange', (username, avatarname) => {
    console.log(`${avatarname} worn by ${username}`)

    let search = userAvatars.find(e => e.user == username)
    if (search == undefined) {
        userAvatars.push({ "user": username, "avatar": avatarname })
    } else {
        userAvatars[ userAvatars.indexOf(search) ] = { "user": username, "avatar": avatarname }
    }

    console.log(userAvatars)
}) */
/* logEmitter.on('fileanalysis', async (fileid, fileversion) => {
    let res = await vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } })
    if (res.data.avatarStats || res.data.performanceRating) {
        // console.log('File is Avatar')
        let getName = await vrchat.getFile({ 'path': { 'fileId': fileid } })
        res.data["name"] = getName.data.name.slice(9).split(' - Asset bundle - ')[0]
        let filesize = await formatBytes(res.data.fileSize)
        console.log(`${filesize} ${res.data.performanceRating} ${res.data.name}`)
        closestMatch(res.data.name, userAvatars.find(e=>e.avatarname) )
    }
}) */


async function fileCheck(fileid, fileversion) {
    // let res = await vrchat.getFile({ 'path': { 'fileId': fileid, 'versionId': fileversion } });console.log(res)
    let res2 = await vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } });console.log(res2)
}
// fileCheck('file_d71306cc-d216-410d-b9be-e9f7ec42f8cf', 2)


getAvatarThumbnail()
async function getAvatarThumbnail() {
    let filter = ['itsBiffy']
    let res = await getMutualFriends('usr_db6b86b5-19ba-4a3d-ab92-e698c8baef1f')
    // console.log(res)
    // file_165709d6-51ab-4b11-b81a-2dddfb2a16a9
    var filtered = res.filter(e => filter.includes(e.displayName))
    console.log(filtered)
}

async function discordWorldList(worldIdArr = ['']) {
    // Setup
    var stringbuilder = ''
    var cache = []
    function formatBytes(bytes, decimals = 1) {
        return new Promise((resolve, reject) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            resolve(parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i])
        })
    }

    // Fetch world data
    for (const id in worldIdArr) {
        console.log(`Checking ${worldlist[id]}`)
        let res = await vrchat.getWorld({ 'path': { 'worldId': worldlist[id] } })
        let getFile = res.data.unityPackages.filter(e => e.platform == 'standalonewindows').find(e => e.scanStatus == 'passed')
        let fileId = getFile.assetUrl.slice(36, 77)
        let fileVersion = getFile.assetUrl.slice(78).split('/')[0]
        let res2 = await vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileId, 'versionId': fileVersion } })
        cache.push({
            'name': res.data.name,
            'id': res.data.id,
            'capacity': parseInt(res.data.capacity),
            'size': parseInt(res2.data.fileSize),
            'favRatio': Math.round((res.data.favorites / res.data.visits) * 100)
        })
    }

    // Sort worlds
    cache = cache.sort((a, b) => {
        const sortfavRatio = b.favRatio - a.favRatio; if (sortfavRatio !== 0) { return sortfavRatio }
        const sortcapacity = b.capacity - a.capacity; if (sortcapacity !== 0) { return sortcapacity }
        return a.size - b.size
    })

    // Format string
    for (const item in cache) {
        let fileSize = await formatBytes(cache[item].size)
        stringbuilder.length == 0 ?
            stringbuilder += `- ❤️ ${cache[item].favRatio}%  ⚖️ ${cache[item].capacity}  📊 ${fileSize} - [${cache[item].name}](<https://vrchat.com/home/world/${cache[item].id}>)`
            : stringbuilder += `\n- ❤️ ${cache[item].favRatio}%  ⚖️ ${cache[item].capacity}  📊 ${fileSize} - [${cache[item].name}](<https://vrchat.com/home/world/${cache[item].id}>)`
    }
    fs.writeFile('./output.txt', stringbuilder, 'utf8', (err) => { if (err) { console.log(err) } })
    console.log(stringbuilder)
}

async function getMutualFriends(vrcuserid) {
    return new Promise(async (resolve, reject) => {
        let { data: auth } = await vrchat.verifyAuthToken()
        auth.ok == true ? console.log(auth.token) : console.log(`Couldn't return authcookie for whatever reason..`)
        const vrcapihttp = `https://api.vrchat.cloud/api/1/`
        // const vrcuserid = `usr_469ba82d-a0eb-4938-b199-e773af70c8f9`
        const vrcapiEndpoint = `users/${vrcuserid}/mutuals/friends`

        var getReq = {
            method: 'GET',
            headers: { 'User-Agent': '14anthony7095/Curl', 'Cookie': 'auth=' + auth.token }
        }

        var request = await fetch(vrcapihttp + '' + vrcapiEndpoint, getReq)
        var data = await request.json()
        // console.log(data)
        resolve(data)
    })
}

async function getDownloadSize(I_download_url) {
    return new Promise(async (resolve, reject) => {

        var getReq = {
            method: 'HEAD',
            headers: { 'User-Agent': 'NodeJS/22.14.0 fetch/14anthony7095', 'Cookie': 'auth=' + auth.token }
        }

        var request = await fetch(I_download_url, getReq)
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

