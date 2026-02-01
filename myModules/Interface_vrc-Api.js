/*
-------------------------------------

    VRChat API Requests

-------------------------------------
*/
// Libraries
const { loglv } = require("./config.js");
const { killvrc, killprep } = require('./sys_taskKill.js');
const { undiscoveredEvent,
    groupMemberJoinAdded,
    groupMemberJoin,
    groupMemberLeave,
    groupMemberRemove,
    groupMemberUserUpdate,
    groupMemberRoleAssign,
    groupMemberRoleUnassign,
    groupPostCreate,
    groupPostUpdate,
    groupPostDelete,
    groupRoleCreate,
    groupRoleDelete,
    groupRequestCreate,
    groupRequestReject,
    groupInstanceCreate,
    groupInstanceClose,
    groupInstanceWarn,
    groupInstanceKick,
    groupInviteCreate,
    groupInviteCancel,
    groupUserBan,
    groupUserUnban,
    groupUpdate } = require('./interace_WebHook.js')
const fs = require('fs');
const { cmdEmitter } = require('./input.js');
const { oscEmitter, oscChatBox, oscSend, oscChatBoxV2 } = require('./Interface_osc_v1.js');
const say = require('say')
const { logEmitter, getPlayersInInstance, getPlayersInstanceObject, getCurrentAccountInUse, fetchLogFile, getInstanceGroupID, getSelfLocation } = require('./Interface_vrc-Log.js');
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { WebSocket } = require("ws");
require('dotenv').config({ 'quiet': true })
const { EventEmitter, once } = require('events');
const apiEmitter = new EventEmitter();
exports.apiEmitter = apiEmitter;

let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
let selflogWS = `\x1b[0m[\x1b[33mVRC_WebSocket\x1b[0m]`
console.log(`${loglv().log}${selflog} Loaded`)

var vrchat = new VRChat({
    application: {
        name: "Api-Osc-Interface",
        version: "1.2",
        contact: process.env["CONTACT_EMAIL"]
    },
    authentication: {
        credentials: {
            username: process.env["VRC_ACC_LOGIN_1"],
            password: process.env["VRC_ACC_PASSWORD_1"],
            totpSecret: process.env["VRC_ACC_TOTPSECRET_1"]
        }
    }
    // ,keyv: new KeyvFile({ filename: "./datasets/vrcA.json" })
    /* 
        1   95
        2   96
        3   97
        4   98 / 69
        5   Wonder
        6   WatchDog
        7   Absent
    */
});



// Global Vars
var avatarsToCycleThrough = []
var instancesFound = []
var vrcDataCache = {}
var vrcIsOpen = false
exports.vrcIsOpen = vrcIsOpen
var lastFetchGroupLogs;
var currentUser;
var authcookie;
var userAutoAcceptWhiteList = []
var worldQueueTxt = './datasets/worldQueue.txt'
var exploreMode = false
var explorePrivacyLevel = 0
fs.readFile('./lastFetchGroupLogs.txt', 'utf8', (err, data) => {
    if (err) { console.log(err); return }
    console.log(`${loglv().debug}${selflog} set last log fetch to ${data}`)
    if (!data.includes(`Z`)) {
        lastFetchGroupLogs = new Date().toISOString()
    } else {
        lastFetchGroupLogs = data
    }
    setTimeout(() => {
        main()
    }, 1000)
})
fs.readFile('./datasets/autoAcceptWhitelist.txt', 'utf8', (err, data) => {
    if (err) { console.log(err); return }
    userAutoAcceptWhiteList = data.split('\r\n')
})

cmdEmitter.on('cmd', (cmd, args) => {
    if (cmd == 'help') {
        console.log(`${selflog}
-   api requestall
-   lunarhowl scan
-   rep scan
-   years open
-   years close
`)
    }
    if (cmd == 'api' && args[0] == 'requestall') { requestAllOnlineFriends(currentUser) }
    if (cmd == 'rep' && args[0] == 'scan') { getGroupRepsForInstance() }
    if (cmd == 'years' && args[0] == 'close') { switchYearGroupsClosed() }
    if (cmd == 'years' && args[0] == 'open') { switchYearGroupsReOpen() }
    if (cmd == 'preload') { worldAutoPreloadQueue(args[0].split(',')) }
})

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, time)
    })
}

oscEmitter.on('osc', (address, value) => {
    if (address == `/avatar/parameters/api/explore/start` && value == true) {
        getOnlineWorlds('worlds1', false)
    }
    if (address == `/avatar/parameters/api/explore/next` && value == true) {
        if (exploreMode == true) {
            clearTimeout(exploreNextCountDownTimer)
            inviteOnlineWorlds_Loop(worldsToExplore[0]);
        } else if (exploreMode == false) {
            inviteLocalQueue()
        }
    }
    if (address == `/avatar/parameters/api/explore/stop` && value == true) {
        apiEmitter.emit('switch', 0, 'world')
        if (exploreMode == true) {
            console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - Avatar Trigger`)
            exploreMode = false
        } else if (exploreMode == false) {
            // switchQueueList() // All the lists are merged.. soo.. rip
        }
    }
    if (address == `/avatar/parameters/api/explore/prefill` && value == true) {
        // addLabWorldsToQueue()
        addLabWorldsToLocalQueue()
    }
    if (address == `/avatar/parameters/api/explore/privacy` && value == 0) { explorePrivacyLevel = 0 }
    if (address == `/avatar/parameters/api/explore/privacy` && value == 1) { explorePrivacyLevel = 1 }
    if (address == `/avatar/parameters/api/explore/privacy` && value == 2) { explorePrivacyLevel = 2 }
    if (address == `/avatar/parameters/api/explore/privacy` && value == 3) { explorePrivacyLevel = 3 }


    if (address == `/avatar/parameters/api/requestall` && value == true) {
        requestAllOnlineFriends(currentUser)
    }
})



logEmitter.on('moviename', (output) => {
    setUserStatus(`Watching ${output}`)
    oscChatBox(`~MovieTitle:\v` + output, 5)
})
logEmitter.on('setstatus', (output) => {
    setUserStatus(output)
})
logEmitter.on('nextworld', (output) => {
    if (exploreMode == false) {
        inviteLocalQueue(output)
    }
})
logEmitter.on('scanPlayerStatus4Ban', async (outputNAME) => {
    let usercheck = await vrchat.searchUsers({ 'query': { 'search': outputNAME } })
    if (usercheck.data[0].status == 'busy' || usercheck.data[0].status == 'ask me') {
        console.log(`${loglv().log}${selflog} ${outputNAME} is on ${usercheck.data[0].status == 'ask me' ? '🟠' : '🔴'} Status, Banning`)
        say.speak(`User ${outputNAME} is on a gated status, kick from instance`, 'Microsoft Zira Desktop', 1.0)
        await vrchat.banGroupMember({
            'path': { 'groupId': 'grp_cacf2dd8-8958-4412-be78-dedd798e6df4' },
            'body': { 'userId': usercheck.data[0].id }
        })
    }
})
logEmitter.on('stopworld', (output) => {
    if (exploreMode == true) {
        console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - Quit VRChat`)
        setUserStatus('')
        apiEmitter.emit('switch', 0, 'world')
        exploreMode = false
    }
})

var authToken = null
async function main() {
    console.log(`${loglv().debug}${selflog} start main function`)
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);
    const { data: auth } = await vrchat.verifyAuthToken()
    if (auth.ok == true) {
        authToken = auth.token
        // console.log(authToken)
        socket_VRC_API_Connect()
        // sendBoop('usr_e86f244d-31ba-4d25-9f82-65b91bf21aee', 'inv_eb8fed52-3198-43d7-bea4-ed2f2c02f9e6')
        // await getAllInventory(0)
    }
}


async function worldAutoPreloadQueue(worldList = []) {
    console.log(`${loglv().log}${selflog} [Auto World Preload] Starting, have ${worldList.length} worlds to go through`)
    for (const wrd in worldList) {
        await joinWorld(worldList[wrd])
        if (wrd == worldList.length - 1) {
            console.log(`${loglv().hey}${selflog} [Auto World Preload] Finished, can close VRC if want.`)
            oscChatBoxV2(`Automatic Preload has finished \v Can close VRC if want.`, 30)
        }
    }
    async function joinWorld(world) {
        return new Promise((resolve, reject) => {
            console.log(`${loglv().hey}${selflog} [Auto World Preload] Creating Preload Instance for ${world}`)
            vrchat.createInstance({
                body: {
                    'worldId': world,
                    'type': 'hidden',
                    'region': 'use',
                    'displayName': 'PreVisit Check',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752'
                }
            }).then(created_instance => {
                startvrc(created_instance.data.location, true)
            }).catch((err) => {
                console.log(`${loglv().warn}${selflog}` + err)
            })
            once(logEmitter, 'joinedworld').then((worldId) => {
                if (world == worldId) {
                    setTimeout(() => {
                        resolve(true);
                    }, 10000)
                }
            })
        })
    }
}


var socket_VRC_API
var cacheWS = {}
function socket_VRC_API_Connect() {
    if (authToken == null) { console.log('No AuthToken stored'); return }
    socket_VRC_API = new WebSocket(`wss://pipeline.vrchat.cloud/?authToken=` + authToken, { headers: { "cookie": `auth=${authToken}`, "user-agent": 'API-OSC-Interface/14anthony7095 v3' } })
    socket_VRC_API.on('error', (data) => {
        console.log(`${loglv().warn}${selflogWS}`)
        console.log(data)
    })
    socket_VRC_API.on('close', (code, reason) => {
        console.log(`${loglv().warn}${selflogWS} ${code} ${Buffer.from(reason, 'utf8')}`)
        setTimeout(() => {
            socket_VRC_API_Connect()
        }, 120_000)
    })

    socket_VRC_API.on('message', async (data) => {
        var line = Buffer.from(data, 'utf8')

        var wsContent
        try { wsContent = JSON.parse(JSON.parse(line).content) }
        catch (error) { wsContent = JSON.parse(line).content }

        switch (JSON.parse(line).type) {
            case 'notification':
                if (wsContent.type == 'requestInvite') {
                    console.log(`${loglv().log}${selflogWS} [InviteRequest] ${wsContent.senderUsername} has Requested an Invite.${userAutoAcceptWhiteList.includes(wsContent.senderUsername) == true ? ' (✅ Whitelisted )' : ''}`);

                    if (userAutoAcceptWhiteList.includes(wsContent.senderUsername)) {
                        // Requester is Whitelisted
                        let instanceId = getSelfLocation()
                        if (instanceId == undefined || instanceId == '') {
                            let res = await vrchat.getCurrentUser()
                            if (res.data.presence.world != 'offline') {
                                await vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': res.data.presence.world + ":" + res.data.presence.instance, 'messageSlot': 0 } })
                            } else {
                                await vrchat.respondInvite({ 'body': { 'responseSlot': 0 }, 'path': { 'notificationId': wsContent.id } })
                            }
                        } else {
                            await vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': instanceId, 'messageSlot': 0 } })
                        }
                    }
                } else {
                    console.log(`${loglv().log}${selflogWS} [InviteRequest]`);
                    console.log(wsContent);
                }
                break;

            // case 'response-notification': break;
            // case 'see-notification': break;
            // case 'hide-notification': break;
            // case 'clear-notification': break;
            case 'notification-v2':
                if (wsContent.type == 'boop') {
                    console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}] ${wsContent.message} ${JSON.stringify(wsContent.details)}`)

                } else {
                    console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}]`); console.log(wsContent);
                }
                break;

            // case 'notification-v2-update': break;
            // case 'notification-v2-delete': break;
            // case 'content-refresh': break;
            // case 'modified-image-update': break;
            // case 'instance-queue-joined': break;
            // case 'instance-queue-ready': break;
            // case 'group-joined': break;
            // case 'group-left': break;
            // case 'group-member-updated': break;
            // case 'group-role-updated': break;
            // case 'friend-add': break;
            // case 'friend-delete': break;
            case 'friend-online':
                console.log(`${loglv().log}${selflogWS} [GPS] ${wsContent.user.displayName} - Now Online`);
                break;

            case 'friend-offline':
                let notif_user_displayName = 'unknown'
                if ((cacheWS[wsContent.userId] || "").displayName) {
                    notif_user_displayName = cacheWS[wsContent.userId].displayName
                    console.log(`${loglv().log}${selflogWS} [GPS] ${notif_user_displayName} - Offline`);
                } else {
                    notif_user_displayName = await vrchat.getUser({ 'path': { 'userId': wsContent.userId } })
                    console.log(`${loglv().log}${selflogWS} [GPS] ${notif_user_displayName.data.displayName} - Offline`);
                }
                break;

            case 'friend-active':
                console.log(`${loglv().log}${selflogWS} [GPS] ${wsContent.user.displayName} - Active on Web`);
                break;

            case 'friend-update':
                break;
                let notif_user_changes = ''
                let notif_user_status = ''
                if (wsContent.user.status == 'join me') { notif_user_status = '🔵' }
                if (wsContent.user.status == 'active') { notif_user_status = '🟢' }
                if (wsContent.user.status == 'ask me') { notif_user_status = '🟠' }
                if (wsContent.user.status == 'busy') { notif_user_status = '🔴' }

                if (cacheWS[wsContent.userId]) {
                    Object.keys(cacheWS[wsContent.userId]).forEach(async key => {
                        if (cacheWS[wsContent.userId][key] != wsContent.user[key]) {

                            if (key == 'status') {
                                let notif_user_status_old = ''
                                if (cacheWS[wsContent.userId].status == 'join me') { notif_user_status_old = '🔵' }
                                if (cacheWS[wsContent.userId].status == 'active') { notif_user_status_old = '🟢' }
                                if (cacheWS[wsContent.userId].status == 'ask me') { notif_user_status_old = '🟠' }
                                if (cacheWS[wsContent.userId].status == 'busy') { notif_user_status_old = '🔴' }

                                notif_user_changes += `\n${loglv().log}    ${key}: ${notif_user_status_old} -> ${notif_user_status}`
                            } else {
                                let notif_user_status_old = ''
                                if (cacheWS[wsContent.userId].status == 'join me') { notif_user_status_old = '🔵' }
                                if (cacheWS[wsContent.userId].status == 'active') { notif_user_status_old = '🟢' }
                                if (cacheWS[wsContent.userId].status == 'ask me') { notif_user_status_old = '🟠' }
                                if (cacheWS[wsContent.userId].status == 'busy') { notif_user_status_old = '🔴' }

                                notif_user_changes += `\n${loglv().log}    ${key}: "${cacheWS[wsContent.userId][key]}" -> "${wsContent.user[key]}"`
                            }
                        }
                    })
                    console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}] ${wsContent.user.displayName} ${notif_user_status} ${notif_user_changes != '' ? notif_user_changes : ''}`);
                } else {
                    console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}] ${wsContent.user.displayName} ${notif_user_status} ${wsContent.user.statusDescription}`);
                }

                cacheWS[wsContent.userId] = {
                    "ageVerificationStatus": wsContent.user.ageVerificationStatus,
                    "ageVerified": wsContent.user.ageVerified,
                    "allowAvatarCopying": wsContent.user.allowAvatarCopying,
                    "bio": wsContent.user.bio,
                    "displayName": wsContent.user.displayName,
                    "last_platform": wsContent.user.last_platform,
                    "platform": wsContent.user.platform,
                    "pronouns": wsContent.user.pronouns,
                    "state": wsContent.user.state,
                    "status": wsContent.user.status,
                    "statusDescription": wsContent.user.statusDescription,
                    "userIcon": wsContent.user.userIcon
                }
            // break;

            case 'friend-location':
                break;
                let notif_user_location = wsContent.location != '' ? wsContent.location : wsContent.travelingTolocation != '' ? wsContent.travelingTolocation : 'private'
                console.log(`${loglv().log}${selflogWS} [GPS] ${wsContent.user.displayName} - ${notif_user_location}`);
            // break;

            case 'user-update': break;
            case 'user-location': break;
            case 'user-badge-assigned':
                console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}] ${wsContent.badge.badgeName}`);
                break;
            case 'user-badge-unassigned':
                console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}] ${JSON.stringify(wsContent)}`);
                break;

            default:
                console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}]`);
                console.log(wsContent);
                break;
        }
    });
}

/* async function getHolidayEventTopGifter() {
    return new Promise(async (resolve, reject) => {
        if (authToken == null) { reject('No AuthToken stored'); return }

        const vrcapihttp = `https://api.vrchat.cloud/api/1/`

        var res = await fetch(vrcapihttp + "special-event/holiday-2025/leaderboard/global", {
            method: 'GET',
            headers: { 'User-Agent': '14anthony7095/Api-Osc-Interface', 'Cookie': 'auth=' + authToken, }
        })
        var data = await res.json()

        resolve({
            "name": data[0].displayName,
            "gifts": data[0].giftCount
        })
    })
} */

async function getAllInventory(offset) {
    return new Promise(async (resolve, reject) => {
        let gotinv = await vrchat.getInventory({ 'query': { 'n': 100, 'offset': offset * 100, 'types': 'emoji' } })
        if (gotinv.data.data.length == 100) {
            setTimeout(() => {
                getAllInventory(offset + 1)
            }, 2000)
        } else {
            resolve()
        }

        gotinv.data.data.forEach((invitem, index) => {
            // console.log(`${invitem.name} - [${invitem.id}] - "${invitem.imageUrl}"`)
            if (!vrcDataCache.inventory) {
                vrcDataCache.inventory = {
                    'emoji': [{
                        'name': invitem.name,
                        'id': invitem.id,
                        'imageUrl': invitem.imageUrl,
                        'animated': invitem.metadata.animated,
                        'animationStyle': invitem.metadata.animationStyle,
                        'imageUrl': invitem.metadata.imageUrl
                    }]
                }
            } else {
                vrcDataCache.inventory.emoji.push({
                    'name': invitem.name,
                    'id': invitem.id,
                    'imageUrl': invitem.imageUrl,
                    'animated': invitem.metadata.animated,
                    'animationStyle': invitem.metadata.animationStyle,
                    'imageUrl': invitem.metadata.imageUrl
                })
            }
        })
    })
}

async function sendBoop(userId_input, inventoryItemId_input) {
    return new Promise(async (resolve, reject) => {
        if (authToken == null) { reject('No AuthToken stored'); return }

        const vrcapihttp = `https://api.vrchat.cloud/api/1/`

        var res = await fetch(vrcapihttp + "users/" + userId_input + "/boop", {
            method: 'POST',
            headers: {
                'User-Agent': '14anthony7095/Api-Osc-Interface',
                'Cookie': 'auth=' + authToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'inventoryItemID': inventoryItemId_input
            })
        })
        var data = await res.json()
        if (data.error) {
            console.log(`${loglv().hey}${selflog} ${data.error.status_code == 403 ? `403 - ${data.error.message}` : data.error.status_code == 429 ? `429 - ${data.error.message}` : ''}`)
        } else {
            console.log(`${loglv().log}${selflog} ${data.success.message} - ${userId_input}`)
        }
    })
}

async function getIsUserInGroup(F_userid, F_groupid) {
    return new Promise(async (resolve, reject) => {
        let gug = await vrchat.getUserGroups({ 'path': { 'userId': F_userid } })
        if (gug.data.find(e => e.groupId == F_groupid) != undefined) {
            resolve(true)
        } else {
            resolve(false)
        }
    })
}



async function addLabWorldsToQueue() {
    console.log(`${loglv().log}${selflog} Compiling world list..`)
    let { data: fav1 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 0 } })
    let { data: fav2 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 100 } })
    let { data: fav3 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 200 } })
    let { data: fav4 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 300 } })
    let favworldsAll = fav1.concat(fav2, fav3, fav4)
    let favWorlds1 = favworldsAll.filter(favworldsAll => favworldsAll.favoriteGroup == 'worlds1')
    console.log(`${loglv().log}${selflog} ${favWorlds1.length} worlds to explore.`)

    if (100 - (favWorlds1.length) >= 1) {
        console.log(`${loglv().log}${selflog} Adding ${100 - (favWorlds1.length)} Community Labs worlds to queue`)
        let { data: worldData } = await vrchat.searchWorlds({ query: { n: 100 - (favWorlds1.length), sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } })
        worldData.forEach((w, index, arr) => {
            setTimeout(() => {
                console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
                vrchat.addFavorite({ body: { favoriteId: w.id, tags: 'worlds1', type: 'world' } })
            }, 5_000 * index)
        })
    }
}

async function addLabWorldsToLocalQueue() {
    console.log(`${loglv().log}${selflog} Adding 100 Community Labs worlds to queue`)
    let { data: worldData } = await vrchat.searchWorlds({ query: { n: 100, sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } })
    fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
        let localQueueList = data.split(`\r\n`)
        let lastInQueue = localQueueList[localQueueList.length - 2]
        // console.log(lastInQueue)

        let worldlist = ''
        let skipAdd = false
        worldData.forEach((w, index, arr) => {
            console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
            // console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
            lastInQueue == w.id ? skipAdd = true : ''
            index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
        })

        if (worldlist.includes(lastInQueue) || skipAdd == true) {
            console.log(`${loglv().hey}${selflog} Cancelled list appendage, Queue already contains part of latest batch`)
            oscChatBox(`Cancelled queue append:\v Queue already contains latest labs batch`)
        } else {
            fs.appendFile(worldQueueTxt, worldlist + `\r\n`, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
        }
    })
}

var worldsToExplore = []
async function getOnlineWorlds(favgroup = 'worlds1', addMoreWorlds = false) {
    if (worldsToExplore.length > 0) {
        console.log(`${loglv().hey}${selflog} Clearing previous world list..`)
        worldsToExplore = []
    }

    console.log(`${loglv().log}${selflog} Compiling world list..`)
    try {
        let { data: fav1 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: '_created_at', offset: 0 } })
        let { data: fav2 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: '_created_at', offset: 100 } })
        let { data: fav3 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: '_created_at', offset: 200 } })
        let { data: fav4 } = await vrchat.getFavoritedWorlds({ query: { n: 100, sort: '_created_at', offset: 300 } })
        let favworldsAll = fav1.concat(fav2, fav3, fav4)
        let favWorlds1 = favworldsAll.filter(favworldsAll => favworldsAll.favoriteGroup == favgroup)
        favWorlds1.forEach((wrld, index, arr) => { worldsToExplore.push(wrld.id) })
        let extimelow = Math.floor((favWorlds1.length * 2) / 60)
        let extimehig = Math.floor((favWorlds1.length * 10) / 60)
        console.log(`${loglv().log}${selflog} ${favWorlds1.length} worlds to explore. [${extimelow} to ${extimehig} Hours]`)

        if (100 - (favWorlds1.length) >= 1 && addMoreWorlds == true) {
            console.log(`${loglv().log}${selflog} Adding ${100 - (favWorlds1.length)} Community Labs worlds to queue`)
            let { data: worldData } = await vrchat.searchWorlds({ query: { n: 100 - (favWorlds1.length), sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } })
            worldData.forEach((w, index, arr) => {
                setTimeout(() => {
                    console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
                    vrchat.addFavorite({ body: { favoriteId: w.id, tags: 'worlds1', type: 'world' } })
                }, 5_000 * index)
            })
        }
    } catch (error) {
        console.log(`${loglv().warn}${selflog} ${error}`)
        oscChatBox(`~Could not fetch Favorited-Worlds data`)
    }

    console.log(`${loglv().hey}${selflog} Explore Mode: Enabled`)
    setUserStatus(`Exploring World Queue`)
    apiEmitter.emit('switch', worldsToExplore.length, 'world')
    exploreMode = true

    inviteOnlineWorlds_Loop(worldsToExplore[0])
}
var exploreNextCountDownTimer;
async function inviteOnlineWorlds_Loop(world_id) {
    let { data: checkCap } = await vrchat.getWorld({ 'path': { 'worldId': world_id } })
    if (checkCap == undefined) {
        console.log(`${loglv().hey}${selflog} World failed to fetch. Skipping`);
        oscChatBox(`~World fetch failed.\vSkipping.`, 5);
        fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
            if (data.includes(world_id)) {
                fs.writeFile(worldQueueTxt, data.replace(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
            }
        })
        worldsToExplore.shift()
        apiEmitter.emit('switch', worldsToExplore.length, 'world')
        if (worldsToExplore.length == 0) {
            console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - out of worlds`)
            apiEmitter.emit('switch', 0, 'population')
            exploreMode = false
        }
        if (exploreMode == true) { inviteOnlineWorlds_Loop(worldsToExplore[0]) }
        return
    } else if (checkCap.capacity < getPlayersInInstance().length && getInstanceGroupID() == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
        console.log(`${loglv().hey}${selflog} World can not fit everyone. Skipping`)
        oscChatBox(`~World can't fit everyone.\vSkipping.`, 5);
        worldsToExplore.shift()
        apiEmitter.emit('switch', worldsToExplore.length, 'world')
        if (worldsToExplore.length == 0) {
            console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - out of worlds`)
            apiEmitter.emit('switch', 0, 'population')
            exploreMode = false
        }
        exploreNextCountDownTimer = setTimeout(() => {
            if (exploreMode == true) { inviteOnlineWorlds_Loop(worldsToExplore[0]) }
        }, 600_000)
    } else {
        var instanceBody = {}
        switch (explorePrivacyLevel) {
            case 0:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'group',
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
                    'groupAccessType': 'public',
                    'queueEnabled': true,
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
            case 1:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'group',
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
                    'groupAccessType': 'plus',
                    'queueEnabled': true,
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
            case 2:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'private',
                    'canRequestInvite': true,
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752',
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
            default:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'hidden',
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752',
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
        }

        console.log(`${loglv().hey}${selflog} Creating group instance for ${world_id}`)
        vrchat.createInstance({
            body: instanceBody
        }).then(created_instance => {
            // `&shortName=${created_instance.data.secureName}`
            startvrc(created_instance.data.location, false)
            console.log(`${loglv().log}${selflog} Auto-Close set for ${created_instance.data.closedAt}.`)
            worldsToExplore.shift()
            apiEmitter.emit('switch', worldsToExplore.length, 'world')
            if (worldsToExplore.length == 0) {
                console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - out of worlds`)
                exploreMode = false
                apiEmitter.emit('switch', 0, 'population')
            }
            exploreNextCountDownTimer = setTimeout(() => {
                if (exploreMode == true) { inviteOnlineWorlds_Loop(worldsToExplore[0]) }
            }, 600_000)
        }).catch((err) => {
            console.log(`${loglv().warn}${selflog}` + err)
        })
    }
}

function inviteLocalQueue(I_autoNext = false) {
    fs.readFile(worldQueueTxt, 'utf8', async (err, data) => {
        // err ? console.log(err); return : ''
        let localQueueList = data.split('===')[0].split(`\r\n`)
        let randnum = Math.round(Math.random() * (localQueueList.length - 1))
        let world_id = localQueueList[randnum]

        let extimelow = Math.floor((localQueueList.length * 2) / 60)
        let extimehig = Math.floor((localQueueList.length * 10) / 60)
        console.log(`${loglv().log}${selflog} ${localQueueList.length} worlds to explore. [${extimelow} to ${extimehig} Hours]`)
        // oscChatBox(`${localQueueList.length} worlds remaining in Queue.\vEstimated explore time:\v${extimelow} - ${extimehig} Hours`)
        apiEmitter.emit('switch', localQueueList.length, 'world')

        let { data: checkCap } = await vrchat.getWorld({ 'path': { 'worldId': world_id } })
        if (checkCap == undefined) {
            console.log(`${loglv().hey}${selflog} World failed to fetch. Try again..`);
            oscChatBox(`World fetch failed.\vTry another.`, 5);
            fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
                if (data.includes(world_id)) {
                    fs.writeFile(worldQueueTxt, data.replace(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
                }
            })
            return
        } else if (checkCap.capacity < getPlayersInInstance().length && getInstanceGroupID() == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
            console.log(`${loglv().hey}${selflog} World can not fit everyone. Retry..`);
            oscChatBox(`World can't fit everyone.\vTry again.`, 5);
            return
        }

        var instanceBody = {}
        switch (explorePrivacyLevel) {
            case 0:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'group',
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
                    'groupAccessType': 'public',
                    'queueEnabled': true,
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
            case 1:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'group',
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
                    'groupAccessType': 'plus',
                    'queueEnabled': true,
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
            case 2:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'private',
                    'canRequestInvite': true,
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752',
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
            default:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'hidden',
                    'region': 'use',
                    'displayName': 'World Hop',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752',
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
        }

        console.log(`${loglv().hey}${selflog} Creating group instance for ${world_id}`)
        vrchat.createInstance({
            body: instanceBody
        }).then(created_instance => {
            startvrc(created_instance.data.location, I_autoNext)
            apiEmitter.emit('switch', localQueueList.length, 'world')
            console.log(`${loglv().log}${selflog} Auto-Close set for ${created_instance.data.closedAt}.`)
        }).catch(err => {
            oscChatBox(`instance create failed.\vTry another.`, 5)
            console.log(`${loglv().warn}${selflog}` + err)
            fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
                // err ? console.log(err); return : ''
                if (data.includes(world_id)) {
                    fs.writeFile(worldQueueTxt, data.replace(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
                }
            })
        })

    })
}


var lastSetUserStatus = ''
function setUserStatus(status) {
    // console.log(`${loglv().hey}${selflog} Status Update Cancelled`);return
    if (status.slice(0, 32) !== lastSetUserStatus) {
        vrchat.updateUser({ path: { userId: process.env["VRC_ACC_ID_1"] }, body: { statusDescription: status.slice(0, 32) } })
        console.log(`${loglv().hey}${selflog} Status Updated: ${status.slice(0, 32)}`)
        lastSetUserStatus = status.slice(0, 32)
    }
}

var highestCount = 0
fs.readFile('./datasets/vrcMaxPop.txt', 'utf-8', (err, data) => { highestCount = data })
function getVisitsCount() {
    return new Promise(async (resolve, reject) => {
        let { data: visitsCount } = await vrchat.getCurrentOnlineUsers()
        resolve(visitsCount == undefined ? 0 : visitsCount)

        if (visitsCount > highestCount) {
            highestCount = visitsCount
            console.log(`${loglv().hey}\x1b[0m[\x1b[36mCounter\x1b[0m] New Highest Population reached: ${visitsCount}`)
            fs.writeFile('./datasets/vrcMaxPop.txt', visitsCount.toString(), 'utf-8', (err) => { if (err) { console.log(err) } })
        }
    })
}
exports.getVisitsCount = getVisitsCount;

const { default: open } = require('open');
async function startvrc(vrclocation, autoGo = false, openToHome = false) {
    // vrcIsOpen = true
    if (openToHome == true) {
        require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr`)
    } else {
        await open(`vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=1`)
        if (autoGo == true) {
            setTimeout(() => {
                require('child_process').execSync(`"C:\\Users\\14Anthony7095\\Documents\\14aOSC-API-Log\\bin\\vrcPressGoOnWorldPage.exe"`)
            }, 2000);
        }
    }
    // await open(`vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=${parseInt(direct)}`, {arguments: ['--no-vr']})
    // require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr --profile=${profileIndex} "vrchat://launch/?ref=14aOSCAPI.app&id=${vrclocation}&attach=${parseInt(direct)}"`)
    // direct == false ? fetchLogFile() : ''
}
exports.startvrc = startvrc;


var tenMinuteTick = 0
console.log(`${loglv().hey}${selflog} First Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
setTimeout(() => {
    scanGroupAuditLogs()
}, 600_000)


async function scanGroupAuditLogs() {
    console.log(`${loglv().log}${selflog} Scanning through audit logs.`)

    // var targetGroupLogID_NHI = 'grp_3473d54b-8e10-4752-9548-d77a092051a4' // Nanachi's Hollow Inn
    var targetGroupLogID_14aHop = 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce' // 14aHop
    // var targetGroupLogID_14aClone = 'grp_b7f14d28-d1cb-4441-8c1a-3632675293ec' // 14aClone
    var targetGroupLogID_WEFURS = 'grp_cdb7c49d-9a90-4b17-8137-ff17bc624c6c' // WEFURS

    var targetGroupLogID_1year = 'grp_4f5d0456-4200-4b2c-8331-78856d1869e4' // Years of VRC Service - START
    var targetGroupLogID_2year = 'grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233'
    var targetGroupLogID_3year = 'grp_378c0550-07a1-4cab-aa45-65ad4a817117'
    var targetGroupLogID_4year = 'grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8'
    var targetGroupLogID_5year = 'grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4'
    var targetGroupLogID_6year = 'grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675'
    var targetGroupLogID_7year = 'grp_5eb28410-68df-4609-b0c5-bc98cf754264'
    var targetGroupLogID_8year = 'grp_18aa4b68-9118-4716-9a39-42413e54db8c'
    var targetGroupLogID_9year = 'grp_768a2c3d-b22c-48d2-aae1-650483c347ea'
    var targetGroupLogID_10year = 'grp_243d9742-ce05-4fc3-b399-cd436528c432'  // Years of VRC Service - END


    // const { data: logOutput_NHI } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_NHI }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_14aHop } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aHop }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    // const { data: logOutput_14aClone } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aClone }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_WEFURS } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_WEFURS }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })

    const { data: logOutput_1year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_1year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_2year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_2year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_3year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_3year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_4year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_4year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_5year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_5year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_6year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_6year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_7year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_7year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_8year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_8year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_9year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_9year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
    const { data: logOutput_10year } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_10year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })

    lastFetchGroupLogs = new Date().toISOString()
    fs.writeFile('./lastFetchGroupLogs.txt', lastFetchGroupLogs, (err) => { if (err) { console.log(err) } })


    // await scanaudit(logOutput_NHI, targetGroupLogID_NHI);
    await scanaudit(logOutput_14aHop, targetGroupLogID_14aHop);
    // await scanaudit(logOutput_14aClone, targetGroupLogID_14aClone);
    await scanaudit(logOutput_WEFURS, targetGroupLogID_WEFURS);

    await scanaudit(logOutput_1year, targetGroupLogID_1year);
    await scanaudit(logOutput_2year, targetGroupLogID_2year);
    await scanaudit(logOutput_3year, targetGroupLogID_3year);
    await scanaudit(logOutput_4year, targetGroupLogID_4year);
    await scanaudit(logOutput_5year, targetGroupLogID_5year);
    await scanaudit(logOutput_6year, targetGroupLogID_6year);
    await scanaudit(logOutput_7year, targetGroupLogID_7year);
    await scanaudit(logOutput_8year, targetGroupLogID_8year);
    await scanaudit(logOutput_9year, targetGroupLogID_9year);
    await scanaudit(logOutput_10year, targetGroupLogID_10year);

    if (tenMinuteTick == 6) {
        await updateBioWorldQueue()
    }

    // Updating friend Whitelist
    fs.readFile('./datasets/autoAcceptWhitelist.txt', 'utf8', (err, data) => {
        if (err) { console.log(err); return }
        userAutoAcceptWhiteList = data.split('\r\n')
    })


    console.log(`${loglv().hey}${selflog} Next Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
    setTimeout(() => {
        scanGroupAuditLogs()
        tenMinuteTick >= 6 ? tenMinuteTick = 0 : tenMinuteTick++
    }, 600_000)
}

async function requestAllOnlineFriends() {
    var { data: onlineFriends } = await vrchat.getFriends({ query: { offset: 0, n: 100, offline: false } })
    var privateFriends = onlineFriends.filter(onlineFriends => onlineFriends.location == 'private')
    var privateFriendsNotHere = privateFriends.filter(privateFriends => getPlayersInInstance().includes(privateFriends.displayName) == false)
    privateFriendsNotHere.forEach((friend, index, friendArr) => {
        setTimeout(() => {
            console.log(`${loglv().log}${selflog} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Checking ${friend.displayName}`)
            if (['active', 'join me', 'ask me'].includes(friend.status)) {
                console.log(`${loglv().log}${selflog} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is in Private`)

                // - No Not Request blacklist -
                if ([`usr_39a91182-0df7-476e-bc4a-e5d709cca692`, // ghost
                    `usr_49590946-943b-4835-ba7e-2e370b596b4d`, // Samoi
                    `usr_060e1976-dfda-44b0-8f71-fa911d8bf580`, // luna-the-bunny
                    `usr_bba4ca7a-5447-4672-828d-0a09d85f854e`, // melting
                    `usr_ee815921-8067-4486-a3e2-ded009457cf3` // turtlesnack
                ].includes(friend.id)) {
                    console.log(`${loglv().log}${selflog} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is on Do-Not-Request Blacklist`)
                } else if (friend.statusDescription.toLowerCase().includes('busy')) {
                    console.log(`${loglv().log}${selflog} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} has "Busy" in status`)
                } else {
                    vrchat.requestInvite({ path: { userId: friend.id }, body: { requestSlot: 1 } }).then((send_invite) => {
                        console.log(`${loglv().log}${selflog} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Request Sent to ${friend.displayName} - "${send_invite.data.message}"`)
                    }).catch((err) => console.log(err))
                }
            } else if (friend.status == 'busy') {
                console.log(`${loglv().log}${selflog} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is Busy`)
            }
            if (index + 1 == friendArr.length) {
                console.log(`${loglv().log}${selflog} [BulkFrendRequestInviter] Done Requesting`)
            }
        }, (2_000 * index) + Math.random())
    })
}


logEmitter.on('propNameRequest', async (propID, vrcpropcount) => {
    // console.log(`${loglv().debug}${selflog} ${propID} for ${vrcpropcount}`)
    let res = await vrchat.getProp({ 'path': { 'propId': 'prop_' + propID } })
    // console.log(`${loglv().debug}${selflog} ${res.data}`)
    if (res.data != undefined) {
        if (!vrcpropcount[propID]) {
            vrcpropcount[propID] = { "name": "", "count": 0 }
        }
        vrcpropcount[propID].name = res.data.name
        vrcpropcount[propID].count = 1
        console.log(`${loglv().hey}${selflog} Added ${vrcpropcount[propID].name} to the Items list`)
        fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => { if (err) { console.log(err); return } })
    }
})
logEmitter.on('headingToWorld', async (I_worldID) => {
    let res = await vrchat.getWorld({ 'path': { 'worldId': I_worldID } })
    apiEmitter.emit('fetchedDistThumbnail', res.data.imageUrl, res.data.name.slice(0, 50))
})

async function switchYearGroupsClosed() {
    return new Promise(async (resolve, reject) => {

        const FC_yearGroups = [`grp_4f5d0456-4200-4b2c-8331-78856d1869e4`,
            `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c33`,
            `grp_378c0550-07a1-4cab-aa45-65ad4a817117`,
            `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`,
            `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`,
            `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`,
            `grp_5eb28410-68df-4609-b0c5-bc98cf754264`,
            `grp_18aa4b68-9118-4716-9a39-42413e54db8c`,
            `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`,
            `grp_243d9742-ce05-4fc3-b399-cd436528c432`
        ]

        for (const item in FC_yearGroups) {
            console.log(`${loglv().hey}${selflog} Closing Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
            await vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'request' } })
            await sleep(10000)
        }

        resolve(true)

    })
}
async function switchYearGroupsReOpen() {
    return new Promise(async (resolve, reject) => {

        const FC_yearGroups = [`grp_4f5d0456-4200-4b2c-8331-78856d1869e4`,
            `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c33`,
            `grp_378c0550-07a1-4cab-aa45-65ad4a817117`,
            `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`,
            `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`,
            `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`,
            `grp_5eb28410-68df-4609-b0c5-bc98cf754264`,
            `grp_18aa4b68-9118-4716-9a39-42413e54db8c`,
            `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`,
            `grp_243d9742-ce05-4fc3-b399-cd436528c432`
        ]

        for (const item in FC_yearGroups) {
            console.log(`${loglv().hey}${selflog} Opening Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
            await vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'open' } })
            await sleep(10000)
        }

        resolve(true)

    })
}

async function updateBioWorldQueue() {
    return new Promise((resolve) => {
        fs.readFile(worldQueueTxt, 'utf8', async (err, dataw) => {
            let localQueueList = dataw.split('===')[0].split(`\r\n`)
            console.log(`${loglv().hey}${selflog} Preping Bio for world queue update`)
            if (localQueueList.length != 0) {
                console.log(`${loglv().log}${selflog} Fetching current Bio`)
                let { data: mybio } = await vrchat.getUser({ 'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' } })

                if (mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/) != null) {
                    if (parseInt(mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]) != localQueueList.length) {
                        console.log(`${loglv().log}${selflog} Updating Bio queue count: ${mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]} -> ${localQueueList.length}`)
                        // console.log(`${loglv().debug}${selflog} ${mybio.bio}`)
                        let mybioUpdated = mybio.bio.replace(/Worlds in queue[:˸] \d{1,4}/, 'Worlds in queue: ' + localQueueList.length)
                        await vrchat.updateUser({
                            'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' },
                            'body': { 'bio': mybioUpdated }
                        })

                        // console.log(`${loglv().debug}${selflog} ${mybioUpdated}`)
                        setTimeout(() => { resolve(true) }, 2000)
                    } else {
                        console.log(`${loglv().log}${selflog} Bio already contains current queue count`)
                        setTimeout(() => { resolve(true) }, 2000)
                    }
                }
            } else {
                console.log(`${loglv().log}${selflog} world queue empty, Skiping`)
                setTimeout(() => { resolve(true) }, 2000)
            }
        })
    })
}

function scanaudit(logoutput, groupID) {
    // console.log(`${loglv().log}${selflog} Scanning through audit log for group ${groupID}`)
    return new Promise((resolve, reject) => {
        if (logoutput == undefined) {
            resolve(false)
        } else if (logoutput.results.length == 0) {
            setTimeout(() => {
                resolve(true)
                // console.log(`${loglv().log}${selflog} Audit Log was Empty for ${groupID}`)
            }, 2_000)
        }
        logoutput.results.forEach(async (l, index, arr) => {
            setTimeout(async () => {
                // var fetchedData = {
                //     "actorHookImage": '',
                //     "locationWorldID": '',
                //     "locationName": '',
                //     "locationImageURL": '',
                //     "locationID": '',
                //     "locationType": '',
                //     "locationRegion": '',
                //     "postAuthorName": 'unknown',
                //     "postImage": 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96',
                //     "userPlatform": '',
                //     "userJoinDate": '',
                //     "userAgeVerified": '',
                //     "userTrust": '',
                //     "targetUserPlatform": '',
                //     "targetUserJoinDate": '',
                //     "targetUserAgeVerified": '',
                //     "targetUserTrust": ''
                // }
                var actorHookImage = ''
                var locationWorldID = ''
                var locationName = ''
                var locationImageURL = ''
                var locationID = ''
                var locationType = ''
                var locationRegion = ''
                var postAuthorName = 'unknown'
                var postImage = 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
                var userPlatform = ''
                var userJoinDate = ''
                var userAgeVerified = ''
                var userTrust = ''
                var targetUserPlatform = ''
                var targetUserJoinDate = ''
                var targetUserAgeVerified = ''
                var targetUserTrust = ''
                var hasWindowsVersion = false
                var hasAndroidVersion = false
                var hasIOSVersion = false
                var userBadgeYearNum = 0
                if (l.actorId != null) {
                    let { data: userData } = await vrchat.getUser({ path: { userId: l.actorId } })
                    if (userData.userIcon) {
                        actorHookImage = userData.userIcon
                        console.log(`Icon Pic ${userData.userIcon}`)
                    } else if (userData.profilePicOverrideThumbnail) {
                        actorHookImage = userData.profilePicOverride
                        console.log(`Profile Pic ${userData.profilePicOverride}`)
                    } else {
                        actorHookImage = userData.currentAvatarImageUrl
                        console.log(`Avatar Pic ${userData.currentAvatarImageUrl}`)
                    }

                    userData.badges.forEach(udbd => {
                        if (udbd.badgeDescription.includes('Joined VRChat')) {
                            userBadgeYearNum = parseInt(udbd.badgeDescription.split('Joined VRChat ')[1].split(' ')[0])
                        }
                    })
                    if (userBadgeYearNum == 0) {
                        console.log(`No year badge found? Falling back on Date Joined`)
                        userBadgeYearNum = parseInt(new Date(Date.now() - userData.date_joined.getTime()).toISOString().substring(0, 4) - 1970)
                    }

                    userPlatform = userData.last_platform
                    userJoinDate = userData.date_joined.toISOString().split('T')[0]
                    if (userData.ageVerified == true) { userAgeVerified = userData.ageVerificationStatus } else { userAgeVerified = 'False' }
                    if (userData.tags.includes('system_trust_veteran')) {
                        userTrust = 'Trusted User'
                        //                         if( !userData.tags.includes('show_social_rank') ){ userTrust = `${userTrust}
                        // *(Hidden)*`}
                    }
                    else if (userData.tags.includes('system_trust_trusted')) {
                        userTrust = 'Known User'
                        //                         if( !userData.tags.includes('show_social_rank') ){ userTrust = `${userTrust}
                        // *(Hidden)*`}
                    }
                    else if (userData.tags.includes('system_trust_known')) { userTrust = 'User' }
                    else if (userData.tags.includes('system_trust_basic')) { userTrust = 'New User' }
                    else { userTrust = 'Visitor' }
                }
                if (l.targetId.includes('usr_')) {
                    let { data: userData } = await vrchat.getUser({ path: { userId: l.targetId } })
                    /* if( userData.userIcon ){
                        actorHookImage = userData.userIcon
                        console.log(`Icon Pic ${userData.userIcon}`)
                    }else if( userData.profilePicOverrideThumbnail ){
                        actorHookImage = userData.profilePicOverride
                        console.log(`Profile Pic ${userData.profilePicOverride}`)
                    }else{
                        actorHookImage = userData.currentAvatarImageUrl
                        console.log(`Avatar Pic ${userData.currentAvatarImageUrl}`)
                    } */
                    targetUserPlatform = userData.last_platform
                    targetUserJoinDate = userData.date_joined.toISOString().split('T')[0]
                    if (userData.ageVerified == true) { targetUserAgeVerified = userData.ageVerificationStatus } else { targetUserAgeVerified = 'False' }
                    if (userData.tags.includes('system_trust_veteran')) {
                        targetUserTrust = 'Trusted User'
                        //                         if( userData.tags.includes('show_social_rank') == false ){ targetUserTrust = `${targetUserTrust}
                        // *(Hidden)*`}
                    }
                    else if (userData.tags.includes('system_trust_trusted')) {
                        targetUserTrust = 'Known User'
                        //                         if( userData.tags.includes('show_social_rank') == false ){ targetUserTrust = `${targetUserTrust}
                        // *(Hidden)*`}
                    }
                    else if (userData.tags.includes('system_trust_known')) { targetUserTrust = 'User' }
                    else if (userData.tags.includes('system_trust_basic')) { targetUserTrust = 'New User' }
                    else { targetUserTrust = 'Visitor' }
                }
                if (l.data.authorId != null) {
                    let { data: userData } = await vrchat.getUser({ path: { userId: l.actorId } })
                    postAuthorName = userData.displayName
                }
                if (l.data.imageId != null) {
                    let { data: filedata } = await vrchat.getFile({ path: { fileId: l.data.imageId } })
                    postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
                }
                if (l.data.bannerId != null) {
                    let { data: filedata } = await vrchat.getFile({ path: { fileId: l.data.bannerId.new } })
                    postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
                }
                if (l.targetId.includes('wrld_')) {
                    let regex = /(wrld_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}):([0-9]{5})~group\(grp_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}\)~groupAccessType\((members|plus|public)\)(?:~canRequestInvite)?~region\((us|use|eu|jp)\)/
                    if (regex.test(l.targetId)) {
                        locationWorldID = regex.exec(l.targetId)[1]
                        locationID = regex.exec(l.targetId)[2]
                        locationType = regex.exec(l.targetId)[3]
                        locationRegion = regex.exec(l.targetId)[4].toUpperCase()
                        let { data: worldData } = await vrchat.getWorld({ path: { worldId: locationWorldID } })
                        hasWindowsVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'standalonewindows') != undefined)
                        hasAndroidVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'android') != undefined)
                        hasIOSVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'ios') != undefined)
                        locationName = worldData.name
                        locationImageURL = worldData.imageUrl
                    }
                } else if (l.data.location != null && l.data.location.includes('wrld_')) {
                    let regex = /(wrld_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}):([0-9]{5})~group\(grp_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}\)~groupAccessType\((members|plus|public)\)(?:~canRequestInvite)?~region\((us|use|eu|jp)\)/
                    if (regex.test(l.data.location) == true) {
                        locationWorldID = regex.exec(l.data.location)[1]
                        console.log(locationWorldID)
                        locationID = regex.exec(l.data.location)[2]
                        locationType = regex.exec(l.data.location)[3]
                        locationRegion = regex.exec(l.data.location)[4].toUpperCase()
                        let { data: worldData } = await vrchat.getWorld({ path: { worldId: locationWorldID } })
                        hasWindowsVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'standalonewindows') != undefined)
                        hasAndroidVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'android') != undefined)
                        hasIOSVersion = (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'ios') != undefined)
                        console.log(worldData)
                        locationName = worldData.name
                        locationImageURL = worldData.imageUrl
                    }
                }
                console.log(`${l.created_at} ${l.eventType} ${l.actorDisplayName} - ${l.description}`)
                if (groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
                    if (l.eventType == 'group.post.create') {
                        let img = l.data.imageId == null ? '' : postImage
                        groupPostCreate(groupID, l.created_at, l.description.split('post created by ')[1], l.data.title, l.data.text, img, actorHookImage)
                    } else if (l.eventType == 'group.instance.create') {
                        groupInstanceCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, locationWorldID, locationID, locationType, locationRegion, locationName, locationImageURL, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
                    }
                } else if (l.eventType == 'group.post.create') {
                    let img = l.data.imageId == null ? '' : postImage
                    groupPostCreate(groupID, l.created_at, l.description.split('post created by ')[1], l.data.title, l.data.text, img, actorHookImage)
                } else if (l.eventType == 'group.post.update') {
                    groupPostUpdate(groupID, l.created_at, l.actorDisplayName, l.description, l.data.text.new)
                } else if (l.eventType == 'group.post.delete') {
                    let img = l.data.imageId == null ? '' : postImage
                    groupPostDelete(groupID, l.created_at, actorHookImage, l.description, postAuthorName, l.data.title, l.data.text, img)
                } else if (l.eventType == 'group.member.join') {
                    if (l.description.includes('has been added')) {
                        // User Quasar300 has been added to the group by 14anthony7095.
                        groupMemberJoinAdded(groupID, l.created_at, l.description.split(' has been added')[0].split('User ')[1], l.actorDisplayName, actorHookImage, l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
                    } else {
                        // User Amaih40 has joined the group.
                        groupMemberJoin(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.actorId, userPlatform, userTrust, userAgeVerified, userJoinDate)
                        switch (groupID) {
                            case `grp_4f5d0456-4200-4b2c-8331-78856d1869e4`:
                                // 1 Year of VRC Collector
                                if (userBadgeYearNum < 1) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`:
                                // 2 Year of VRC Collector
                                if (userBadgeYearNum < 2) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 2) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_378c0550-07a1-4cab-aa45-65ad4a817117`:
                                // 3 Year of VRC Collector
                                if (userBadgeYearNum < 3) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 3) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_378c0550-07a1-4cab-aa45-65ad4a817117' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`:
                                // 4 Year of VRC Collector
                                if (userBadgeYearNum < 4) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 4) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`:
                                // 5 Year of VRC Collector
                                if (userBadgeYearNum < 5) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 5) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`:
                                // 6 Year of VRC Collector
                                if (userBadgeYearNum < 6) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 6) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_5eb28410-68df-4609-b0c5-bc98cf754264`:
                                // 7 Year of VRC Collector
                                if (userBadgeYearNum < 7) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 7) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_5eb28410-68df-4609-b0c5-bc98cf754264' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_18aa4b68-9118-4716-9a39-42413e54db8c`:
                                // 8 Year of VRC Collector
                                if (userBadgeYearNum < 8) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 8) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_18aa4b68-9118-4716-9a39-42413e54db8c' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`:
                                // 9 Year of VRC Collector
                                if (userBadgeYearNum < 9) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 9) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_768a2c3d-b22c-48d2-aae1-650483c347ea' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            case `grp_243d9742-ce05-4fc3-b399-cd436528c432`:
                                // 10 Year of VRC Collector
                                if (userBadgeYearNum < 10) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                if (userBadgeYearNum + 1 < 10) {
                                    await vrchat.banGroupMember({ 'path': { 'groupId': 'grp_243d9742-ce05-4fc3-b399-cd436528c432' }, 'body': { 'userId': l.actorId } })
                                }
                                break;
                            default: break;
                        }
                    }
                } else if (l.eventType == 'group.member.leave') {
                    groupMemberLeave(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.actorId, userPlatform, userTrust, userAgeVerified, userJoinDate)
                } else if (l.eventType == 'group.instance.warn') {
                    groupInstanceWarn(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split('instance warn for ')[1], locationWorldID, locationID, locationType, locationRegion, l.targetId, locationName, '', targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
                } else if (l.eventType == 'group.instance.kick') {
                    groupInstanceKick(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split('instance kick for ')[1], locationWorldID, locationID, locationType, locationRegion, l.targetId, locationName, '', targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
                } else if (l.eventType == 'group.member.remove') {
                    groupMemberRemove(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was removed from')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
                } else if (l.eventType == 'group.instance.create') {
                    groupInstanceCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, locationWorldID, locationID, locationType, locationRegion, locationName, locationImageURL, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
                } else if (l.eventType == 'group.instance.close') {
                    groupInstanceClose(groupID, l.created_at, l.actorDisplayName, actorHookImage, locationWorldID, locationID, locationType, locationRegion, locationName, locationImageURL, [hasWindowsVersion, hasAndroidVersion, hasIOSVersion])
                } else if (l.eventType == 'group.user.ban') {
                    if (l.description.includes(`preemptively banned`)) {
                        groupUserBan(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was preemptively banned by')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
                    } else {
                        groupUserBan(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was banned by')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
                    }
                } else if (l.eventType == 'group.user.unban') {
                    groupUserUnban(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' was unbanned by')[0].split('User ')[1], l.targetId)
                } else if (l.eventType == 'group.invite.create') {
                    groupInviteCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' has been invited')[0].split('User ')[1], l.targetId, targetUserPlatform, targetUserTrust, targetUserAgeVerified, targetUserJoinDate)
                } else if (l.eventType == 'group.invite.cancel') {
                    groupInviteCancel(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split(' has been uninvited')[0].split('User ')[1], l.targetId)
                } else if (l.eventType == 'group.member.user.update') {
                    groupMemberUserUpdate(groupID, l.created_at, l.description, JSON.stringify(l.data))
                } else if (l.eventType == 'group.member.role.assign') {
                    groupMemberRoleAssign(groupID, l.created_at, l.description, actorHookImage)
                } else if (l.eventType == 'group.member.role.unassign') {
                    groupMemberRoleUnassign(groupID, l.created_at, l.description, actorHookImage)
                } else if (l.eventType == 'group.request.create') {
                    groupRequestCreate(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.actorId, userPlatform, userTrust, userAgeVerified, userJoinDate)
                } else if (l.eventType == 'group.request.reject') {
                    groupRequestReject(groupID, l.created_at, l.actorDisplayName, actorHookImage, l.description.split('has rejected ')[1].split(`'s join request.`)[0], l.targetId)
                } else if (l.eventType == 'group.role.create') {
                    var dataOrderText = '???'
                    if (l.data.order != undefined) { dataOrderText = l.data.order };
                    groupRoleCreate(groupID, l.created_at, l.description, actorHookImage, dataOrderText, l.data.isSelfAssignable, l.data.isAddedOnJoin, l.data.requiresPurchase, l.data.requiresTwoFactor, ` ${JSON.stringify(l.data.permissions)}`)
                } else if (l.eventType == 'group.role.delete') {
                    groupRoleDelete(groupID, l.created_at, l.description, actorHookImage, l.data.order, l.data.isSelfAssignable, l.data.isAddedOnJoin, l.data.requiresPurchase, l.data.requiresTwoFactor, l.data.isManagementRole, ` ${JSON.stringify(l.data.permissions)}`)
                } else if (l.eventType == 'group.update') {
                    groupUpdate(groupID, l.created_at, l.description)
                } else {
                    if (![`grp_4f5d0456-4200-4b2c-8331-78856d1869e4`,
                        `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`,
                        `grp_378c0550-07a1-4cab-aa45-65ad4a817117`,
                        `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`,
                        `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`,
                        `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`,
                        `grp_5eb28410-68df-4609-b0c5-bc98cf754264`,
                        `grp_18aa4b68-9118-4716-9a39-42413e54db8c`,
                        `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`,
                        `grp_243d9742-ce05-4fc3-b399-cd436528c432`].includes(groupID)) {
                        undiscoveredEvent(groupID, l.created_at, l.eventType, JSON.stringify(l))
                        console.log(`${loglv().warn} - ${l.eventType} does not exist yet`)
                    }
                }
            }, 10_000 * (arr.length - 1 - index))
            if (index == arr.length - 1) {
                setTimeout(() => {
                    resolve(true); console.log(`${loglv().log}${selflog} Audit Log scan finished for ${groupID}`)
                }, 20_000)
            }
        })
        // const invertedIndex = arr.length - 1 - index;

    })
}