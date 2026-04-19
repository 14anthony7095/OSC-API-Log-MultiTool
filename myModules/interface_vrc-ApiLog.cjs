/*
-------------------------------------

    VRChat Log Reader

-------------------------------------
*/
// Libraries
var { loglv, printAllLogs, ChatVideoURL, ChatVideoTitle, ttvAlwaysRun, ttvFetchFrom, ChatImageStringURL, ChatDownSpeed, logStickers, downloadStickers } = require('./config.js')
var { oscSend, OSCDataBurst, oscEmitter, oscChatBoxV2, getOSCDataBurstState } = require('./Interface_osc_v1.js')
var { switchChannel, joinChannel, leaveChannel } = require('./Interface_twitch.js');
var fs = require('fs')
const fsp = require('fs').promises
var ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const say = require('say');
const { EventEmitter, once } = require('events');
const apiEmitter = new EventEmitter
exports.apiEmitter = apiEmitter;
const logEmitter = new EventEmitter
exports.logEmitter = logEmitter;
const { cmdEmitter } = require('./input.js');
const { PiShock, PiShockAll } = require('./Interface_PS.js');
const { config } = require('process');
require('dotenv').config({ 'quiet': true })
const { undiscoveredEvent, groupMemberJoinAdded, groupMemberJoin, groupMemberLeave, groupMemberRemove, groupMemberUserUpdate, groupMemberRoleAssign, groupMemberRoleUnassign, groupPostCreate, groupPostUpdate, groupPostDelete, groupRoleCreate, groupRoleDelete, groupRequestCreate, groupRequestReject, groupInstanceCreate, groupInstanceClose, groupInstanceWarn, groupInstanceKick, groupInviteCreate, groupInviteCancel, groupUserBan, groupUserUnban, groupUpdate } = require('./interace_WebHook.js')
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { WebSocket } = require("ws");
const { table } = require('table');
const { default: open } = require('open');
// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('datasets/vrchat-X-discord.db');

// Global Scope
let selflogL = `\x1b[0m[\x1b[32mVRC_Log\x1b[0m]`
let selflogA = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
let selflogWS = `\x1b[0m[\x1b[33mVRC_WebSocket\x1b[0m]`
var path = 'C:/Users/14anthony7095/AppData/LocalLow/VRChat/VRChat/'
var tarFile = 'nothing'
var tarFilePath = 'nothing'
var playersInInstance = []
var membersInInstance = []
var playersInstanceObject = []
var playerHardLimit = 99
var playerRatio = 0.5
var memberRatio = 0.5
var G_autoNextWorldHop = false
var worldHoppers = []
var vrchatDiscord; fs.readFile('datasets/vrc-X-dis.json', 'utf8', (err, data) => { vrchatDiscord = JSON.parse(data) })
var vrchatElAlbaMembers; fs.readFile('datasets/groupMembers El Alba.json', 'utf8', (err, data) => { vrchatElAlbaMembers = JSON.parse(data) })
var vrcDataCache = {}
var lastFetchGroupLogs;
var currentUser;
var statWarnings = false
var userAutoAcceptWhiteList = []
var worldQueueTxt = './datasets/worldQueue.txt'
var exploreMode = false
var explorePrivacyLevel = 0
var exploreNextCountDownTimer;
var authToken = null
var isApiErrorSkip = false
var socket_VRC_API
var cacheWS = {}
var G_lastlocation = ''

// Restore saved into Scope
fs.readFile('./lastFetchGroupLogs.txt', 'utf8', (err, data) => {
    if (err) { console.log(err); return }
    console.log(`${loglv().debug}${selflogA} set last log fetch to ${data}`)
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

//	--	On Load	--
console.log(`${loglv().log}${selflogL} Loaded -> ${loglv(printAllLogs)}printAllLogs${loglv().reset} , ${loglv(ChatVideoURL)}ChatVideoURL${loglv().reset} , ${loglv(ChatVideoTitle)}ChatVideoTitle${loglv().reset}`)

var vrchat = new VRChat({
    // baseUrl: "https://api.vrchat.cloud/api/1",
    // meta: {},
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
    },
    keyv: new KeyvFile({ filename: "./datasets/vrcA.json" })
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

class ratelimitHandler {
    pause_sec = 30
    pause_exp = 1
    constructor(pause_exp, pause_sec) {
        this.pause_sec
        this.pause_exp
    }
    get waitTimeMS() { return 1000 * (this.pause_sec * Math.pow(2, this.pause_exp)) }
    get waitTimeSec() { return this.pause_sec * Math.pow(2, this.pause_exp) }
    get delayMulti() { return this.pause_exp }
    async backoff() {
        return new Promise((resolve, reject) => {
            console.log(`[Ratelimit-Handler] Backing off for ${this.waitTimeSec} sec`)
            if (this.pause_exp <= 6) { this.pause_exp++ } else { console.log(`[Ratelimit-Handler] Peaking at expo 7 (1 hour 4 min)`) }
            setTimeout(() => { resolve(true) }, this.waitTimeMS);
        })
    }
    cooloff() {
        if (this.pause_exp > 1) { this.pause_exp = this.pause_exp - this.pause_exp * 0.1 } else if (this.pause_exp < 1) { this.pause_exp = 1 }
    }
    async req(I_request) {
        return new Promise((resolve, reject) => {
            async function attemptRequest() {
                var res = await I_request
                if (res.error?.statusCode == 429 || res.error?.statusCode == 500) {
                    console.debug(res)
                    await limiter.backoff()
                    attemptRequest()
                } else {
                    resolve(res)
                    limiter.cooloff()
                }
            }
            attemptRequest()
        })
    }
}
const limiter = new ratelimitHandler();

cmdEmitter.on('cmd', (cmd, args) => {
    if (cmd == 'help') {
        console.log(`
-   api requestall
-   years [open/close]
-   forceaudit
-   avatars
-   collectavatars
-   collectavatars2
-   allavatars
-   listavatars [file_UUID...]
-   wearers
-   statwarn [True/False]
-   preload [wrld_UUID...]
-   addworlds [<string>]
-   explore
        > prefill
        > autonext [True/False]
-   hoppers
-   log
        > vidurl [True/False]
        > vidtitle [True/False]
        > printall [True/False]
        > queue [True/False]
        > speed [True/False]
-   twitch
        > alwaysrun [True/False]
        > join [channel:<string>]
        > leave [channel:<string>]
        > switch [channel:<string>]
        > from [0-3]`)
    }
    if (cmd == 'api' && args[0] == 'requestall') { requestAllOnlineFriends(currentUser) }
    if (cmd == 'years' && args[0] == 'close') { switchYearGroupsClosed() }
    if (cmd == 'years' && args[0] == 'open') { switchYearGroupsReOpen() }
    if (cmd == 'forceaudit') { scanGroupAuditLogs() }

    if (cmd == 'avatars') { requestAvatarStatTable(false, 0.05, false) }
    if (cmd == 'collectavatars') { collectActiveInstanceStats() }
    if (cmd == 'collectavatars2') { collectActiveInstanceStats(true) }
    if (cmd == 'allavatars') { scanAllAvatarStats() }
    if (cmd == 'listavatars') { scanListAvatarStats(raw.slice(12).split(',')) }
    if (cmd == 'wearers') { console.log(avatarStatSummary.seenAvatars) }
    if (cmd == 'statwarn') { statWarnings = JSON.parse(args[0]) }

    if (cmd == 'preload') { worldAutoPreloadQueue(args[0].split(',')) }
    if (cmd == 'addworlds') { addSearchToLocalQueue(raw.slice(10)) }
    if (cmd == 'explore' && args[0] == 'prefill') { addLabWorldsToLocalQueue() }
    if (cmd == 'explore' && args[0] == 'autonext') { G_autoNextWorldHop = JSON.parse(args[1]) }

    if (cmd == 'log' && args[0] == 'vidurl') { ChatVideoURL = JSON.parse(args[1]) }
    if (cmd == 'log' && args[0] == 'vidtitle') { ChatVideoTitle = JSON.parse(args[1]) }
    if (cmd == 'log' && args[0] == 'printall') { printAllLogs = JSON.parse(args[1]) }
    if (cmd == 'log' && args[0] == 'queue') { ChatAvyQueue = JSON.parse(args[1]) }
    if (cmd == 'log' && args[0] == 'speed') { ChatDownSpeed = JSON.parse(args[1]) }

    if (cmd == 'twitch' && args[0] == 'alwaysrun') { ttvAlwaysRun = args[1] }
    if (cmd == 'twitch' && args[0] == 'join') { ttvFetchFrom = 2; setTimeout(() => { joinChannel(args[1].toString()) }, 100) }
    if (cmd == 'twitch' && args[0] == 'leave') { ttvFetchFrom = 2; setTimeout(() => { leaveChannel(args[1].toString()) }, 100) }
    if (cmd == 'twitch' && args[0] == 'switch') { ttvFetchFrom = 1; setTimeout(() => { switchChannel(args[1].toString()) }, 100) }
    if (cmd == 'twitch' && args[0] == 'from') { ttvFetchFrom = args[1] }

    if (cmd == 'hoppers') {
        var string = ''
        worldHoppers.sort((a, b) => { return b.playtime - a.playtime }).forEach((a) => {
            var discordInfo = vrchatDiscord.filter(e => e.vrcUUID == a.id)
            if (discordInfo.length != 0) {
                string += `${string.length == 0 ? '' : '\n'}\`${new Date(a.playtime).toISOString().substring(11, 19)}\` ${a.groupMember == true ? `👥` : `👻`} ${a.name} <@${discordInfo[0].discordid}> - [${discordInfo[0].discordid}]`
            } else {
                string += `${string.length == 0 ? '' : '\n'}\`${new Date(a.playtime).toISOString().substring(11, 19)}\` ${a.groupMember == true ? `👥` : `👻`} ${a.name} [profile](<https://vrchat.com/home/user/${a.id}>)`
            }
        })
        console.log(string)
    }
})

async function main() {
    console.log(`${loglv().debug}${selflogA} start main function`)
    try {
        const { data: currentUser } = await limiter.req(vrchat.getCurrentUser({ throwOnError: true }))
        console.log(`${loglv().log}${selflogA} Logged in as: ${currentUser.displayName}`);
        const { data: auth } = await limiter.req(vrchat.verifyAuthToken())
        if (auth.ok == true) {
            authToken = auth.token
            socket_VRC_API_Connect()
        }
    } catch (error) {
        console.log(`${loglv().warn}${selflogA} API is down.. Cry`)
        isApiErrorSkip = true
    }
}

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
                        if (getSelfLocation() == undefined || getSelfLocation() == '') {
                            let res = await limiter.req(vrchat.getCurrentUser())
                            if (res.data.presence.world != 'offline') {
                                let resIU = await limiter.req(vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': res.data.presence.world + ":" + res.data.presence.instance, 'messageSlot': 0 } }))
                                resIU.data == undefined ? console.log(resIU.error) : console.log(resIU.data)
                            } else {
                                await limiter.req(vrchat.respondInvite({ 'body': { 'responseSlot': 0 }, 'path': { 'notificationId': wsContent.id } }))
                            }
                        } else {
                            let resIU = await limiter.req(vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': getSelfLocation(), 'messageSlot': 0 } }))
                            resIU.data == undefined ? console.log(resIU.error) : console.log(resIU.data)
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
                if (wsContent.type == 'group.invite') {
                    console.log(`${loglv().log}${selflogWS} [${JSON.parse(line).type}] ${wsContent.message} - ${wsContent.link.slice(6)}`)

                    // Auto Block if not long enough
                    if (wsContent.link.slice(6) == getInstanceGroupID() && Date.now() < (getWorldJoinTimestamp() + 300_000)) {

                        oscChatBoxV2(`Group performed an undesirable action.\vTaking countermeasures`, 10_000, true, true, false, false)

                        // Block Group Owner
                        var resG = await limiter.req(vrchat.getGroup({ 'path': { 'groupId': wsContent.link.slice(6) } }))
                        if (resG.data != undefined) {
                            var resMu1 = await limiter.req(vrchat.moderateUser({ 'body': { 'type': 'block', 'moderated': resG.data.ownerId } }))
                            console.log(`You've blocked Group Owner: ${resMu1.data.targetDisplayName}`)
                        } else { console.log(resG) }

                        // Block Inviter
                        var resS = await limiter.req(vrchat.searchUsers({ 'query': { 'search': wsContent.data.managerUserDisplayName } }))
                        if (resS.data != undefined && resS.data.length >= 1) {
                            // var resMu2 = await limiter.req(vrchat.moderateUser({'body':{'type':'block','moderated':resS.data[0].id}}))

                            // Skip auto-block incase search miss-lands
                            console.log(`User that invited you`, resS.data[0].displayName, resS.data[0].id)
                            open(`vrcx://user/${resS.data[0].id}`)
                        }

                        // Block Group
                        var resBG = await limiter.req(vrchat.blockGroup({ 'path': { 'groupId': wsContent.link.slice(6) } }))
                        if (resBG.data != undefined) {
                            console.log(resBG.data.success.message)
                        } else {
                            console.log(resBG)
                        }
                    }

                } else if (wsContent.type == 'boop') {
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
                    notif_user_displayName = await limiter.req(vrchat.getUser({ 'path': { 'userId': wsContent.userId } }))
                    console.log(`${loglv().log}${selflogWS} [GPS] ${(notif_user_displayName.data || "").displayName} - Offline`);
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

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, time)
    })
}
function formatBytes(bytes, decimals = 1) {
    return new Promise((resolve, reject) => {
        if (bytes === 0) { resolve('0 Bytes') };
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        resolve(parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i])
    })
}
function mathSumValues(values_Arr) {
    var sum = 0
    for (const i in values_Arr) {
        sum += values_Arr[i]
    }
    return sum
}

function fetchLogFile() {
    console.log(`${loglv().log}${selflogL} Finding latest log file`)
    fs.readdir(path, function (err, files) {
        files = files.map(function (fileName) {
            return {
                name: fileName,
                time: fs.statSync(path + '/' + fileName).mtime.getTime()
            }
        })
            .sort(function (a, b) {
                return a.time - b.time
            })
            .map(function (v) {
                return v.name
            })
            .filter(function (a) {
                return a.includes('output_log_')
            })
        tarFile = files[files.length - 1]
        tarFilePath = path + '' + files[files.length - 1]
        console.log(`${loglv().log}${selflogL} Found newest log file: ${files[files.length - 1]}`)
        startWatching()
    })
}
exports.fetchLogFile = fetchLogFile;
fetchLogFile()


function partWhole(part = null, whole = null, percent = null) {
    // Missing Part
    var crossmulti;
    try {
        crossmulti = part * 100
        try { return crossmulti / whole }
        catch { return crossmulti / percent }
    }
    catch {
        crossmulti = whole * percent
        return crossmulti / 100
    }
}


var watcher;
//var vurl = null
var lastUpdated = 0
var lastChecked = 0
function startWatching() {
    console.log(`${loglv().log}${selflogL} Started Watcher`)
    if (tarFilePath.includes('undefined')) {
        setTimeout(() => { updateWatcher() }, 5000)
        return
    } else {
        watcher = fs.watch(tarFilePath, 'utf8', (eventType, filename) => {
            //console.log( `${loglv().debug}${selflog}`, eventType, filename)
            if (eventType == 'change' && filename == tarFile) {
                lastUpdated = Date.now()
                //console.log(`${loglv().debug}${selflog} ${lastUpdated} Log updated`)
                readLogFile()
            }
            if (eventType == 'rename' && filename.includes('output_log_')) {
                console.log(`${loglv().warn}${selflogL} A newer log file might of just been created`)
                updateWatcher()
            }
        })
    }
}
function updateWatcher() {
    console.log(`${loglv().log}${selflogL} Updating Watcher`)
    watcher.close()
    fetchLogFile()
}


var previousLength = 0
var currentLength = 0
var cooldownLogRead = false
var urlType = 'none'
var logCooldown = 0.001 // secs
function readLogFile(cooldownSkip) {
    if (cooldownLogRead == false || cooldownSkip == true) {
        lastChecked = Date.now()
        //console.log(`${loglv().debug}${selflog} ${lastChecked} Reading Log`)
        cooldownLogRead = true

        fs.readFile(tarFilePath, 'utf8', (err, data) => {
            if (err) { console.log(err); return }
            dataNE = data.replace(/^\s*\n/gm, "").trim()
            currentLength = dataNE.length
            if (previousLength == 0) { previousLength = currentLength }
            newData = dataNE.slice(previousLength)
            var newDataPerLine = newData.split('\r')
            //newDataPerLine.shift()

            // varibles to check for within the line scan
            newDataPerLine.forEach((line, index) => {
                if (line.length != 0) {
                    outputLogLines(index, newDataPerLine.length - 1, line);
                }

                // Reached end of new lines
                if (index == newDataPerLine.length - 1) {
                    setTimeout(() => {
                        if (lastChecked < lastUpdated) { readLogFile(true) }
                        else { cooldownLogRead = false }
                    }, logCooldown * 1000)
                }
            })
            previousLength = currentLength

        })
    }
}

// - Avatar Perf Allowance -
//  Stat / Value >= Threshold
const avatarStatWeights = {
    "lowerLimitWeight": 1,             // Display Evaluation Value
    "higherLimitWeight": 1,            // Warn Icon + True Stat
    "boundsLongest": 6,               //🔒locked in - from suggestion list
    "constraintCount": 350,           //🔒locked in - from suggestion list
    "constraintDepth": 100,            //🔒locked in - from suggestion list
    "totalTextureUsage": 157286400,       //🔒locked in - from suggestion list
    "totalPolygons": 70000,              //🔒locked in - from suggestion list
    "skinnedMeshCount": 16,            //🔒locked in - from suggestion list
    "meshCount": 24,                   //🔒locked in - from suggestion list
    "physBoneCollisionCheckCount": 512,  //🔒locked in - from suggestion list
    "physBoneColliderCount": 32,       //🔒locked in - from suggestion list
    "physBoneComponentCount": 32,      //🔒locked in - from suggestion list
    "physBoneTransformCount": 256,       //🔒locked in - from suggestion list
    "contactCount": 32,               //🔒locked in - from suggestion list
    "animatorCount": 32,
    "audioSourceCount": 8,
    "boneCount": 400,
    "cameraCount": 12,
    "clothCount": 4,
    "lineRendererCount": 8,
    "materialCount": 99999,
    "meshParticleMaxPolygons": 5000,
    "particleSystemCount": 16,
    "physicsColliders": 8,
    "physicsRigidbodies": 8,
    "totalClothVertices": 200,
    "totalMaxParticles": 2500,
    "trailRendererCount": 8,
    "materialSlotsUsed": 32,
    "lightCount": 1,
    "blendShapeCount": 99999
}

var avatarStatSummary = {
    "totalAvatars": 0,
    "checkedFileIDs": [],
    "seenAuthors": [{
        "id": "", "displayName": ""
    }],
    "seenAvatars": [{
        "name": "", "author": null, "wearers": [], "lastAccessed": 0
    }],
    "Excellent": 0,
    "Good": 0,
    "Medium": 0,
    "Poor": 0,
    "VeryPoor": 0,
    "stats": {
        "totalPolygons": { "label": "Polygons", "values": [] },
        "boundsLongest": { "label": "Bounds (Longest Edge)", "values": [] },
        "skinnedMeshCount": { "label": "Skinned Meshes", "values": [] },
        "meshCount": { "label": "Basic Meshes", "values": [] },
        "materialSlotsUsed": { "label": "Material Slots", "values": [] },
        "materialCount": { "label": "Material Count", "values": [] },
        "physBoneColliderCount": { "label": "PhysBone Colliders", "values": [] },
        "physBoneCollisionCheckCount": { "label": "PhysBone Collision Checks", "values": [] },
        "physBoneComponentCount": { "label": "PhysBone Components", "values": [] },
        "physBoneTransformCount": { "label": "PhysBone Transforms", "values": [] },
        "contactCount": { "label": "Contacts", "values": [] },
        "constraintCount": { "label": "Constraint Count", "values": [] },
        "constraintDepth": { "label": "Constraint Depth", "values": [] },
        "animatorCount": { "label": "Animators", "values": [] },
        "boneCount": { "label": "Bones", "values": [] },
        "lightCount": { "label": "Lights", "values": [] },
        "particleSystemCount": { "label": "Particle Systems", "values": [] },
        "totalMaxParticles": { "label": "Max Particles", "values": [] },
        "meshParticleMaxPolygons": { "label": "Particle Max Polygons", "values": [] },
        "trailRendererCount": { "label": "Trail Renderers", "values": [] },
        "lineRendererCount": { "label": "Line Renderers", "values": [] },
        "clothCount": { "label": "Cloth Count", "values": [] },
        "totalClothVertices": { "label": "Cloth Vertices", "values": [] },
        "physicsColliders": { "label": "Unity Colliders", "values": [] },
        "physicsRigidbodies": { "label": "Rigidbodies", "values": [] },
        "audioSourceCount": { "label": "AudioSources", "values": [] },
        "blendShapeCount": { "label": "BlendShapes", "values": [] },
        "cameraCount": { "label": "Cameras", "values": [] },
        "totalTextureUsage": { "label": "Texture Memory (VRAM)", "values": [] },
        "fileSize": { "label": "Download Size", "values": [] },
        "uncompressedSize": { "label": "Uncompressed Size (RAM)", "values": [] }
    }
}

function getPlayersInInstance() { return playersInInstance }
exports.getPlayersInInstance = getPlayersInInstance;
function getPlayersInstanceObject() { return playersInstanceObject }
exports.getPlayersInstanceObject = getPlayersInstanceObject;


var lastVideoURL = ``
var seenVideoURLs = [] // For current instance only
var worldHopTimeout;
var worldHopTimeoutHour;
var tonRoundType = ''
var tonAvgStartWait = []
var tonRoundReadyTime = 0
var G_worldID = ``
var G_currentLocation = ''
var worldID_Closed = false
oscSend('/avatar/parameters/log/instance_closed', false)
var G_groupID_last = ``
var G_groupID = ``
var instanceType = ''
var lastSetUserStatus = ''
var cooldownPortalVanish = false
var vrchatRunning = false
var loadingAvatarTimer;

function getVrchatRunning() { return vrchatRunning }
exports.getVrchatRunning = getVrchatRunning;

function getInstanceGroupID() { return G_groupID }
exports.getInstanceGroupID = getInstanceGroupID;
function average(array) {
    if (array.length == 0) { return 0 }
    return Math.floor(array.reduce((a, b) => a + b) / array.length)
}

function outputLogLines(currentLineIndexFromBuffer, totalLinesInBuffer, line) {
    if (printAllLogs == true) {
        console.log(`${loglv().debug}${selflogL} [${currentLineIndexFromBuffer}/${totalLinesInBuffer}] ${line}`)
    }
    if (vrchatRunning == false) { vrchatRunning = true }

    logEmitter.emit('log', line)

    if (line.includes('[Behaviour] Destination set: wrld_')) { eventHeadingToWorld(line) }
    if (line.includes('[Behaviour] Joining wrld_')) { eventJoinWorld() }
    if (line.includes('Instance closed: ')) { eventInstanceClosed() }
    if (line.includes(`Shocked: `) && line.includes(process.env["VRC_ACC_NAME_1"])) { PiShockAll(30, 1) }
    if (line.includes('[Behaviour] Hard max is ')) {
        playerHardLimit = parseInt(line.split('[Behaviour] Hard max is ')[1])
        oscSend('/avatar/parameters/log/player_max', playerHardLimit > 80 ? 80 : playerHardLimit)
    }
    if (line.includes('[Behaviour] Initialized player')) { eventPlayerInitialized(line) }
    if (line.includes('[Behaviour] OnPlayerJoined')) { eventPlayerJoin(line) }
    if (line.includes('[Behaviour] OnPlayerLeft')) { eventPlayerLeft(line) }

    if (line.includes('[Behaviour] Switching ') && line.includes(' to avatar ')) { eventPlayerAvatarSwitch(line) }

    if (line.includes(`Received Notification: <`)) { eventReceivedNotification(line) }

    if (line.includes(`VRCApplication: HandleApplicationQuit`)) { eventGameClose() }

    if (line.includes(`[VRCItems] Item prop_`)) { eventPropSpawned(line.split('prop_')[1].split(' ')[0]) }

    if (line.includes(`[VRCX] VideoPlay(PopcornPalace) `)) { eventPopcornPalace(line.split('[VRCX] VideoPlay(PopcornPalace) ')[1]) }

    // [Behaviour] Could not enter room because: If the instance exists‚ you're not allowed to access it․ (You are not allowed to travel to that location. If the instance exists‚ you're not allowed to access it․ (Code: 403))
    if (line.includes(`[Behaviour] Could not enter room because: ` && line.includes('You are not allowed to travel to that location'))) {
        logEmitter.emit('notAllowedToTravel')
    }

    if (line.includes(`[API] Requesting Get analysis/`)) {
        const fileAPIreq = line.split(`[API] Requesting Get analysis/`)[1].split('/')
        avatarFileAnalysis(fileAPIreq[0], parseInt(fileAPIreq[1]))
        clearTimeout(loadingAvatarTimer)
        loadingAvatarTimer = setTimeout(() => {
            logEmitter.emit('avatarQueueFinish', true)
        }, 10000);
    }

    // Terrors of Nowhere
    if (G_worldID == 'wrld_a61cdabe-1218-4287-9ffc-2a4d1414e5bd') {
        // if (line.includes(`[DEATH][14anthony7095]`)) { PiShockAll(30, 1) }
        if (line.includes(`Round type is`)) {
            tonRoundType = line.split('Round type is ')[1]
            console.log(`${loglv().log}${selflogL} [TON] Round type is ${tonRoundType}`)
        }
        if (line.includes(`Sus player =`)) {
            tonSusPlayer = line.split('Sus player = ')[1]
            say.speak('Impostor is ' + tonSusPlayer, 'Microsoft Zira Desktop', 1.0)
            console.log(`${loglv().log}${selflogL} [TON] Impostor is ${tonSusPlayer}`)
        }
        if (line.includes(`Verified Round End`)) {
            console.log(`${loglv().log}${selflogL} [TON] Intermission.. Ready to start next round.`)
            tonRoundReadyTime = Date.now()
            let avgStartDisplay = new Date(average(tonAvgStartWait)).toISOString()

            tonAvgStartWait.length > 1 ? oscChatBoxV2(`~Round ready to start\vAvg. wait time: ${avgStartDisplay.substring(11, 19)}`, 5000, false, true) : oscChatBoxV2(`~Round ready to start`, 5000, false, true)
        }
        if (line.includes(`Everything recieved, looks good`)) {
            console.log(`${loglv().log}${selflogL} [TON] Round Starting.`)
            if (tonRoundReadyTime != 0) {
                tonAvgStartWait.push(Date.now() - (tonRoundReadyTime + 12000))
            }
        }
    }

    // Fish! [RELEASE]
    if (G_worldID == 'wrld_ae001ea3-ed05-42f0-adf2-3d47efd10a77') {
        if (line.includes(`[PlayerStats] `)) {
            var plystats = line.split(`[PlayerStats] `)[1].split(' ')
            console.log(`${loglv().log}${selflogL} [FISH] You're Level ${plystats[2].slice(2)} with ${plystats[3].slice(3)} XP and ${plystats[4].slice(6)} Gold.`)
            console.log(`${loglv().log}${selflogL} [FISH] You've caught ${plystats[5].slice(5)} fish (${plystats[6].slice(5)} rare). Sold ${plystats[7].slice(5)}. Turned in ${plystats[8].slice(9)} Bounties`)
            console.log(`${loglv().log}${selflogL} [FISH] With a Playtime of ${plystats[9].slice(11, -1) >= 86400 ? "" + Math.floor(plystats[9].slice(11, -1) / 86400) + ":" : ""}${new Date(plystats[9].slice(11, -1) * 1000).toISOString().substring(11, 19)}`)
        }

        if (line.includes(`[VersionChecker] Lobby version stamped: `)) {
            var lobbyver = line.split('[VersionChecker] Lobby version stamped: ')[1]
            console.log(`${loglv().log}${selflogL} [FISH] Lobby Version ${lobbyver}.`)
        }

    }


    // Portal Manager
    if (line.includes(`[PortalManager]`)) {
        var PortalLog = line.split(`[PortalManager] `)[1]
        if (PortalLog == 'Received portal destroy event.') {
            if (cooldownPortalVanish == false) {
                oscChatBoxV2('~Portal has vanished', 5000, true, true, false, false, false)
                setTimeout(() => { cooldownPortalVanish = true }, 120_000)
            }
        }
        console.log(`${loglv().log}${selflogL} [PortalManager]: ${PortalLog}`)
    }

    // Local Moderation Manager
    if (line.includes(`[ModerationManager]`)) {
        var moderationlog = line.split(`[ModerationManager] `)[1]
        console.log(`${loglv().log}${selflogL} [ModerationManager]: ${moderationlog}`)
    }

    // Asset Bundle Download Manager
    if (line.includes(`[AssetBundleDownloadManager]`)) { eventAssetDownload(line) }

    // Image Downloading
    if (line.includes('[Image Download] Attempting to load image from URL')) {
        var imageurl = line.split('[Image Download] Attempting to load image from URL ')[1].trim()
        // console.log(`${loglv().log}${selflog} Downloading Image from ${imageurl}`)
        if (ChatImageStringURL == true) {
            oscChatBoxV2(`~ImageURL: ${imageurl}`, 5000, true, true, false, false, false)
        }
    }

    // String Downloading
    // I assume this is the same as Image downloading.. may need to change later
    if (line.includes('[String Download] Attempting to load String from URL')) {
        var stringurl = line.split('[String Download] Attempting to load String from URL ')[1].trim()
        if (/https?\:\/\/vr-m\.net\/[0-9]\/keepalive/.test(stringurl)) { return } // Surpress Moves&Chill heartbeat
        // if( stringurl == `'https://vr-m.net/1/keepalive'` ){ return	} // Surpress Moves&Chill heartbeat
        // console.log(`${loglv().log}${selflog} Downloading String from ${stringurl}`)
        if (ChatImageStringURL == true) {
            oscChatBoxV2(`~StringURL: ${stringurl}`, 5000, true, true, false, false, false)
        }
    }

    // World download progress ETA
    if (line.includes('[Behaviour] Preparation has taken')) {
        // Seconds download has been running (in Sec) , Current download percent
        var timeSecs = parseInt(line.split('[Behaviour] Preparation has taken ')[1].split(' ')[0].trim())
        var progressPercent = parseFloat(line.split('progress is ')[1].split('%,')[0].trim()) * 100
        worldDownloadProgress(timeSecs, progressPercent)
    }

    // StickerManager
    if (line.includes(`[StickersManager]`) && logStickers == true) {
        var stickerlog = line.split(`[StickersManager] `)[1]
        var stickerOwner = stickerlog.split('(')[1].split(')')[0]
        var stickerFile = stickerlog.split('spawned sticker ')[1]
        console.log(`${loglv().log}${selflogL} [StickersManager]: ${stickerOwner} placed ${stickerFile}`)
    }

    // Fetch Video Player URL
    if (line.includes('[Video Playback] Attempting to resolve URL ')) {
        videourl = line.split('URL \'')[1].split('\'')[0]
        videoUrlResolver(videourl)
    } else if (line.includes('[USharpVideo] Started video load for URL: ')) {
        videourl = line.split('[USharpVideo] Started video load for URL: ')[1].split(', requested by')[0]
        videoUrlResolver(videourl)
    } else if (line.includes('[USharpVideo] Started video: ')) {
        videourl = line.split('[USharpVideo] Started video: ')[1]
        videoUrlResolver(videourl)
    } else if (line.includes('[AVProHQ] loading URL: ')) {
        videourl = line.split('[AVProHQ] loading URL: ')[1]
        videoUrlResolver(videourl)
    } else if (line.includes('User ') && line.includes('added URL ')) {
        videourl = line.split('added URL ')[1]
        videoUrlResolver(videourl)
    }
}

async function getIsUserInGroup(F_userid, F_groupid) {
    return new Promise(async (resolve, reject) => {
        let gug = await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': F_userid } }))
        if (gug.data.find(e => e.groupId == F_groupid) != undefined) {
            resolve(true)
        } else {
            resolve(false)
        }
    })
}

function fitChars(I_line, lineCount = 1) {
    const charWidth = {
        " ": 0.018181, "a": 0.037037, "A": 0.041666, "b": 0.04, "B": 0.043478, "c": 0.03125, "C": 0.041666,
        "d": 0.04, "D": 0.047619, "e": 0.037037, "<": 0.037037, "g": 0.04, "G": 0.047619, "0": 0.037037, "1": 0.037037,
        "2": 0.037037, "3": 0.037037, "4": 0.037037, "5": 0.037037, "6": 0.037037, "7": 0.037037, "8": 0.037037, "9": 0.037037,
        "h": 0.04, "H": 0.05, ">": 0.037037, "K": 0.04, "?": 0.028571, "E": 0.037037, "M": 0.058823, "n": 0.04,
        "N": 0.05, "o": 0.04, "!": 0.017543, "@": 0.058823, "p": 0.04, "u": 0.04, "q": 0.04, "r": 0.026315,
        "s": 0.03125, "f": 0.022222, "F": 0.034482, "i": 0.016666, "I": 0.022222, "j": 0.016666, "J": 0.017857, "k": 0.034482,
        "l": 0.016666, "L": 0.034482, "m": 0.0625, "t": 0.023255, "v": 0.033333, "w": 0.052631, "x": 0.034482, "y": 0.033333,
        "z": 0.030303, "O": 0.052631, "P": 0.04, "Q": 0.052631, "R": 0.04, "S": 0.035714, "T": 0.037037, "U": 0.047619,
        "V": 0.04, "W": 0.0625, "X": 0.038461, "Y": 0.037037, "Z": 0.037037, "#": 0.041666, "$": 0.037037, "%": 0.055555,
        "^": 0.037037, "&": 0.047619, "*": 0.035714, "（": 0.066666, "）": 0.066666, "(": 0.019607, ")": 0.019607, "_": 0.028571,
        "-": 0.020833, "+": 0.037037, "=": 0.037037, "`": 0.018181, "~": 0.037037, "[": 0.021276, "]": 0.021276, "{": 0.025,
        "}": 0.025, "|": 0.035714, ";": 0.017241, "'": 0.014492, ":": 0.017241, "\"": 0.026315, ",": 0.017241, ".": 0.017241,
        "/": 0.024390
    }
    var trackingWidth = 0
    var limitLength = 0
    for (const item in I_line) {
        trackingWidth += charWidth[I_line[item]] != undefined ? charWidth[I_line[item]] : 0.0625
        if (trackingWidth >= lineCount) { limitLength = item; break; }
    }
    return I_line.slice(0, limitLength != 0 ? limitLength : I_line.length)
}

async function avatarFileAnalysis(fileid, fileversion) {
    // Has avatar already been seen while in this instance? - Escape
    if (avatarStatSummary.checkedFileIDs.includes(fileid + "-" + fileversion)) {
        console.log(`${loglv().log}${selflogA} [AvatarAnalysis] Skipping: ${fileid} - ver ${fileversion}`); return
    }

    // Has avatar already been scanned before? - Check Cache folder
    var res = {}
    try {
        var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', 'utf8')
        console.log(`${loglv().log}${selflogA} [AvatarAnalysis] Cached: ${fileid} - ver ${fileversion}`)
        res.data = JSON.parse(fsrdfile)
        if (avatarStatSummary.seenAuthors.filter(s => s.id == res.data.ownerId).length == 0) {
            avatarStatSummary.seenAuthors.push({ "id": res.data.ownerId, "displayName": res.data.displayName })
        }
        if (res.data.ownerDisplayName == null) {
            let getName = await limiter.req(vrchat.getFile({ 'path': { 'fileId': fileid } }))
            res.data["name"] = getName.data.name.slice(9).split(' - Asset bundle - ')[0]

            // Check Author
            res.data["ownerId"] = getName.data.ownerId
            try {
                res.data["ownerDisplayName"] = avatarStatSummary.seenAuthors.filter(s => s.id == getName.data.ownerId)[0].displayName
                if (res.data["ownerDisplayName"] == undefined) { throw new Error('no displayname') }
                console.log(`${loglv().log}${selflogA} [AvatarAuthor] Cached: ${getName.data.ownerId} - ${res.data["ownerDisplayName"]}`)
            } catch (err) {
                console.log(`${loglv().log}${selflogA} [AvatarAuthor] Fetching: ${getName.data.ownerId}`)

                let getOwner = await limiter.req(vrchat.getUser({ 'path': { 'userId': getName.data.ownerId } }))
                res.data["ownerDisplayName"] = getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : getOwner.data.displayName
                if (avatarStatSummary.seenAuthors.filter(s => s.id == res.data.ownerId).length == 0) {
                    avatarStatSummary.seenAuthors.push({ "id": getName.data.ownerId, "displayName": getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : getOwner.data.displayName })
                }
                if (avatarStatSummary.seenAuthors[0].id == "") { avatarStatSummary.seenAuthors.shift() }
            }

            fs.writeFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', JSON.stringify(res.data), 'utf8', (err) => { if (err) { console.log(err) } })
        }
    } catch (error) {
        console.log(`${loglv().log}${selflogA} [AvatarAnalysis] Fetching: ${fileid} - ver ${fileversion}`)

        res = await limiter.req(vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } }))
        if (res.data == undefined) {
            console.log(`${loglv().warn}${selflogA} [AvatarAnalysis] ErrorFile: ${fileid} - ver ${fileversion}`)
            setTimeout(async () => {
                res = await limiter.req(vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } }))
                console.log(res.data)
            }, 10_000);
            return
        } else if (res.data.avatarStats && res.data.performanceRating) {
            let getName = await limiter.req(vrchat.getFile({ 'path': { 'fileId': fileid } }))
            res.data["name"] = getName.data.name.slice(9).split(' - Asset bundle - ')[0]

            // Check Author
            res.data["ownerId"] = getName.data.ownerId
            try {
                res.data["ownerDisplayName"] = avatarStatSummary.seenAuthors.filter(s => s.id == getName.data.ownerId)[0].displayName
                if (res.data["ownerDisplayName"] == undefined) { throw new Error('no displayname') }
                console.log(`${loglv().log}${selflogA} [AvatarAuthor] Cached: ${getName.data.ownerId} - ${res.data["ownerDisplayName"]}`)
            } catch (err) {
                console.log(`${loglv().log}${selflogA} [AvatarAuthor] Fetching: ${getName.data.ownerId}`)

                let getOwner = await limiter.req(vrchat.getUser({ 'path': { 'userId': getName.data.ownerId } }))
                res.data["ownerDisplayName"] = getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : (getOwner.data || "").displayName
                if (avatarStatSummary.seenAuthors.filter(s => s.id == res.data.ownerId).length == 0) {
                    avatarStatSummary.seenAuthors.push({ "id": getName.data.ownerId, "displayName": getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : (getOwner.data || "").displayName })
                }
                if (avatarStatSummary.seenAuthors[0].id == "") { avatarStatSummary.seenAuthors.shift() }
            }

            fs.writeFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', JSON.stringify(res.data), 'utf8', (err) => { if (err) { console.log(err) } })
        } else {
            return
        }
    }
    // console.log(avatarStatSummary.seenAuthors)

    avatarStatSummary.checkedFileIDs.push(fileid + "-" + fileversion)

    let filesize = await formatBytes(res.data.fileSize)
    let uncompresssize = await formatBytes(res.data.uncompressedSize)
    let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
    console.log(`${loglv().log}${selflogA} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
             📦 ${filesize} , 🗃️ ${uncompresssize} , 🐏 ${vramTexsize} , 📐 ${res.data.avatarStats.totalPolygons} , 💡 ${res.data.avatarStats.lightCount} , 🥎 ${res.data.avatarStats.contactCount} , 🔊 ${res.data.avatarStats.audioSourceCount} , 🧲 ${res.data.avatarStats.blendShapeCount}`)

    // - Performance Marks-
    let totalavatareval = ``
    var warnbox = ''
    var boundsLongest = Math.round(Math.max(...res.data.avatarStats.bounds) / avatarStatWeights.boundsLongest)
    var animatorCount = Math.round(res.data.avatarStats.animatorCount / avatarStatWeights.animatorCount)
    var audioSourceCount = Math.round(res.data.avatarStats.audioSourceCount / avatarStatWeights.audioSourceCount)
    var boneCount = Math.round(res.data.avatarStats.boneCount / avatarStatWeights.boneCount)
    var cameraCount = Math.round(res.data.avatarStats.cameraCount / avatarStatWeights.cameraCount)
    var clothCount = Math.round(res.data.avatarStats.clothCount / avatarStatWeights.clothCount)
    var constraintCount = Math.round(res.data.avatarStats.constraintCount / avatarStatWeights.constraintCount)
    var constraintDepth = Math.round(res.data.avatarStats.constraintDepth / avatarStatWeights.constraintDepth)
    var lineRendererCount = Math.round(res.data.avatarStats.lineRendererCount / avatarStatWeights.lineRendererCount)
    var materialCount = Math.round(res.data.avatarStats.materialCount / avatarStatWeights.materialCount)
    var meshParticleMaxPolygons = Math.round(res.data.avatarStats.meshParticleMaxPolygons / avatarStatWeights.meshParticleMaxPolygons)
    var particleSystemCount = Math.round(res.data.avatarStats.particleSystemCount / avatarStatWeights.particleSystemCount)
    var physicsColliders = Math.round(res.data.avatarStats.physicsColliders / avatarStatWeights.physicsColliders)
    var physicsRigidbodies = Math.round(res.data.avatarStats.physicsRigidbodies / avatarStatWeights.physicsRigidbodies)
    var totalClothVertices = Math.round(res.data.avatarStats.totalClothVertices / avatarStatWeights.totalClothVertices)
    var totalMaxParticles = Math.round(res.data.avatarStats.totalMaxParticles / avatarStatWeights.totalMaxParticles)
    var trailRendererCount = Math.round(res.data.avatarStats.trailRendererCount / avatarStatWeights.trailRendererCount)
    var totalTextureUsage = res.data.avatarStats.totalTextureUsage / avatarStatWeights.totalTextureUsage
    var uncompressedSize = Math.round(res.data.uncompressedSize / avatarStatWeights.uncompressedSize)
    var totalPolygons = Math.round(res.data.avatarStats.totalPolygons / avatarStatWeights.totalPolygons)
    var skinnedMeshCount = Math.round(res.data.avatarStats.skinnedMeshCount / avatarStatWeights.skinnedMeshCount)
    var meshCount = Math.round(res.data.avatarStats.meshCount / avatarStatWeights.meshCount)
    var physBoneCollisionCheckCount = Math.round(res.data.avatarStats.physBoneCollisionCheckCount / avatarStatWeights.physBoneCollisionCheckCount)
    var physBoneColliderCount = Math.round(res.data.avatarStats.physBoneColliderCount / avatarStatWeights.physBoneColliderCount)
    var physBoneComponentCount = Math.round(res.data.avatarStats.physBoneComponentCount / avatarStatWeights.physBoneComponentCount)
    var physBoneTransformCount = Math.round(res.data.avatarStats.physBoneTransformCount / avatarStatWeights.physBoneTransformCount)
    var contactCount = Math.round(res.data.avatarStats.contactCount / avatarStatWeights.contactCount)
    var materialSlotsUsed = Math.round(res.data.avatarStats.materialSlotsUsed / avatarStatWeights.materialSlotsUsed)
    var lightCount = Math.round(res.data.avatarStats.lightCount / avatarStatWeights.lightCount)
    var blendShapeCount = Math.round(res.data.avatarStats.blendShapeCount / avatarStatWeights.blendShapeCount)
    var statPunish = []

    /*if (getInstanceGroupID() == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {
        if (res.data.avatarStats.totalTextureUsage > 83886080) {
            if (totalTextureUsage > avatarStatWeights.lowerLimitWeight) {
                warnbox += `\v(x${Math.round(totalTextureUsage)}) Texture Mem ${vramTexsize}`;
            }
            totalavatareval += `\n              Texture Memory:            ${Math.round(totalTextureUsage)} EV ${totalTextureUsage >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
        }
    } else {*/
    if (totalTextureUsage > avatarStatWeights.totalTextureUsage) {
        // warnbox += `\v(x${totalTextureUsage}) Texture Memory ${vramTexsize}`;
        statPunish.push({
            "weight": 0,
            "multi": Math.ceil(totalTextureUsage),
            "log": `\v(x${Math.round(totalTextureUsage)}) Texture Mem ${vramTexsize}`,
            "print": `\n              Texture Memory:            ${Math.round(totalTextureUsage)} EV ${totalTextureUsage >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
        })
        totalavatareval += `\n              Texture Memory:            ${Math.round(totalTextureUsage)} EV ${totalTextureUsage >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
    }
    if (totalPolygons > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${totalPolygons}) Polygons ${res.data.avatarStats.totalPolygons}`;
        statPunish.push({
            "weight": 1,
            "multi": Math.round(totalPolygons),
            "log": `\v(x${totalPolygons}) Polygons ${res.data.avatarStats.totalPolygons}`,
            "print": `\n              Polygons:                  ${totalPolygons} EV ${totalPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️📐' : ''}`
        })
        totalavatareval += `\n              Polygons:                  ${totalPolygons} EV ${totalPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️📐' : ''}`
    }
    if (boundsLongest > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${boundsLongest}) Bounds ${Math.max(...res.data.avatarStats.bounds)}m`;
        statPunish.push({
            "weight": 2,
            "multi": Math.round(boundsLongest),
            "log": `\v(x${boundsLongest}) Bounds ${Math.max(...res.data.avatarStats.bounds)}m`,
            "print": `\n              Bounds:                    ${boundsLongest} EV ${boundsLongest >= avatarStatWeights.higherLimitWeight ? '⚠️🧊' : ''}`
        })
        totalavatareval += `\n              Bounds:                    ${boundsLongest} EV ${boundsLongest >= avatarStatWeights.higherLimitWeight ? '⚠️🧊' : ''}`
    }
    if (skinnedMeshCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${skinnedMeshCount}) SkinnedMeshes ${res.data.avatarStats.skinnedMeshCount}`;
        statPunish.push({
            "weight": 3,
            "multi": Math.round(skinnedMeshCount),
            "log": `\v(x${skinnedMeshCount}) SkinnedMeshes ${res.data.avatarStats.skinnedMeshCount}`,
            "print": `\n              Skinned Meshes:            ${skinnedMeshCount} EV ${skinnedMeshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.skinnedMeshCount : ''}`
        })
        totalavatareval += `\n              Skinned Meshes:            ${skinnedMeshCount} EV ${skinnedMeshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.skinnedMeshCount : ''}`
    }
    if (meshCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${meshCount}) Basic Meshes ${res.data.avatarStats.meshCount}`;
        statPunish.push({
            "weight": 4,
            "multi": Math.round(meshCount),
            "log": `\v(x${meshCount}) Basic Meshes ${res.data.avatarStats.meshCount}`,
            "print": `\n              Basic Meshes:              ${meshCount} EV ${meshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshCount : ''}`
        })
        totalavatareval += `\n              Basic Meshes:              ${meshCount} EV ${meshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshCount : ''}`
    }
    if (materialSlotsUsed > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${materialSlotsUsed}) Material Slots ${res.data.avatarStats.materialSlotsUsed}`;
        statPunish.push({
            "weight": 5,
            "multi": Math.round(materialSlotsUsed),
            "log": `\v(x${materialSlotsUsed}) Material Slots ${res.data.avatarStats.materialSlotsUsed}`,
            "print": `\n              Material Slots:            ${materialSlotsUsed} EV ${materialSlotsUsed >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialSlotsUsed : ''}`
        })
        totalavatareval += `\n              Material Slots:            ${materialSlotsUsed} EV ${materialSlotsUsed >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialSlotsUsed : ''}`
    }
    if (materialCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${materialCount}) Material Count ${res.data.avatarStats.materialCount}`;
        statPunish.push({
            "weight": 6,
            "multi": Math.round(materialCount),
            "log": `\v(x${materialCount}) Material Count ${res.data.avatarStats.materialCount}`,
            "print": `\n              Material Count:            ${materialCount} EV ${materialCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialCount : ''}`
        })
        totalavatareval += `\n              Material Count:            ${materialCount} EV ${materialCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialCount : ''}`
    }
    if (physBoneComponentCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${physBoneComponentCount}) PhysBone Components ${res.data.avatarStats.physBoneComponentCount}`;
        statPunish.push({
            "weight": 7,
            "multi": Math.round(physBoneComponentCount),
            "log": `\v(x${physBoneComponentCount}) PhysBones ${res.data.avatarStats.physBoneComponentCount}`,
            "print": `\n              PhysBone Components:       ${physBoneComponentCount} EV ${physBoneComponentCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneComponentCount : ''}`
        })
        totalavatareval += `\n              PhysBone Components:       ${physBoneComponentCount} EV ${physBoneComponentCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneComponentCount : ''}`
    }
    if (physBoneTransformCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${physBoneTransformCount}) PhysBone Transforms ${res.data.avatarStats.physBoneTransformCount}`;
        statPunish.push({
            "weight": 8,
            "multi": Math.round(physBoneTransformCount),
            "log": `\v(x${physBoneTransformCount}) PhysBone Transforms ${res.data.avatarStats.physBoneTransformCount}`,
            "print": `\n              PhysBone Transforms:       ${physBoneTransformCount} EV ${physBoneTransformCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneTransformCount : ''}`
        })
        totalavatareval += `\n              PhysBone Transforms:       ${physBoneTransformCount} EV ${physBoneTransformCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneTransformCount : ''}`
    }
    if (physBoneColliderCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${physBoneColliderCount}) PhysBone Colliders ${res.data.avatarStats.physBoneColliderCount}`;
        statPunish.push({
            "weight": 9,
            "multi": Math.round(physBoneColliderCount),
            "log": `\v(x${physBoneColliderCount}) PhysBone Colliders ${res.data.avatarStats.physBoneColliderCount}`,
            "print": `\n              PhysBone Colliders:        ${physBoneColliderCount} EV ${physBoneColliderCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneColliderCount : ''}`
        })
        totalavatareval += `\n              PhysBone Colliders:        ${physBoneColliderCount} EV ${physBoneColliderCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneColliderCount : ''}`
    }
    if (physBoneCollisionCheckCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${physBoneCollisionCheckCount}) PhysBone Collision Checks ${res.data.avatarStats.physBoneCollisionCheckCount}`;
        statPunish.push({
            "weight": 10,
            "multi": Math.round(physBoneCollisionCheckCount),
            "log": `\v(x${physBoneCollisionCheckCount}) PhysBone Collisions ${res.data.avatarStats.physBoneCollisionCheckCount}`,
            "print": `\n              PhysBone Collision Checks: ${physBoneCollisionCheckCount} EV ${physBoneCollisionCheckCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneCollisionCheckCount : ''}`
        })
        totalavatareval += `\n              PhysBone Collision Checks: ${physBoneCollisionCheckCount} EV ${physBoneCollisionCheckCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneCollisionCheckCount : ''}`
    }
    if (contactCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${contactCount}) Contacts ${res.data.avatarStats.contactCount}`;
        statPunish.push({
            "weight": 11,
            "multi": Math.round(contactCount),
            "log": `\v(x${contactCount}) Contacts ${res.data.avatarStats.contactCount}`,
            "print": `\n              Contact Count:             ${contactCount} EV ${contactCount >= avatarStatWeights.higherLimitWeight ? '⚠️🥎' : ''}`
        })
        totalavatareval += `\n              Contact Count:             ${contactCount} EV ${contactCount >= avatarStatWeights.higherLimitWeight ? '⚠️🥎' : ''}`
    }
    if (constraintCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${constraintCount}) Constraints ${res.data.avatarStats.constraintCount}`;
        statPunish.push({
            "weight": 12,
            "multi": Math.round(constraintCount),
            "log": `\v(x${constraintCount}) Constraints ${res.data.avatarStats.constraintCount}`,
            "print": `\n              Constraint Count:           ${constraintCount} EV ${constraintCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintCount : ''}`
        })
        totalavatareval += `\n              Constraint Count:           ${constraintCount} EV ${constraintCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintCount : ''}`
    }
    if (constraintDepth > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${constraintDepth}) Constraint Depth ${res.data.avatarStats.constraintDepth}`;
        statPunish.push({
            "weight": 13,
            "multi": Math.round(constraintDepth),
            "log": `\v(x${constraintDepth}) Constraint Depth ${res.data.avatarStats.constraintDepth}`,
            "print": `\n              Constraint Depth:          ${constraintDepth} EV ${constraintDepth >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintDepth : ''}`
        })
        totalavatareval += `\n              Constraint Depth:          ${constraintDepth} EV ${constraintDepth >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintDepth : ''}`
    }
    if (animatorCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${animatorCount}) Animators ${res.data.avatarStats.animatorCount}`;
        statPunish.push({
            "weight": 14,
            "multi": Math.round(animatorCount),
            "log": `\v(x${animatorCount}) Animators ${res.data.avatarStats.animatorCount}`,
            "print": `\n              Animator Count:            ${animatorCount} EV ${animatorCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.animatorCount : ''}`
        })
        totalavatareval += `\n              Animator Count:            ${animatorCount} EV ${animatorCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.animatorCount : ''}`
    }
    if (boneCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${boneCount}) Bones ${res.data.avatarStats.boneCount}`;
        statPunish.push({
            "weight": 15,
            "multi": Math.round(boneCount),
            "log": `\v(x${boneCount}) Bones ${res.data.avatarStats.boneCount}`,
            "print": `\n              Bones:                     ${boneCount} EV ${boneCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.boneCount : ''}`
        })
        totalavatareval += `\n              Bones:                     ${boneCount} EV ${boneCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.boneCount : ''}`
    }
    if (lightCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${lightCount}) Light Count ${res.data.avatarStats.lightCount}`;
        statPunish.push({
            "weight": 16,
            "multi": Math.round(lightCount),
            "log": `\v(x${lightCount}) Light Count ${res.data.avatarStats.lightCount}`,
            "print": `\n              Light Count:               ${lightCount} EV ${lightCount >= avatarStatWeights.higherLimitWeight ? '⚠️💡' : ''}`
        })
        totalavatareval += `\n              Light Count:               ${lightCount} EV ${lightCount >= avatarStatWeights.higherLimitWeight ? '⚠️💡' : ''}`
    }
    if (particleSystemCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${particleSystemCount}) Particle Systems ${res.data.avatarStats.particleSystemCount}`;
        statPunish.push({
            "weight": 17,
            "multi": Math.round(particleSystemCount),
            "log": `\v(x${particleSystemCount}) Particle Systems ${res.data.avatarStats.particleSystemCount}`,
            "print": `\n              Particle System Count:     ${particleSystemCount} EV ${particleSystemCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.particleSystemCount : ''}`
        })
        totalavatareval += `\n              Particle System Count:     ${particleSystemCount} EV ${particleSystemCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.particleSystemCount : ''}`
    }
    if (totalMaxParticles > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${totalMaxParticles}) Max Particles ${res.data.avatarStats.totalMaxParticles}`;
        statPunish.push({
            "weight": 18,
            "multi": Math.round(totalMaxParticles),
            "log": `\v(x${totalMaxParticles}) Max Particles ${res.data.avatarStats.totalMaxParticles}`,
            "print": `\n              Max Particles:             ${totalMaxParticles} EV ${totalMaxParticles >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalMaxParticles : ''}`
        })
        totalavatareval += `\n              Max Particles:             ${totalMaxParticles} EV ${totalMaxParticles >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalMaxParticles : ''}`
    }
    if (meshParticleMaxPolygons > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${meshParticleMaxPolygons}) Particle Polygons ${res.data.avatarStats.meshParticleMaxPolygons}`;
        statPunish.push({
            "weight": 19,
            "multi": Math.round(meshParticleMaxPolygons),
            "log": `\v(x${meshParticleMaxPolygons}) Particle Polys ${res.data.avatarStats.meshParticleMaxPolygons}`,
            "print": `\n              Mesh Particle Max Polygons:${meshParticleMaxPolygons} EV ${meshParticleMaxPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshParticleMaxPolygons : ''}`
        })
        totalavatareval += `\n              Mesh Particle Max Polygons:${meshParticleMaxPolygons} EV ${meshParticleMaxPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshParticleMaxPolygons : ''}`
    }
    if (trailRendererCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${trailRendererCount}) Trail Renderers ${res.data.avatarStats.trailRendererCount}`;
        statPunish.push({
            "weight": 20,
            "multi": Math.round(trailRendererCount),
            "log": `\v(x${trailRendererCount}) Trail Renderers ${res.data.avatarStats.trailRendererCount}`,
            "print": `\n              Trail Renderer Count:      ${trailRendererCount} EV ${trailRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.trailRendererCount : ''}`
        })
        totalavatareval += `\n              Trail Renderer Count:      ${trailRendererCount} EV ${trailRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.trailRendererCount : ''}`
    }
    if (lineRendererCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${lineRendererCount}) Line Renderers ${res.data.avatarStats.lineRendererCount}`;
        statPunish.push({
            "weight": 21,
            "multi": Math.round(lineRendererCount),
            "log": `\v(x${lineRendererCount}) Line Renderers ${res.data.avatarStats.lineRendererCount}`,
            "print": `\n              Line Renderer Count:       ${lineRendererCount} EV ${lineRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.lineRendererCount : ''}`
        })
        totalavatareval += `\n              Line Renderer Count:       ${lineRendererCount} EV ${lineRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.lineRendererCount : ''}`
    }
    if (clothCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${clothCount}) Cloth Meshes ${res.data.avatarStats.clothCount}`;
        statPunish.push({
            "weight": 22,
            "multi": Math.round(clothCount),
            "log": `\v(x${clothCount}) Cloth Meshes ${res.data.avatarStats.clothCount}`,
            "print": `\n              Cloth Meshes:               ${clothCount} EV ${clothCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.clothCount : ''}`
        })
        totalavatareval += `\n              Cloth Meshes:               ${clothCount} EV ${clothCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.clothCount : ''}`
    }
    if (totalClothVertices > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${totalClothVertices}) Cloth Vertices ${res.data.avatarStats.totalClothVertices}`;
        statPunish.push({
            "weight": 23,
            "multi": Math.round(totalClothVertices),
            "log": `\v(x${totalClothVertices}) Cloth Vertices ${res.data.avatarStats.totalClothVertices}`,
            "print": `\n              Cloth Vertices:            ${totalClothVertices} EV ${totalClothVertices >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalClothVertices : ''}`
        })
        totalavatareval += `\n              Cloth Vertices:            ${totalClothVertices} EV ${totalClothVertices >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalClothVertices : ''}`
    }
    if (physicsColliders > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${physicsColliders}) Unity Colliders ${res.data.avatarStats.physicsColliders}`;
        statPunish.push({
            "weight": 24,
            "multi": Math.round(physicsColliders),
            "log": `\v(x${physicsColliders}) Unity Colliders ${res.data.avatarStats.physicsColliders}`,
            "print": `\n              Physics Colliders:         ${physicsColliders} EV ${physicsColliders >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsColliders : ''}`
        })
        totalavatareval += `\n              Physics Colliders:         ${physicsColliders} EV ${physicsColliders >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsColliders : ''}`
    }
    if (physicsRigidbodies > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${physicsRigidbodies}) Rigidbodies ${res.data.avatarStats.physicsRigidbodies}`;
        statPunish.push({
            "weight": 25,
            "multi": Math.round(physicsRigidbodies),
            "log": `\v(x${physicsRigidbodies}) Rigidbodies ${res.data.avatarStats.physicsRigidbodies}`,
            "print": `\n              Physics Rigidbodies:       ${physicsRigidbodies} EV ${physicsRigidbodies >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsRigidbodies : ''}`
        })
        totalavatareval += `\n              Physics Rigidbodies:       ${physicsRigidbodies} EV ${physicsRigidbodies >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsRigidbodies : ''}`
    }
    if (audioSourceCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${audioSourceCount}) AudioSources ${res.data.avatarStats.audioSourceCount}`;
        statPunish.push({
            "weight": 26,
            "multi": Math.round(audioSourceCount),
            "log": `\v(x${audioSourceCount}) AudioSources ${res.data.avatarStats.audioSourceCount}`,
            "print": `\n              AudioSource Count:         ${audioSourceCount} EV ${audioSourceCount >= avatarStatWeights.higherLimitWeight ? '⚠️🔊' : ''}`
        })
        totalavatareval += `\n              AudioSource Count:         ${audioSourceCount} EV ${audioSourceCount >= avatarStatWeights.higherLimitWeight ? '⚠️🔊' : ''}`
    }
    if (rayCasts > avatarStatWeights.lowerLimitWeight) {
        statPunish.push({
            "weight": 27,
            "multi": Math.round(rayCasts),
            "log": `\v(x${rayCasts}) Raycasts ${res.data.avatarStats.rayCastCount}`,
            "print": `\n              Raycasts: ${rayCasts} EV ${rayCasts >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.rayCastCount : ''}`
        })
        totalavatareval += `\n              Raycasts: ${rayCasts} EV ${rayCasts >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.rayCastCount : ''}`
    }
    if (blendShapeCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${blendShapeCount}) BlendShapes ${res.data.avatarStats.blendShapeCount}`;
        statPunish.push({
            "weight": 28,
            "multi": Math.round(blendShapeCount),
            "log": `skip`,
            // "log": `\v(x${blendShapeCount}) BlendShapes ${res.data.avatarStats.blendShapeCount}`,
            "print": `\n              BlendShapes:               ${blendShapeCount} EV ${blendShapeCount >= avatarStatWeights.higherLimitWeight ? '⚠️🧲' : ''}`
        })
        totalavatareval += `\n              BlendShapes:               ${blendShapeCount} EV ${blendShapeCount >= avatarStatWeights.higherLimitWeight ? '⚠️🧲' : ''}`
    }
    if (cameraCount > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${cameraCount}) Cameras ${res.data.avatarStats.cameraCount}`;
        statPunish.push({
            "weight": 29,
            "multi": Math.round(cameraCount),
            "log": `skip`,
            // "log": `\v(x${cameraCount}) Cameras ${res.data.avatarStats.cameraCount}`,
            "print": `\n              Camera Count:              ${cameraCount} EV ${cameraCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.cameraCount : ''}`
        })
        totalavatareval += `\n              Camera Count:              ${cameraCount} EV ${cameraCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.cameraCount : ''}`
    }
    if (uncompressedSize > avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\v(x${uncompressedSize}) RAM ${uncompresssize}`;
        statPunish.push({
            "weight": 30,
            "multi": Math.round(uncompressedSize),
            "log": `skip`,
            // "log": `\v(x${uncompressedSize}) RAM ${uncompresssize}`,
            "print": `\n              Uncompressed Size:         ${uncompressedSize} EV ${uncompressedSize >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
        })
        totalavatareval += `\n              Uncompressed Size:         ${uncompressedSize} EV ${uncompressedSize >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
    }

    var statPunished = statPunish.sort((a, b) => {
        const sortmulti = b.multi - a.multi; if (sortmulti !== 0) { return sortmulti }
        const sortweight = a.weight - b.weight; if (sortweight !== 0) { return sortweight }
    }).filter(r => r.multi >= 2 && r.log != 'skip')
    var statTotalAvatarEV = statPunish.sort((a, b) => {
        const sortmulti = b.multi - a.multi; if (sortmulti !== 0) { return sortmulti }
        const sortweight = a.weight - b.weight; if (sortweight !== 0) { return sortweight }
    })


    if (statTotalAvatarEV.length > 0) { console.log(statTotalAvatarEV.map(e => { return e.print }).toString().replace(/\n/, '')) }
    if (statPunished.length > 0 && statWarnings == true) {
        // if (warnbox.length > 0) {
        oscChatBoxV2(`${fitChars(res.data.name)}${fitChars(statPunished[0].log)}${fitChars(statPunished[1]?.log)}${fitChars(statPunished[2]?.log)}`, 15000, false, true, false, false, true)
    }

    // Summary Chart Data
    avatarStatSummary.totalAvatars++
    avatarStatSummary[res.data.performanceRating]++
    Object.keys(avatarStatSummary.stats).forEach((key, index, arr) => {
        if (key == 'uncompressedSize') {
            avatarStatSummary.stats['uncompressedSize'].values.push(res.data.uncompressedSize)
        } else if (key == 'fileSize') {
            avatarStatSummary.stats['fileSize'].values.push(res.data.fileSize)
        } else if (key == 'boundsLongest') {
            avatarStatSummary.stats['boundsLongest'].values.push(Math.round(Math.max(...res.data.avatarStats.bounds) * 100) / 100)
        } else {
            avatarStatSummary.stats[key].values.push(res.data.avatarStats[key])
        }
    })

}

async function scanAllAvatarStats() {
    console.time('Full-Avatar-Scan')

    G_lastlocation = `All Avatar Stats in Cache`

    var fsrddir = await fsp.readdir('./datasets/avatarStatCache/', 'utf8')
    for (const findex in fsrddir) {
        var res = {}
        // console.log('Opening: ', findex)
        var fd;
        try {
            fd = await fsp.open('./datasets/avatarStatCache/' + fsrddir[findex], 'r')
            var fsrdfile = await fd.readFile('utf8')
            // var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + file, 'utf8')
            console.log(`${loglv().log}${selflogA} [AvatarAnalysis] Cached: ${fsrddir[findex]}`)
            res.data = JSON.parse(fsrdfile)
        } catch (error) {
            console.log(`${loglv().warn}${selflogA} [AvatarAnalysis] `, error)
        } finally {
            if (fd) {
                await fd.close()
                // console.log('Closed: ', findex)
            }
        }

        let filesize = await formatBytes(res.data?.fileSize)
        let uncompresssize = await formatBytes(res.data.uncompressedSize)
        let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
        console.log(`${loglv().log}${selflogA} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
             📦 ${filesize} , 🗃️ ${uncompresssize} , 🐏 ${vramTexsize} , 📐 ${res.data.avatarStats.totalPolygons} , 💡 ${res.data.avatarStats.lightCount} , 🥎 ${res.data.avatarStats.contactCount} , 🔊 ${res.data.avatarStats.audioSourceCount} , 🧲 ${res.data.avatarStats.blendShapeCount} , 🧊 ${res.data.avatarStats.bounds.map(Math.ceil)}`)
        // Summary Chart Data
        avatarStatSummary.totalAvatars++
        avatarStatSummary[res.data.performanceRating]++
        Object.keys(avatarStatSummary.stats).forEach((key, index, arr) => {
            if (key == 'uncompressedSize') {
                avatarStatSummary.stats['uncompressedSize'].values.push(res.data.uncompressedSize)
            } else if (key == 'fileSize') {
                avatarStatSummary.stats['fileSize'].values.push(res.data.fileSize)
            } else if (key == 'boundsLongest') {
                avatarStatSummary.stats['boundsLongest'].values.push(Math.round(Math.max(...res.data.avatarStats.bounds)))
            } else {
                avatarStatSummary.stats[key].values.push(res.data.avatarStats[key])
            }
        })

        // console.log('progress: ', findex, fsrddir.length-1)
        if (findex == fsrddir.length - 1) {
            console.timeEnd('Full-Avatar-Scan')
            setTimeout(() => {
                requestAvatarStatTable(false, 0.05, true)
            }, 2000)
            setTimeout(() => {
                avatarStatSummary = {
                    "totalAvatars": 0,
                    "checkedFileIDs": [],
                    "seenAuthors": [{
                        "id": "", "displayName": ""
                    }],
                    "seenAvatars": [{
                        "name": "", "author": null, "wearers": [], "lastAccessed": 0
                    }],
                    "Excellent": 0,
                    "Good": 0,
                    "Medium": 0,
                    "Poor": 0,
                    "VeryPoor": 0,
                    "stats": {
                        "totalPolygons": { "label": "Polygons", "values": [] },
                        "boundsLongest": { "label": "Bounds (Longest Edge)", "values": [] },
                        "skinnedMeshCount": { "label": "Skinned Meshes", "values": [] },
                        "meshCount": { "label": "Basic Meshes", "values": [] },
                        "materialSlotsUsed": { "label": "Material Slots", "values": [] },
                        "materialCount": { "label": "Material Count", "values": [] },
                        "physBoneColliderCount": { "label": "PhysBone Colliders", "values": [] },
                        "physBoneCollisionCheckCount": { "label": "PhysBone Collision Checks", "values": [] },
                        "physBoneComponentCount": { "label": "PhysBone Components", "values": [] },
                        "physBoneTransformCount": { "label": "PhysBone Transforms", "values": [] },
                        "contactCount": { "label": "Contacts", "values": [] },
                        "constraintCount": { "label": "Constraint Count", "values": [] },
                        "constraintDepth": { "label": "Constraint Depth", "values": [] },
                        "animatorCount": { "label": "Animators", "values": [] },
                        "boneCount": { "label": "Bones", "values": [] },
                        "lightCount": { "label": "Lights", "values": [] },
                        "particleSystemCount": { "label": "Particle Systems", "values": [] },
                        "totalMaxParticles": { "label": "Max Particles", "values": [] },
                        "meshParticleMaxPolygons": { "label": "Particle Max Polygons", "values": [] },
                        "trailRendererCount": { "label": "Trail Renderers", "values": [] },
                        "lineRendererCount": { "label": "Line Renderers", "values": [] },
                        "clothCount": { "label": "Cloth Count", "values": [] },
                        "totalClothVertices": { "label": "Cloth Vertices", "values": [] },
                        "physicsColliders": { "label": "Unity Colliders", "values": [] },
                        "physicsRigidbodies": { "label": "Rigidbodies", "values": [] },
                        "audioSourceCount": { "label": "AudioSources", "values": [] },
                        "blendShapeCount": { "label": "BlendShapes", "values": [] },
                        "cameraCount": { "label": "Cameras", "values": [] },
                        "totalTextureUsage": { "label": "Texture Memory (VRAM)", "values": [] },
                        "fileSize": { "label": "Download Size", "values": [] },
                        "uncompressedSize": { "label": "Uncompressed Size (RAM)", "values": [] }
                    }
                }
            }, 10_000)
        }

    }
}

async function scanListAvatarStats(I_list = []) {

    G_lastlocation = `Specific List of Avatar Stats from Cache`

    var fsrddir = I_list
    fsrddir.forEach(async (file, index, arr) => {
        var res = {}
        var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + file + '.json', 'utf8')
        console.log(`${loglv().log}${selflogA} [AvatarAnalysis] Cached: ${file}`)
        res.data = JSON.parse(fsrdfile)


        let filesize = await formatBytes(res.data.fileSize)
        let uncompresssize = await formatBytes(res.data.uncompressedSize)
        let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
        console.log(`${loglv().log}${selflogA} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
             📦 ${filesize} , 🗃️ ${uncompresssize} , 🐏 ${vramTexsize} , 📐 ${res.data.avatarStats.totalPolygons} , 💡 ${res.data.avatarStats.lightCount} , 🥎 ${res.data.avatarStats.contactCount} , 🔊 ${res.data.avatarStats.audioSourceCount} , 🧲 ${res.data.avatarStats.blendShapeCount} , 🧊 ${res.data.avatarStats.bounds.map(Math.ceil)}`)

        // Summary Chart Data
        avatarStatSummary.totalAvatars++
        avatarStatSummary[res.data.performanceRating]++
        Object.keys(avatarStatSummary.stats).forEach((key, index, arr) => {
            if (key == 'uncompressedSize') {
                avatarStatSummary.stats['uncompressedSize'].values.push(res.data.uncompressedSize)
            } else if (key == 'fileSize') {
                avatarStatSummary.stats['fileSize'].values.push(res.data.fileSize)
            } else if (key == 'boundsLongest') {
                avatarStatSummary.stats['boundsLongest'].values.push(Math.round(Math.max(...res.data.avatarStats.bounds)))
            } else {
                avatarStatSummary.stats[key].values.push(res.data.avatarStats[key])
            }
        })

        if (index == arr.length - 1) {
            setTimeout(() => {
                requestAvatarStatTable(false, 0.05, true)
            }, 2000)
            setTimeout(() => {
                avatarStatSummary = {
                    "totalAvatars": 0,
                    "checkedFileIDs": [],
                    "seenAuthors": [{
                        "id": "", "displayName": ""
                    }],
                    "seenAvatars": [{
                        "name": "", "author": null, "wearers": [], "lastAccessed": 0
                    }],
                    "Excellent": 0,
                    "Good": 0,
                    "Medium": 0,
                    "Poor": 0,
                    "VeryPoor": 0,
                    "stats": {
                        "totalPolygons": { "label": "Polygons", "values": [] },
                        "boundsLongest": { "label": "Bounds (Longest Edge)", "values": [] },
                        "skinnedMeshCount": { "label": "Skinned Meshes", "values": [] },
                        "meshCount": { "label": "Basic Meshes", "values": [] },
                        "materialSlotsUsed": { "label": "Material Slots", "values": [] },
                        "materialCount": { "label": "Material Count", "values": [] },
                        "physBoneColliderCount": { "label": "PhysBone Colliders", "values": [] },
                        "physBoneCollisionCheckCount": { "label": "PhysBone Collision Checks", "values": [] },
                        "physBoneComponentCount": { "label": "PhysBone Components", "values": [] },
                        "physBoneTransformCount": { "label": "PhysBone Transforms", "values": [] },
                        "contactCount": { "label": "Contacts", "values": [] },
                        "constraintCount": { "label": "Constraint Count", "values": [] },
                        "constraintDepth": { "label": "Constraint Depth", "values": [] },
                        "animatorCount": { "label": "Animators", "values": [] },
                        "boneCount": { "label": "Bones", "values": [] },
                        "lightCount": { "label": "Lights", "values": [] },
                        "particleSystemCount": { "label": "Particle Systems", "values": [] },
                        "totalMaxParticles": { "label": "Max Particles", "values": [] },
                        "meshParticleMaxPolygons": { "label": "Particle Max Polygons", "values": [] },
                        "trailRendererCount": { "label": "Trail Renderers", "values": [] },
                        "lineRendererCount": { "label": "Line Renderers", "values": [] },
                        "clothCount": { "label": "Cloth Count", "values": [] },
                        "totalClothVertices": { "label": "Cloth Vertices", "values": [] },
                        "physicsColliders": { "label": "Unity Colliders", "values": [] },
                        "physicsRigidbodies": { "label": "Rigidbodies", "values": [] },
                        "audioSourceCount": { "label": "AudioSources", "values": [] },
                        "blendShapeCount": { "label": "BlendShapes", "values": [] },
                        "cameraCount": { "label": "Cameras", "values": [] },
                        "totalTextureUsage": { "label": "Texture Memory (VRAM)", "values": [] },
                        "fileSize": { "label": "Download Size", "values": [] },
                        "uncompressedSize": { "label": "Uncompressed Size (RAM)", "values": [] }
                    }
                }
            }, 10_000)
        }

    })
}

async function collectActiveInstanceStats(skipLaunch = false) {
    var instanceList = []
    // Active World List
    var activeworlds = await limiter.req(vrchat.getActiveWorlds({ 'query': { 'n': 100, 'order': 'ascending' } }))
    // Worlds Data
    for (const wrld in activeworlds.data) {
        console.log(`${loglv().log}${selflogA} [BulkStatCollection] World Target: ${activeworlds.data[wrld].name}`)
        var maxPlayers = activeworlds.data[wrld].capacity
        var gotworld = await limiter.req(vrchat.getWorld({ 'path': { 'worldId': activeworlds.data[wrld].id } }))

        // Instances Data
        for (const ints in gotworld.data.instances) {
            // Within Player count range
            if (gotworld.data.instances[ints][1] >= 5 && gotworld.data.instances[ints][1] < (maxPlayers - 2)) {
                var location = `${activeworlds.data[wrld].id}:${gotworld.data.instances[ints][0]}`
                // console.log(`${loglv().log}${selflog} [BulkStatCollection] ${wrld} ${ints}`)
                await gotoInstance(location)
            }
        }
    }
    console.log(`${loglv().log}${selflogA} [BulkStatCollection] Finished Collecting Stats.. Going Home.`)
    if (skipLaunch == false) {
        startvrc('wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5:91151~private(usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752)~canRequestInvite~region(use)', true)
    }

    async function gotoInstance(I_instanceLocation) {
        return new Promise(async (resolve, reject) => {
            var gotinstance = await limiter.req(vrchat.getInstance({ 'path': { 'worldId': I_instanceLocation.split(':')[0], 'instanceId': I_instanceLocation.split(':')[1] } }))
            // console.debug(gotinstance.data)
            if (gotinstance.data.full == false && gotinstance.data.n_users >= 5 && gotinstance.data.userCount >= 5 && gotinstance.data.closedAt == null) {
                console.log(`${loglv().log}${selflogA} [BulkStatCollection] Traveling to ${I_instanceLocation.split(':')[1].slice(0, 63)}`)
                if (skipLaunch == false) {
                    startvrc(I_instanceLocation, true)
                    logEmitter.once('joinedworld', async () => {
                        // console.debug('JOINED WORLD');
                        // logEmitter.once('notAllowedToTravel', () => { console.debug('NOT ALLOWED TO TRAVEL'); resolve(true) })
                        await once(logEmitter, 'avatarQueueFinish')
                        resolve(true)
                    })
                } else {
                    setTimeout(() => {
                        resolve(true)
                    }, 30_000);
                }

            } else if (gotinstance.data.closedAt != null) {
                console.log(`${loglv().log}${selflogA} [BulkStatCollection] Instance Closed: - ${I_instanceLocation.split(':')[1].slice(0, 57)}`)
                setTimeout(() => { resolve(true) }, 2_000)
            } else if (gotinstance.data.n_users < 5 || gotinstance.data.userCount < 5) {
                console.log(`${loglv().log}${selflogA} [BulkStatCollection] Not enough people: - ${I_instanceLocation.split(':')[1].slice(0, 55)}`)
                setTimeout(() => { resolve(true) }, 2_000)
            } else {
                console.log(`${loglv().log}${selflogA} [BulkStatCollection] Instance Full: - ${I_instanceLocation.split(':')[1].slice(0, 59)}`)
                setTimeout(() => { resolve(true) }, 2_000)
            }
        })
    }

}

async function worldAutoPreloadQueue(worldList = []) {
    console.log(`${loglv().log}${selflogA} [Auto World Preload] Starting, have ${worldList.length} worlds to go through`)
    setUserStatus('Preloading worlds')
    for (const wrd in worldList) {
        await joinWorld(worldList[wrd])
        if (wrd == worldList.length - 1) {
            console.log(`${loglv().hey}${selflogA} [Auto World Preload] Finished, can close VRC if want.`)
            oscChatBoxV2(`Automatic Preload has finished \v Can close VRC if want.`, 30_000)
            setUserStatus('')
        }
    }
    async function joinWorld(world) {
        return new Promise((resolve, reject) => {
            console.log(`${loglv().hey}${selflogA} [Auto World Preload] Creating Preload Instance for ${world}`)
            vrchat.createInstance({
                body: {
                    'worldId': world,
                    'type': 'hidden',
                    'region': 'use',
                    // 'displayName': 'Preloading Worlds',
                    'minimumAvatarPerformance': 'Poor',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752'
                }
            }).then(created_instance => {
                startvrc(created_instance.data.location, true)
            }).catch((err) => {
                console.log(`${loglv().warn}${selflogA}` + err)
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

function queueInstanceDataBurst() {
    // BUFFER COST 5
    if (getOSCDataBurstState() != 'overloaded' && vrchatRunning == true) {
        OSCDataBurst(7, parseFloat((playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[0] == 0 ? 10 : (playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[0]) / 10)
        OSCDataBurst(8, parseFloat((playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[1]) / 10)
        OSCDataBurst(9, parseFloat((playerHardLimit > 80 ? 80 : playerHardLimit) < 10 ? (playerHardLimit > 80 ? 80 : playerHardLimit) : (playerHardLimit > 80 ? 80 : playerHardLimit).toString()[0]) / 10)
        OSCDataBurst(10, parseFloat((playerHardLimit > 80 ? 80 : playerHardLimit) < 10 ? 10 : (playerHardLimit > 80 ? 80 : playerHardLimit).toString()[1]) / 10)
        OSCDataBurst(11, parseFloat(playerRatio))
    }
    // membersInInstance.length
    // memberRatio
}

oscEmitter.on('osc', (addr, value) => {
    if (addr == `/avatar/parameters/api/explore/start` && value == true) { inviteHubQueue() }
    if (addr == `/avatar/parameters/api/explore/next` && value == true) {
        if (exploreMode == true) {
            clearTimeout(exploreNextCountDownTimer)
            exploreNextCountDownTimer = null
            inviteOnlineWorlds_Loop(worldsToExplore[0]);
        } else if (exploreMode == false) {
            inviteLocalQueue()
        }
    }
    // if (address == `/avatar/parameters/api/explore/hub` && value == true) { }
    if (addr == `/avatar/parameters/api/explore/stop` && value == true) {
        apiEmitter.emit('switch', 0, 'world')
        if (exploreMode == true) {
            console.log(`${loglv().hey}${selflogA} Explore Mode: Disabled - Avatar Trigger`)
            clearTimeout(exploreNextCountDownTimer)
            exploreNextCountDownTimer = null
            exploreMode = false
        }
    }
    if (addr == `/avatar/parameters/api/explore/prefill` && value == true) { addLabWorldsToLocalQueue() }
    if (addr == `/avatar/parameters/api/explore/privacy` && value == 0) { explorePrivacyLevel = 0 }
    if (addr == `/avatar/parameters/api/explore/privacy` && value == 1) { explorePrivacyLevel = 1 }
    if (addr == `/avatar/parameters/api/explore/privacy` && value == 2) { explorePrivacyLevel = 2 }
    if (addr == `/avatar/parameters/api/explore/privacy` && value == 3) { explorePrivacyLevel = 3 }
    if (addr == `/avatar/parameters/api/requestall` && value == true) { requestAllOnlineFriends(currentUser) }
    if (addr == '/avatar/parameters/api/favWorld' && value != 0) {
        if (G_worldID == '') { console.error('No World ID in location buffer'); return }
        var wrld_fav = {}
        fs.readFile('./datasets/wrld_fav.json', 'utf8', (err, data) => {
            if (err) { console.error(err); return }
            wrld_fav = JSON.parse(data)
            // console.debug(wrld_fav)
            switch (value) {
                case 1:
                    oscChatBoxV2('Added world to "Approve" list', 2000, false, true, undefined, false);
                    wrld_fav["1_Approve"].push(G_worldID); break;
                case 2:
                    oscChatBoxV2('Added world to "Likes" list', 2000, false, true, undefined, false);
                    wrld_fav["2_Likes"].push(G_worldID); break;
                case 3:
                    oscChatBoxV2('Added world to "Love / Show Off" list', 2000, false, true, undefined, false);
                    wrld_fav["3_Love_ShowOff"].push(G_worldID); break;
                case 4:
                    oscChatBoxV2('Added world to "Games & Activity" list', 2000, false, true, undefined, false);
                    wrld_fav["4_Game_Activity"].push(G_worldID); break;
                default: break;
            }
            fs.writeFile('./datasets/wrld_fav.json', JSON.stringify(wrld_fav), 'utf8', (err) => { if (err) { console.error(err) } })
        })
    }

})
oscEmitter.on('avatar', (avtrID) => {
    if (['avtr_305ddd5d-d1f9-4adb-a025-50c2f1a9d219',
        `avtr_5c866609-f49a-4867-ac74-5dab03d5d713`,
        `avtr_75c670ca-4614-4db2-a687-e27994acb0ac`,
        'avtr_6b25124e-e141-4df4-ad27-22766608e5dc',
    ].includes(avtrID)) {
        queueInstanceDataBurst()
        oscSend('/avatar/parameters/log/instance_closed', worldID_Closed)
        applyGroupLogo(G_groupID)
    }
});

async function addLabWorldsToQueue() {
    console.log(`${loglv().log}${selflogA} Compiling world list..`)
    let { data: fav1 } = await limiter.req(vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 0 } }))
    let { data: fav2 } = await limiter.req(vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 100 } }))
    let { data: fav3 } = await limiter.req(vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 200 } }))
    let { data: fav4 } = await limiter.req(vrchat.getFavoritedWorlds({ query: { n: 100, sort: 'random', offset: 300 } }))
    let favworldsAll = fav1.concat(fav2, fav3, fav4)
    let favWorlds1 = favworldsAll.filter(favworldsAll => favworldsAll.favoriteGroup == 'worlds1')
    console.log(`${loglv().log}${selflogA} ${favWorlds1.length} worlds to explore.`)

    if (100 - (favWorlds1.length) >= 1) {
        console.log(`${loglv().log}${selflogA} Adding ${100 - (favWorlds1.length)} Community Labs worlds to queue`)
        let { data: worldData } = await limiter.req(vrchat.searchWorlds({ query: { n: 100 - (favWorlds1.length), sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } }))
        worldData.forEach((w, index, arr) => {
            setTimeout(() => {
                console.log(`${loglv().log}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
                vrchat.addFavorite({ body: { favoriteId: w.id, tags: 'worlds1', type: 'world' } })
            }, 5_000 * index)
        })
    }
}
async function addLabWorldsToLocalQueue() {
    console.log(`${loglv().log}${selflogA} Adding 100 Community Labs worlds to queue`)
    console.log(`${loglv().log}${selflogA} Adding 100 New-and-Noteworthy worlds to queue`)
    let { data: worldData } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } }))
    let { data: newAndNote } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, sort: 'heat', order: 'descending', offset: 0, tag: 'system_approved,system_published_recently' } }))
    fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
        let localQueueList = data.split(`\r\n`)
        let lastInQueue = localQueueList[localQueueList.length - 2]
        // console.log(lastInQueue)

        let worldlist = ''
        let skipAdd = false
        worldData.forEach((w, index, arr) => {
            console.log(`${loglv().log}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
            // console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
            lastInQueue == w.id ? skipAdd = true : ''
            index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
        })
        newAndNote.forEach((w, index, arr) => {
            console.log(`${loglv().log}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
            // console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
            lastInQueue == w.id ? skipAdd = true : ''
            index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
        })

        if (worldlist.includes(lastInQueue) || skipAdd == true) {
            console.log(`${loglv().hey}${selflogA} Cancelled list appendage, Queue already contains part of latest batch`)
            oscChatBoxV2(`Cancelled queue append:\v Queue already contains latest labs batch`, 5000, true, true, false, false, false)

        } else {
            fs.appendFile(worldQueueTxt, `\r\n` + worldlist, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
        }
    })
}
async function addSearchToLocalQueue(i_searchString) {
    console.log(`${loglv().log}${selflogA} Adding searched worlds to queue`)
    let { data: worldData } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, search: i_searchString, sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } }))
    let { data: worldData2 } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, search: i_searchString, order: 'descending', offset: 0, notag: 'system_labs' } }))
    fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
        let localQueueList = data.split(`\r\n`)
        let lastInQueue = localQueueList[localQueueList.length - 2]
        // console.log(lastInQueue)

        let worldlist = ''
        let skipAdd = false
        worldData.forEach((w, index, arr) => {
            console.log(`${loglv().log}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
            // console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
            lastInQueue == w.id ? skipAdd = true : ''
            index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
        })
        worldData2.forEach((w, index, arr) => {
            console.log(`${loglv().log}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
            // console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
            lastInQueue == w.id ? skipAdd = true : ''
            index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
        })
        fs.appendFile(worldQueueTxt, `\r\n` + worldlist, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
    })
}
function inviteHubQueue() {
    var instanceBody = {
        'worldId': 'wrld_112c5336-0329-4293-83ac-96f37f8a6405',
        'type': 'group',
        'region': 'use',
        // 'displayName': 'World Hop',
        'minimumAvatarPerformance': 'Poor',
        'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
        'groupAccessType': 'plus',
        'queueEnabled': true
    }

    console.log(`${loglv().hey}${selflogA} Creating group instance for wrld_112c5336-0329-4293-83ac-96f37f8a6405`)

    vrchat.createInstance({ body: instanceBody })
        .then(created_instance => { startvrc(created_instance.data.location, false) })
        .catch(err => { console.log(`${loglv().warn}${selflogA}` + err) })
}

function inviteLocalQueue(I_autoNext = false) {
    fs.readFile(worldQueueTxt, 'utf8', async (err, data) => {
        // err ? console.log(err); return : ''
        let localQueueList = data.split('\r\n===')[0].split(`\r\n`)
        if (localQueueList.length == 0) {
            console.log(`${loglv().hey}${selflogA} Explore queue is empty${data.includes('===') ? `: Remove bookmark` : ``}`);
            oscChatBoxV2(`~Explore Queue is empty${data.includes('===') ? `\vRemove bookmark.` : ``}`, 5000, true, true, false, false, false);
            return
        }
        let randnum = Math.round(Math.random() * (localQueueList.length - 1))
        let world_id = localQueueList[randnum]

        let extimelow = Math.floor((localQueueList.length * 2) / 60)
        let extimehig = Math.floor((localQueueList.length * 10) / 60)
        console.log(`${loglv().log}${selflogA} ${localQueueList.length} worlds to explore. [${extimelow} to ${extimehig} Hours]`)
        apiEmitter.emit('switch', localQueueList.length, 'world')

        let { data: checkCap } = await limiter.req(vrchat.getWorld({ 'path': { 'worldId': world_id } }))
        if (checkCap == undefined) {
            console.log(`${loglv().hey}${selflogA} World failed to fetch. Try again..`);
            oscChatBoxV2(`World fetch failed.\vTry another.`, 5000, true, true, false, false, false)
            fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
                if (data.includes(world_id)) {
                    fs.writeFile(worldQueueTxt, data.replace(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
                }
            })
            return
        } else if (checkCap.capacity < getPlayersInInstance().length && getInstanceGroupID() == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
            console.log(`${loglv().hey}${selflogA} World can not fit everyone. Retry..`);
            oscChatBoxV2(`World fetch failed.\vTry another.`, 5000, true, true, false, false, false)
            return
        }

        var instanceBody = {}
        switch (explorePrivacyLevel) {
            case 0:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'group',
                    'region': 'use',
                    // 'displayName': 'World Hop',
                    'minimumAvatarPerformance': 'Poor',
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
                    // 'displayName': 'World Hop',
                    'minimumAvatarPerformance': 'Poor',
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
                    // 'displayName': 'World Hop',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752',
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
            default:
                instanceBody = {
                    'worldId': world_id,
                    'type': 'hidden',
                    'region': 'use',
                    // 'displayName': 'World Hop',
                    'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752',
                    'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
                }
                break;
        }

        console.log(`${loglv().hey}${selflogA} Creating group instance for ${world_id}`)
        vrchat.createInstance({
            body: instanceBody
        }).then(created_instance => {
            startvrc(created_instance.data.location, I_autoNext)
            apiEmitter.emit('switch', localQueueList.length, 'world')
            console.log(`${loglv().log}${selflogA} Auto-Close set for ${created_instance.data.closedAt}.`)
        }).catch(err => {
            oscChatBoxV2(`instance create failed.\vTry another.`, 5000, true, true)
            console.log(`${loglv().warn}${selflogA}` + err)
            fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
                // err ? console.log(err); return : ''
                if (data.includes(world_id)) {
                    fs.writeFile(worldQueueTxt, data.replace(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
                }
                if (I_autoNext == true) { setTimeout(() => { inviteLocalQueue(true) }, 5000) }
            })
        })

    })
}

var lastSetUserStatus = ''
function setUserStatus(status) {
    // console.log(`${loglv().hey}${selflog} Status Update Cancelled`);return
    if (status.slice(0, 32) !== lastSetUserStatus) {
        vrchat.updateUser({ path: { userId: process.env["VRC_ACC_ID_1"] }, body: { statusDescription: status.slice(0, 32) } })
        console.log(`${loglv().hey}${selflogA} Status Updated: ${status.slice(0, 32)}`)
        lastSetUserStatus = status.slice(0, 32)
    }
}

var highestCount = 0
fs.readFile('./datasets/vrcMaxPop.txt', 'utf-8', (err, data) => { highestCount = data })
function getVisitsCount() {
    return new Promise(async (resolve, reject) => {
        if (isApiErrorSkip == true) { resolve(0) } else {
            let { data: visitsCount } = await limiter.req(vrchat.getCurrentOnlineUsers())
            resolve(visitsCount == undefined ? 0 : visitsCount)

            if (visitsCount > highestCount) {
                highestCount = visitsCount
                console.log(`${loglv().hey}\x1b[0m[\x1b[36mCounter\x1b[0m] New Highest Population reached: ${visitsCount}`)
                fs.writeFile('./datasets/vrcMaxPop.txt', visitsCount.toString(), 'utf-8', (err) => { if (err) { console.log(err) } })
            }
        }
    })
}
exports.getVisitsCount = getVisitsCount;

async function startvrc(vrclocation, autoGo = false, openToHome = false) {
    // vrcIsOpen = true
    if (openToHome == true) {
        require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr`)
    } else {
        await open(`vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=1`)
        if (autoGo == true) {
            setTimeout(() => {
                require('child_process').execSync(`"C:\\Users\\14Anthony7095\\Documents\\14aOSC_Multi-Interface\\bin\\vrcPressGoOnWorldPage.exe"`)
            }, 2000);
        }
    }
}
exports.startvrc = startvrc;


var tenMinuteTick = 0
console.log(`${loglv().hey}${selflogA} First Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
setTimeout(() => {
    if (isApiErrorSkip == false) { scanGroupAuditLogs() }
}, 600_000)
setInterval(() => {
    queueInstanceDataBurst()
}, 10_000)

async function scanGroupAuditLogs() {
    console.log(`${loglv().log}${selflogA} Scanning through audit logs.`)

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


    // const { data: logOutput_NHI } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_NHI }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_14aHop } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aHop }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    // const { data: logOutput_14aClone } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aClone }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_WEFURS } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_WEFURS }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))

    const { data: logOutput_1year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_1year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_2year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_2year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_3year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_3year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_4year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_4year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_5year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_5year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_6year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_6year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_7year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_7year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_8year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_8year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_9year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_9year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
    const { data: logOutput_10year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_10year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))

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


    console.log(`${loglv().hey}${selflogA} Next Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
    setTimeout(() => {
        scanGroupAuditLogs()
        tenMinuteTick >= 6 ? tenMinuteTick = 0 : tenMinuteTick++
    }, 600_000)
}

async function requestAllOnlineFriends() {
    var { data: onlineFriends } = await limiter.req(vrchat.getFriends({ query: { offset: 0, n: 100, offline: false } }))
    var privateFriends = onlineFriends.filter(onlineFriends => onlineFriends.location == 'private')
    var privateFriendsNotHere = privateFriends.filter(privateFriends => getPlayersInInstance().includes(privateFriends.displayName) == false)
    privateFriendsNotHere.forEach((friend, index, friendArr) => {
        setTimeout(() => {
            console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Checking ${friend.displayName}`)
            if (['active', 'join me', 'ask me'].includes(friend.status)) {
                console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is in Private`)

                // - No Not Request blacklist -
                if ([`usr_39a91182-0df7-476e-bc4a-e5d709cca692`, // ghost
                    `usr_49590946-943b-4835-ba7e-2e370b596b4d`, // Samoi
                    `usr_060e1976-dfda-44b0-8f71-fa911d8bf580`, // luna-the-bunny
                    `usr_bba4ca7a-5447-4672-828d-0a09d85f854e`, // melting
                    `usr_ee815921-8067-4486-a3e2-ded009457cf3` // turtlesnack
                ].includes(friend.id)) {
                    console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is on Do-Not-Request Blacklist`)
                } else if (friend.statusDescription.toLowerCase().includes('busy')) {
                    console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} has "Busy" in status`)
                } else {
                    vrchat.requestInvite({ path: { userId: friend.id }, body: { requestSlot: 1 } }).then((send_invite) => {
                        console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Request Sent to ${friend.displayName} - "${send_invite.data.message}"`)
                    }).catch((err) => console.log(err))
                }
            } else if (friend.status == 'busy') {
                console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is Busy`)
            }
            if (index + 1 == friendArr.length) {
                setTimeout(() => {
                    console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] 10 minutes has past since sending Requests`)
                }, 600_000);
                console.log(`${loglv().log}${selflogA} [BulkFrendRequestInviter] Done Requesting`)
            }
        }, (2_000 * index) + Math.random())
    })
}

var movieShowNameLast = ''
function eventPopcornPalace(json) {
    let jsondata = JSON.parse(json)
    // {
    //     "videoName": "Lilo and Stitch - 2025-05-17",
    //     "videoPos": 0,
    //     "videoLength": 6453.958,
    //     "thumbnailUrl": "https://web.vr-m.net/api/media/thumbnail/24f5e268-c778-4d46-981b-01e598acd925.png",
    //     "displayName": "14anthony7095",
    //     "isPaused": false,
    //     "is3D": false,
    //     "looping": false
    // }
    let movieShowName = ''
    if (jsondata.videoName != '' && Date.now() > (worldjointimestamp + 60000)) {
        if (jsondata.videoName.includes('One Piece')) {
            movieShowName = jsondata.videoName.replace('- S1E', 'ep.').split(' -')[0]
        } else {
            movieShowName = jsondata.videoName
        }
        if (movieShowName != movieShowNameLast) {
            movieShowNameLast = movieShowName
            setUserStatus(`Watching ${movieShowName}`)
            oscChatBoxV2(`~MovieTitle:\v ${movieShowName}`, 5000, true, true, false, false, false)
        }
    }
}

function applyGroupLogo(gID) {
    /*
0111 - El Alba
0110 - VRDance
0101 - Ravetopia
0100 - The Lunar Howl
0011 - Nanachis of VRChat
0010 - Nanachi's hollow inn
0001 - Community Events
0000 - CORE Default
    */
    switch (gID) {
        case 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad':
            // El Alba
            // 0111 - 7
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
            break;
        case 'grp_d960be54-cfc2-44cb-863d-6d624d8975c1':
            // VR Dance
            // 0110 - 6
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
            break;
        case `grp_7b4fe32e-8310-4ed5-9757-17116f915786`:
            // Ravetopia
            // 0101 - 5
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
            break;
        case 'grp_f018a0ac-2ec6-4176-aa47-a0fd2b7ea817':
            // The Lunar Howl
            // 0100 - 4
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
            break;
        case `grp_e483cc04-a610-471f-90eb-ec4eda8420be`:
            // Nanachis of VRChat
            // 0011 - 3
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
            break;
        case `grp_3473d54b-8e10-4752-9548-d77a092051a4`:
            // Nanachi's hollow inn
            // 0010 - 2
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
            break;
        case `grp_c24efb98-3234-4060-94f1-7729523e9689`:
            // Community Events
            // 0001 - 1
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
            break;
        default:
            // CORE Default
            // 0000 - 0
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
            oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
            break;
    }
}


function eventGameClose() {
    clearTimeout(worldHopTimeout)
    worldHopTimeout = null
    clearTimeout(worldHopTimeoutHour)
    worldHopTimeoutHour = null
    console.log(`${loglv().hey}${selflogL} VRChat has Closed.`)
    if (exploreMode == true) {
        console.log(`${loglv().hey}${selflogA} Explore Mode: Disabled - Quit VRChat`)
        setUserStatus('')
        apiEmitter.emit('switch', 0, 'world')
        exploreMode = false
    }
    requestAvatarStatTable(true, 0.05, true)
    if (worldID_Closed == true && lastSetUserStatus == 'Instance is closed') {
        lastSetUserStatus = ''
        setUserStatus('')
    }
    G_groupID = ''
    worldID_Closed = false
    tonAvgStartWait = []

    let buildLog = `${loglv().log}${selflogL}`
    if (ttvFetchFrom == 1 && urlType == 'twitch') {
        buildLog += ` Resetting Twitch target channel`
        switchChannel(process.env["VRC_ACC_NAME_1"])
        if (lastVideoURL != '') { buildLog += ` &` }
    }
    if (lastVideoURL != '') {
        buildLog += ` Clearing Video-URL history`
        lastVideoURL = ''
        seenVideoURLs = []
    }
    console.log(buildLog)
    if (vrchatRunning == true) {
        setTimeout(() => {
            vrchatRunning = false
        }, 10_000);
    }
}
exports.eventGameClose = eventGameClose;

var vrcpropcount = {
    'prop_id': {
        "Name": 'sample',
        "Count": 999
    }
}
fs.readFile('./datasets/propcounts.json', 'utf8', (err, data) => { vrcpropcount = JSON.parse(data) })
async function eventPropSpawned(propID) {
    // console.log(`${loglv().debug}${selflog} Item spawned: ${propID}`)
    if (!vrcpropcount[propID]) {
        console.log(`${loglv().hey}${selflogL} Unseen Item spawned: ${propID}`)
        // console.log(`${loglv().debug}${selflog} ${propID} for ${vrcpropcount}`)
        let res = await limiter.req(vrchat.getProp({ 'path': { 'propId': 'prop_' + propID } }))
        // console.log(`${loglv().debug}${selflog} ${res.data}`)
        if (res.data != undefined) {
            if (!vrcpropcount[propID]) {
                vrcpropcount[propID] = { "name": "", "count": 0 }
            }
            vrcpropcount[propID].name = res.data.name
            vrcpropcount[propID].count = 1
            console.log(`${loglv().hey}${selflogA} Added ${vrcpropcount[propID].name} to the Items list`)
            fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => { if (err) { console.log(err); return } })
        }

    } else {
        vrcpropcount[propID].count = vrcpropcount[propID].count + 1
        console.log(`${loglv().log}${selflogL} Item spawned: ${vrcpropcount[propID].name} - ${vrcpropcount[propID].count - 1} -> ${vrcpropcount[propID].count}`)
        fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => { if (err) { console.log(err); return } })
    }
}

async function requestAvatarStatTable(writeToFile = false, trAvgPercent = 0.05, resetData = false) {
    return new Promise((resolve, reject) => {
        var avatarStatSummaryTable = [['Components - ' + avatarStatSummary.totalAvatars + ' Avatars', 'Min', 'Q1', 'Median', 'Q3', 'Max', trAvgPercent * 100 + '% Tr.Avg', 'Total']]
        Object.keys(avatarStatSummary.stats).forEach(async (key, index, arr) => {
            if (key == 'fileSize') {
                var sort = avatarStatSummary.stats['fileSize'].values.sort((a, b) => { return a - b })
                var vMin = await formatBytes(Math.min(...avatarStatSummary.stats['fileSize'].values))
                var vQ1 = await formatBytes(sort[Math.floor((sort.length - 1) * 0.25)])
                var vMedT = sort.length % 2 === 0 ? (sort[sort.length / 2] + sort[(sort.length / 2) - 1]) / 2 : sort[Math.floor(sort.length / 2)]
                var vMed = await formatBytes(vMedT)
                var vTrAvgT = sort.slice(Math.floor(sort.length * trAvgPercent), Math.floor(sort.length * -trAvgPercent))
                var vTrAvg = await formatBytes(mathSumValues(vTrAvgT) / vTrAvgT.length)
                var vQ3 = await formatBytes(sort[Math.floor((sort.length - 1) * 0.75)])
                var vMax = await formatBytes(Math.max(...avatarStatSummary.stats['fileSize'].values))
                var vSum = await formatBytes(mathSumValues(avatarStatSummary.stats['fileSize'].values))

                avatarStatSummaryTable.push([avatarStatSummary.stats['fileSize'].label, vMin, vQ1, vMed, vQ3, vMax, vTrAvg, vSum])

            } else if (key == 'uncompressedSize') {
                var sort = avatarStatSummary.stats['uncompressedSize'].values.sort((a, b) => { return a - b })
                var vMin = await formatBytes(Math.min(...avatarStatSummary.stats['uncompressedSize'].values))
                var vQ1 = await formatBytes(sort[Math.floor((sort.length - 1) * 0.25)])
                var vMedT = sort.length % 2 === 0 ? (sort[sort.length / 2] + sort[(sort.length / 2) - 1]) / 2 : sort[Math.floor(sort.length / 2)]
                var vMed = await formatBytes(vMedT)
                var vTrAvgT = sort.slice(Math.floor(sort.length * trAvgPercent), Math.floor(sort.length * -trAvgPercent))
                var vTrAvg = await formatBytes(mathSumValues(vTrAvgT) / vTrAvgT.length)
                var vQ3 = await formatBytes(sort[Math.floor((sort.length - 1) * 0.75)])
                var vMax = await formatBytes(Math.max(...avatarStatSummary.stats['uncompressedSize'].values))
                var vSum = await formatBytes(mathSumValues(avatarStatSummary.stats['uncompressedSize'].values))

                avatarStatSummaryTable.push([avatarStatSummary.stats['uncompressedSize'].label, vMin, vQ1, vMed, vQ3, vMax, vTrAvg, vSum])

            } else if (key == 'totalTextureUsage') {
                var sort = avatarStatSummary.stats['totalTextureUsage'].values.sort((a, b) => { return a - b })
                var vMin = await formatBytes(Math.min(...avatarStatSummary.stats['totalTextureUsage'].values))
                var vQ1 = await formatBytes(sort[Math.floor((sort.length - 1) * 0.25)])
                var vMedT = sort.length % 2 === 0 ? (sort[sort.length / 2] + sort[(sort.length / 2) - 1]) / 2 : sort[Math.floor(sort.length / 2)]
                var vMed = await formatBytes(vMedT)
                var vTrAvgT = sort.slice(Math.floor(sort.length * trAvgPercent), Math.floor(sort.length * -trAvgPercent))
                var vTrAvg = await formatBytes(mathSumValues(vTrAvgT) / vTrAvgT.length)
                var vQ3 = await formatBytes(sort[Math.floor((sort.length - 1) * 0.75)])
                var vMax = await formatBytes(Math.max(...avatarStatSummary.stats['totalTextureUsage'].values))
                var vSum = await formatBytes(mathSumValues(avatarStatSummary.stats['totalTextureUsage'].values))

                avatarStatSummaryTable.push([avatarStatSummary.stats['totalTextureUsage'].label, vMin, vQ1, vMed, vQ3, vMax, vTrAvg, vSum])

            } else {
                var sort = avatarStatSummary.stats[key].values.sort((a, b) => { return a - b })
                // console.log(sort)
                var vMin = Math.min(...avatarStatSummary.stats[key].values)
                var vQ1 = sort[Math.floor((sort.length - 1) * 0.25)]
                var vMed = sort.length % 2 === 0 ? (sort[sort.length / 2] + sort[(sort.length / 2) - 1]) / 2 : sort[Math.floor(sort.length / 2)]
                var vAvg = avatarStatSummary.stats[key].sum / avatarStatSummary.totalAvatars
                var vMax = Math.max(...avatarStatSummary.stats[key].values)
                var vQ3 = sort[Math.floor((sort.length - 1) * 0.75)]
                var vTrAvgT = sort.slice(Math.floor(sort.length * trAvgPercent), Math.floor(sort.length * -trAvgPercent))
                var vTrAvg = mathSumValues(vTrAvgT) / vTrAvgT.length

                if (key == 'boundsLongest') {
                    avatarStatSummaryTable.push([
                        avatarStatSummary.stats[key].label,
                        (Math.ceil(vMin * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        (Math.ceil(vQ1 * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        (Math.ceil(vMed * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        (Math.ceil(vQ3 * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        (Math.ceil(vMax * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        (Math.ceil(vTrAvg * 100) / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        ''
                    ])
                } else {
                    avatarStatSummaryTable.push([
                        avatarStatSummary.stats[key].label,
                        Math.ceil(vMin).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        Math.ceil(vQ1).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        Math.ceil(vMed).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        Math.ceil(vQ3).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        Math.ceil(vMax).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        Math.ceil(vTrAvg).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                        ''
                    ])
                }
            }
        })
        setTimeout(() => {
            var tableOptions = { 'drawHorizontalLine': (lineIndex, rowCount) => { return lineIndex === 0 || lineIndex === 1 || lineIndex === 29 || lineIndex === rowCount } }
            if (avatarStatSummary.totalAvatars >= 4) {
                console.log('=== Avatar Performance Stat Summary ===\nCreation Date-Time\n   ' + new Date().toLocaleString() + '\nInstance Location\n    ' + G_lastlocation + '\n' + table(avatarStatSummaryTable, tableOptions) + `    Excellent ✅: ${avatarStatSummary.Excellent}\n         Good 🟢: ${avatarStatSummary.Good}\n       Medium 🟡: ${avatarStatSummary.Medium}\n         Poor 🔴: ${avatarStatSummary.Poor}\n     VeryPoor ❌: ${avatarStatSummary.VeryPoor}`)
                if (writeToFile == true) {
                    fs.writeFile('./datasets/avatarStatSummarys/' + Date.now() + ' ' + G_lastlocation + '.txt', '=== Avatar Performance Stat Summary ===\nCreation Date-Time\n   ' + new Date().toLocaleString() + '\nInstance Location\n    ' + G_lastlocation + '\n' + table(avatarStatSummaryTable, tableOptions) + `    Excellent ✅: ${avatarStatSummary.Excellent}\n         Good 🟢: ${avatarStatSummary.Good}\n       Medium 🟡: ${avatarStatSummary.Medium}\n         Poor 🔴: ${avatarStatSummary.Poor}\n     VeryPoor ❌: ${avatarStatSummary.VeryPoor}\n` + '\n--Avatar Security Checks used--' + avatarStatSummary.checkedFileIDs.map((v) => { return '\n' + v }), 'utf8', (err) => {
                        if (err) { console.error(err) }
                    })
                }
            }
            if (resetData == true) {
                avatarStatSummary = {
                    "totalAvatars": 0,
                    "checkedFileIDs": [],
                    "seenAuthors": [{
                        "id": "", "displayName": ""
                    }],
                    "seenAvatars": [{
                        "name": "", "author": null, "wearers": [], "lastAccessed": 0
                    }],
                    "Excellent": 0,
                    "Good": 0,
                    "Medium": 0,
                    "Poor": 0,
                    "VeryPoor": 0,
                    "stats": {
                        "totalPolygons": { "label": "Polygons", "values": [] },
                        "boundsLongest": { "label": "Bounds (Longest Edge)", "values": [] },
                        "skinnedMeshCount": { "label": "Skinned Meshes", "values": [] },
                        "meshCount": { "label": "Basic Meshes", "values": [] },
                        "materialSlotsUsed": { "label": "Material Slots", "values": [] },
                        "materialCount": { "label": "Material Count", "values": [] },
                        "physBoneColliderCount": { "label": "PhysBone Colliders", "values": [] },
                        "physBoneCollisionCheckCount": { "label": "PhysBone Collision Checks", "values": [] },
                        "physBoneComponentCount": { "label": "PhysBone Components", "values": [] },
                        "physBoneTransformCount": { "label": "PhysBone Transforms", "values": [] },
                        "contactCount": { "label": "Contacts", "values": [] },
                        "constraintCount": { "label": "Constraint Count", "values": [] },
                        "constraintDepth": { "label": "Constraint Depth", "values": [] },
                        "animatorCount": { "label": "Animators", "values": [] },
                        "boneCount": { "label": "Bones", "values": [] },
                        "lightCount": { "label": "Lights", "values": [] },
                        "particleSystemCount": { "label": "Particle Systems", "values": [] },
                        "totalMaxParticles": { "label": "Max Particles", "values": [] },
                        "meshParticleMaxPolygons": { "label": "Particle Max Polygons", "values": [] },
                        "trailRendererCount": { "label": "Trail Renderers", "values": [] },
                        "lineRendererCount": { "label": "Line Renderers", "values": [] },
                        "clothCount": { "label": "Cloth Count", "values": [] },
                        "totalClothVertices": { "label": "Cloth Vertices", "values": [] },
                        "physicsColliders": { "label": "Unity Colliders", "values": [] },
                        "physicsRigidbodies": { "label": "Rigidbodies", "values": [] },
                        "audioSourceCount": { "label": "AudioSources", "values": [] },
                        "blendShapeCount": { "label": "BlendShapes", "values": [] },
                        "cameraCount": { "label": "Cameras", "values": [] },
                        "totalTextureUsage": { "label": "Texture Memory (VRAM)", "values": [] },
                        "fileSize": { "label": "Download Size", "values": [] },
                        "uncompressedSize": { "label": "Uncompressed Size (RAM)", "values": [] }
                    }
                }

            }
            resolve(true)
        }, 2000)
    })
}

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
            console.log(`${loglv().hey}${selflogA} Closing Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
            await limiter.req(vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'request' } }))
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
            console.log(`${loglv().hey}${selflogA} Opening Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
            await limiter.req(vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'open' } }))
            await sleep(10000)
        }

        resolve(true)

    })
}

async function updateBioWorldQueue() {
    return new Promise((resolve) => {
        fs.readFile(worldQueueTxt, 'utf8', async (err, dataw) => {
            let localQueueList = dataw.split('===')[0].split(`\r\n`)
            console.log(`${loglv().hey}${selflogA} Preping Bio for world queue update`)
            if (localQueueList.length != 0) {
                console.log(`${loglv().log}${selflogA} Fetching current Bio`)
                let { data: mybio } = await limiter.req(vrchat.getUser({ 'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' } }))

                if (mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/) != null) {
                    if (parseInt(mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]) != localQueueList.length) {
                        console.log(`${loglv().log}${selflogA} Updating Bio queue count: ${mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]} -> ${localQueueList.length}`)
                        // console.log(`${loglv().debug}${selflog} ${mybio.bio}`)
                        let mybioUpdated = mybio.bio.replace(/Worlds in queue[:˸] \d{1,4}/, 'Worlds in queue: ' + localQueueList.length)
                        await limiter.req(vrchat.updateUser({ 'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' }, 'body': { 'bio': mybioUpdated } }))

                        // console.log(`${loglv().debug}${selflog} ${mybioUpdated}`)
                        setTimeout(() => { resolve(true) }, 2000)
                    } else {
                        console.log(`${loglv().log}${selflogA} Bio already contains current queue count`)
                        setTimeout(() => { resolve(true) }, 2000)
                    }
                }
            } else {
                console.log(`${loglv().log}${selflogA} world queue empty, Skiping`)
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
                    let { data: userData } = await limiter.req(vrchat.getUser({ path: { userId: l.actorId } }))
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

                    findHighestBadage = userData.badges
                        .filter(e => e.badgeDescription.includes('Joined VRChat'))
                        .sort((a, b) => parseInt(b.badgeName.substring(0, 2).trim()) - parseInt(a.badgeName.substring(0, 2).trim()))
                    userBadgeYearNum = findHighestBadage.length > 0 ? parseInt(findHighestBadage[0].badgeName.substring(0, 2).trim()) : 0
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
                    let { data: userData } = await limiter.req(vrchat.getUser({ path: { userId: l.targetId } }))
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
                    let { data: userData } = await limiter.req(vrchat.getUser({ path: { userId: l.actorId } }))
                    postAuthorName = userData.displayName
                }
                if (l.data.imageId != null) {
                    let { data: filedata } = await limiter.req(vrchat.getFile({ path: { fileId: l.data.imageId } }))
                    postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
                }
                if (l.data.bannerId != null) {
                    let { data: filedata } = await limiter.req(vrchat.getFile({ path: { fileId: l.data.bannerId.new } }))
                    postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
                }
                if (l.targetId.includes('wrld_')) {
                    let regex = /(wrld_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}):([0-9]{5})~group\(grp_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}\)~groupAccessType\((members|plus|public)\)(?:~canRequestInvite)?~region\((us|use|eu|jp)\)/
                    if (regex.test(l.targetId)) {
                        locationWorldID = regex.exec(l.targetId)[1]
                        locationID = regex.exec(l.targetId)[2]
                        locationType = regex.exec(l.targetId)[3]
                        locationRegion = regex.exec(l.targetId)[4].toUpperCase()
                        let { data: worldData } = await limiter.req(vrchat.getWorld({ path: { worldId: locationWorldID } }))
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
                        let { data: worldData } = await limiter.req(vrchat.getWorld({ path: { worldId: locationWorldID } }))
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
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`:
                                // 2 Year of VRC Collector
                                if (userBadgeYearNum < 2) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 2) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_378c0550-07a1-4cab-aa45-65ad4a817117`:
                                // 3 Year of VRC Collector
                                if (userBadgeYearNum < 3) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 3) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_378c0550-07a1-4cab-aa45-65ad4a817117' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`:
                                // 4 Year of VRC Collector
                                if (userBadgeYearNum < 4) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 4) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`:
                                // 5 Year of VRC Collector
                                if (userBadgeYearNum < 5) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 5) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`:
                                // 6 Year of VRC Collector
                                if (userBadgeYearNum < 6) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 6) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_5eb28410-68df-4609-b0c5-bc98cf754264`:
                                // 7 Year of VRC Collector
                                if (userBadgeYearNum < 7) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 7) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_5eb28410-68df-4609-b0c5-bc98cf754264' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_18aa4b68-9118-4716-9a39-42413e54db8c`:
                                // 8 Year of VRC Collector
                                if (userBadgeYearNum < 8) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 8) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_18aa4b68-9118-4716-9a39-42413e54db8c' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`:
                                // 9 Year of VRC Collector
                                if (userBadgeYearNum < 9) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 9) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_768a2c3d-b22c-48d2-aae1-650483c347ea' }, 'body': { 'userId': l.actorId } }))
                                }
                                break;
                            case `grp_243d9742-ce05-4fc3-b399-cd436528c432`:
                                // 10 Year of VRC Collector
                                if (userBadgeYearNum < 10) {
                                    await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
                                }
                                if (userBadgeYearNum + 1 < 10) {
                                    await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_243d9742-ce05-4fc3-b399-cd436528c432' }, 'body': { 'userId': l.actorId } }))
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
                    resolve(true); console.log(`${loglv().log}${selflogA} Audit Log scan finished for ${groupID}`)
                }, 20_000)
            }
        })
        // const invertedIndex = arr.length - 1 - index;

    })
}

function getSelfLocation() { return G_currentLocation }
exports.getSelfLocation = getSelfLocation;

async function eventHeadingToWorld(logOutputLine) {
    clearTimeout(worldHopTimeout)
    worldHopTimeout = null
    clearTimeout(worldHopTimeoutHour)
    worldHopTimeoutHour = null

    G_groupID_last = G_groupID
    G_worldID = /wrld_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
    console.log(`${loglv().debug}${selflogL} World ID ${G_worldID}`)

    // 2026.01.27 14:20:50 Debug      -  [Behaviour] Destination set: wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5:65895~hidden(usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752)~region(use)

    if (logOutputLine.includes(`~group(grp_`)) {
        G_groupID = /grp_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
        console.log(`${loglv().debug}${selflogL} Group ID ${G_groupID}`)
        if (logOutputLine.includes(`~groupAccessType(plus)`)) {
            instanceType = `groupPlus`
        } else if (logOutputLine.includes(`~groupAccessType(public)`)) {
            instanceType = `groupPublic`
        } else {
            instanceType = `group`
        }
    } else {
        G_groupID = ''
        if (logOutputLine.includes(`~private(`)) {
            instanceType = `invite`
        } else if (logOutputLine.includes(`~canRequestInvite`)) {
            instanceType = `invitePlus`
        } else if (logOutputLine.includes(`~friends(`)) {
            instanceType = `friends`
        } else if (logOutputLine.includes(`~hidden(`)) {
            instanceType = `friendsPlus`
        } else {
            instanceType = `public`
        }
    }
    G_currentLocation = 'wrld_' + logOutputLine.split('wrld_')[1]
    // Get world info for OBS Stream
    let res = await limiter.req(vrchat.getWorld({ 'path': { 'worldId': G_worldID } }))
    apiEmitter.emit('fetchedDistThumbnail', res.data.imageUrl, res.data.name.slice(0, 50), res.data.authorName.slice(0, 50), G_worldID)

    // Save avatar stats for the instance
    await requestAvatarStatTable(true, 0.05, true)
    G_lastlocation != `${G_worldID} - ${instanceType}${G_groupID != '' ? ' - ' + G_groupID : ''}` ? G_lastlocation = `${G_worldID} - ${instanceType}${G_groupID != '' ? ' - ' + G_groupID : ''}` : ''

    // El Alba starting world
    if (G_groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && G_worldID == 'wrld_f6445b27-037d-4926-b51f-d79ada716b31') { worldHoppers = [] }

    console.log(`${loglv().debug}${selflogL} Instance Type ${instanceType}`)
}

var worldjointimestamp = 0
function getWorldJoinTimestamp() { return worldjointimestamp }; exports.getWorldJoinTimestamp = getWorldJoinTimestamp;

function eventJoinWorld() {
    worldHopTimeout = setTimeout(() => {
        say.speak(`Been in world for too long. Proceed to next in queue`, 'Microsoft David Desktop', 1.0, (err) => {
            if (err) { return console.error(`${loglv().warn}${selflogL} say.js error: ` + err) }
        })
    }, 600_000)
    worldHopTimeoutHour = setTimeout(() => {
        say.speak(`Been in world for over an hour. Find a new world`, 'Microsoft David Desktop', 1.0, (err) => {
            if (err) { return console.error(`${loglv().warn}${selflogL} say.js error: ` + err) }
        })
    }, 3600_000)

    if (cooldownUrl == true) { cooldownUrl = false }

    worldjointimestamp = Date.now()
    playersInInstance = []
    membersInInstance = []
    playersInstanceObject = []
    fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
        if (data.includes(G_worldID) && G_worldID != '') {
            fs.writeFile(worldQueueTxt, data.replace(`${G_worldID}\r\n`, ''), (err) => {
                if (err) { console.log(err) }
                console.log(`${loglv().debug}${selflogL} ${G_worldID} was successfully purged from queue`)
            })
        }
    })
}

function eventInstanceClosed() {
    if (G_worldID != 'wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5' && G_groupID != 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
        lastSetUserStatus = 'Instance is closed'
        setUserStatus('Instance is closed')
    } else if (G_groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
        if (lastSetUserStatus != `Exploring World Queue`) {
            lastSetUserStatus = `Exploring World Queue`
            setUserStatus(`Exploring World Queue`)
        }
        if (exploreMode == false) {
            inviteLocalQueue(G_autoNextWorldHop)
        }
    }
    worldID_Closed = true
    oscSend('/avatar/parameters/log/instance_closed', true)

}

function eventReceivedNotification(line) {
    let senderUserID = line.split(', sender user id:')[1].split(',')[0]
    let notifType = line.split(', type:')[1].split(',')[0]

    switch (notifType) {
        case 'invite':
            oscSend('/avatar/parameters/log/inviteNotif', true)
            break;
        case 'localNotifs':
            if (senderUserID == '8JoV9XEdpo') {
                if (line.includes(`This instance will be reset`)) {
                    let remainingTime = line.split('will be reset in ')[1].split(' due')[0]
                    lastSetUserStatus = `Instance Reset in ${remainingTime}`
                    setUserStatus(`Instance Reset in ${remainingTime}`)
                    worldID_Closed = true
                    oscSend('/avatar/parameters/log/instance_closed', true)
                }
            }
            break;
        default: break;
    }

    // Received Notification: <Notification from 
    // username:14anthony7095, 
    // sender user id:usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752 to usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752 of type: invite, 
    // id: not_f7a7c0af-84e9-4c2f-8e54-f0757ed3632b, 
    // created at: 06/17/2025 18:28:11 UTC, 
    // details: {{worldId=wrld_ab93c6a0-d158-4e07-88fe-f8f222018faa:68053~hidden(usr_498c8e8a-1e14-4ef1-8952-e9e9297167b3)~region(use), worldName=A Simple Fishing World}}, 
    // type:invite, 
    // m seen:False, 
    // message: "This is a generated invite to A Simple Fishing World">
}

var currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"] }
function getCurrentAccountInUse() { return currentAccountInUse }; exports.getCurrentAccountInUse = getCurrentAccountInUse;
async function eventPlayerInitialized(logOutputLine) {
    var playerDisplayName = logOutputLine.split('[Behaviour] Initialized player ')[1]

    if (playerDisplayName != undefined) {
        console.log(`${loglv().log}${selflogL} Player Joined: ` + playerDisplayName)
        logEmitter.emit('playerJoin', playerDisplayName)

        // Terrors of Nowhere alert friend join
        if (G_worldID == 'wrld_a61cdabe-1218-4287-9ffc-2a4d1414e5bd' &&
            [`invite`, `invitePlus`, `friends`, `friendsPlus`].includes(instanceType) &&
            Date.now() > (worldjointimestamp + 120_000)) {
            oscChatBoxV2(`~Someone is joining if you want to wait for them: ${playerDisplayName}`, undefined, false, true, false, true, false)
        }

        // No Orange status Group
        if (G_groupID == 'grp_cacf2dd8-8958-4412-be78-dedd798e6df4' && playerDisplayName != '14anthony7095') {
            let usercheck = await limiter.req(vrchat.searchUsers({ 'query': { 'search': playerDisplayName } }))
            if (usercheck.data[0].status == 'busy' || usercheck.data[0].status == 'ask me') {
                console.log(`${loglv().log}${selflogA} ${playerDisplayName} is on ${usercheck.data[0].status == 'ask me' ? '🟠' : '🔴'} Status, Banning`)
                say.speak(`User ${playerDisplayName} is on a gated status, kick from instance`, 'Microsoft Zira Desktop', 1.0)
                await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_cacf2dd8-8958-4412-be78-dedd798e6df4' }, 'body': { 'userId': usercheck.data[0].id } }))
            }
        }

        playersInInstance.push(playerDisplayName)
        playersInstanceObject.push({ 'name': playerDisplayName })

        playerRatio = playersInInstance.length / playerHardLimit

        if (Date.now() > (worldjointimestamp + 30000)) { queueInstanceDataBurst() }

        console.log(`${loglv().log}${selflogL} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${playerRatio} ]`)

        switch (playerDisplayName) {
            case process.env["VRC_ACC_NAME_6"]:
                if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
                currentAccountInUse = { name: process.env["VRC_ACC_NAME_6"], id: process.env["VRC_ACC_ID_6"] }
                break;
            case process.env["VRC_ACC_NAME_4"]:
                if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
                currentAccountInUse = { name: process.env["VRC_ACC_NAME_4"], id: process.env["VRC_ACC_ID_4"] }
                break;
            case process.env["VRC_ACC_NAME_7"]:
                if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
                currentAccountInUse = { name: process.env["VRC_ACC_NAME_7"], id: process.env["VRC_ACC_ID_7"] }
                break;
            case process.env["VRC_ACC_NAME_3"]:
                if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
                currentAccountInUse = { name: process.env["VRC_ACC_NAME_3"], id: process.env["VRC_ACC_ID_3"] }
                break;
            case process.env["VRC_ACC_NAME_5"]:
                if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
                currentAccountInUse = { name: process.env["VRC_ACC_NAME_5"], id: process.env["VRC_ACC_ID_5"] }
                break;
            case process.env["VRC_ACC_NAME_2"]:
                if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
                currentAccountInUse = { name: process.env["VRC_ACC_NAME_2"], id: process.env["VRC_ACC_ID_2"] }
                break;
            case process.env["VRC_ACC_NAME_1"]:
                if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv().hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
                currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"] }
                break;
            default:
                break;
        }
    }
}

var hassaidcooldown = false
async function eventPlayerJoin(logOutputLine) {
    var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerJoined ')[1]

    if (playerDisplayName != undefined) {
        var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0].replace(/\(/, '').replace(/\)/, '')

        playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '')

        // Append UserID to tracked player
        let pioIndex = playersInstanceObject.findIndex(playersInstanceObject => playersInstanceObject.name == playerDisplayName)

        if (playerDisplayName == '14anthony7095') {
            logEmitter.emit('joinedworld', G_worldID)
        }

        // El Alba starting world
        if (G_groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {
            var filteredhoppers = worldHoppers.find(a => a.id == playerID)
            if (filteredhoppers != undefined) {
                worldHoppers[worldHoppers.findIndex(a => a.id == playerID)]["joinTime"] = Date.now()
            } else {
                var findMem = vrchatElAlbaMembers.find(m => m.userId == playerID || m.user.id == playerID || m.user.displayName == playerDisplayName)
                worldHoppers.push({
                    "name": playerDisplayName,
                    "id": playerID,
                    "playtime": 0,
                    "joinTime": Date.now(),
                    "groupMember": findMem != undefined ? true : false
                })

            }
        }

        // let findUserInCache = vrcDataCache.users.find(u => u.id == playerID)
        // if (findUserInCache == undefined) {
        //     enqueueUserDataFetch(playerID)
        // }

        try {
            playersInstanceObject[pioIndex].id = playerID
        } catch (error) {
            console.log(`${loglv().hey}${selflogL} playerTracker Object got UserID before PlayerName - ${error}`)
            playersInstanceObject.push({ 'name': playerDisplayName, 'id': playerID })
        }
    }
}
// async function enqueueUserDataFetch(I_userID) {
//     let gotuser = await limiter.req(vrchat.getUser({ 'path': { 'userId': I_userID } }))

//     gotuser.data.id
// }

function eventPlayerLeft(logOutputLine) {
    var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerLeft ')[1]

    if (playerDisplayName != undefined || playerDisplayName != null) {
        // var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0]

        playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '').replace(/ \([0-z]{10}\)/, '')
        console.log(`${loglv().log}${selflogL} Player Left: ` + playerDisplayName)

        playersInInstance = playersInInstance.filter(name => name != playerDisplayName)
        playersInstanceObject = playersInstanceObject.filter(playersInstanceObject => playersInstanceObject.name !== playerDisplayName)
        playerRatio = playersInInstance.length / playerHardLimit
        /* if ([`groupPlus`, `groupPublic`, `group`].includes(instanceType)) {
            membersInInstance = membersInInstance.filter(name => name != playerDisplayName)
            memberRatio = membersInInstance.length / playersInInstance.length
        } */

        if (Date.now() > (worldjointimestamp + 30000) && worldHopTimeout != null) { queueInstanceDataBurst() }

        console.log(`${loglv().log}${selflogL} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${playerRatio} ]`)
        /* if ([`groupPlus`, `groupPublic`, `group`].includes(instanceType)) {
            console.log(`${loglv().log}${selflog} There are now ${membersInInstance.length} / ${playersInInstance.length} group members in the instance. [ ${memberRatio} ]`)
        } */
        // logEmitter.emit('playerLeft', playerDisplayName, playerID, playersInInstance)

        // El Alba starting world
        if (G_groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' || G_groupID_last == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {
            var filteredhoppers = worldHoppers.find(a => a.name == playerDisplayName)
            if (filteredhoppers != undefined) {
                var foundindex = worldHoppers.findIndex(a => a.name == playerDisplayName)
                console.debug(worldHoppers[foundindex]["playtime"])
                console.debug(worldHoppers[foundindex]["joinTime"])
                console.debug(Date.now() - worldHoppers[foundindex]["joinTime"])
                worldHoppers[foundindex]["playtime"] += Date.now() - worldHoppers[foundindex]["joinTime"]
            } else {
                console.log(`${loglv().hey}${selflogL} [WorldHoppers] Skipping undetected join`)
            }
        }

        if (playerDisplayName == getCurrentAccountInUse().name) {
            clearTimeout(worldHopTimeout)
            clearTimeout(loadingAvatarTimer)
            loadingAvatarTimer = null
            worldHopTimeout = null
            cooldownUrl = true
            if (worldID_Closed == true) {
                if (lastSetUserStatus != `Exploring World Queue`) {
                    lastSetUserStatus = ``
                    setUserStatus('')
                }
                worldID_Closed = false
            }
            oscSend('/avatar/parameters/log/instance_closed', false)
            tonAvgStartWait = []
            let buildLog = `${loglv().log}${selflogL}`
            if (ttvFetchFrom == 1 && urlType == 'twitch') {
                buildLog += ` Resetting Twitch target channel`
                switchChannel(process.env["VRC_ACC_NAME_1"])
                if (lastVideoURL != '') { buildLog += ` &` }
            }
            if (lastVideoURL != '') {
                buildLog += ` Clearing Video-URL history`
                lastVideoURL = ''
                seenVideoURLs = []
            }
            console.log(buildLog)
        }
    }
}

function eventPlayerAvatarSwitch(logOutputLine) {
    let playerswitching = logOutputLine.split(`Switching `)[1].split(`to avatar `)[0].trim()
    let avatarswitchedto = logOutputLine.split(`to avatar `)[1].trim()

    console.log(`${loglv().log}${selflogL} [AvatarChange]: ${playerswitching} switching to (${avatarswitchedto})`)

    var pruneCheckLength = avatarStatSummary.seenAvatars.filter(a => Date.now() > a.lastAccessed + 60000 && a.wearers.length == 0)
    var pruneLeftover = avatarStatSummary.seenAvatars.filter(a => Date.now() < a.lastAccessed + 60000 || a.wearers.length != 0)
    if (pruneCheckLength.length > 0) {
        avatarStatSummary.seenAvatars = pruneLeftover
        console.log(`${loglv().log}\x1b[0m[\x1b[32mVRC_Log\x1b[0m] [AvatarCache]: Pruning ${pruneCheckLength.length} avatars from memory.`)
    }

    try {
        avatarStatSummary.seenAvatars.filter(a => a.wearers.includes(playerswitching)).map(b => b.wearers.splice(b.wearers.indexOf(playerswitching)))
        avatarStatSummary.seenAvatars.filter(a => a.name == avatarswitchedto)[0].wearers.push(playerswitching)
    } catch (err) {
        avatarStatSummary.seenAvatars.push({ "name": avatarswitchedto, "author": null, "wearers": [playerswitching], "lastAccessed": Date.now() })
    }

    clearTimeout(loadingAvatarTimer)
    loadingAvatarTimer = setTimeout(() => {
        logEmitter.emit('avatarQueueFinish', true)
    }, 10000);
}


function eventAssetDownload(logOutputLine) {
    var assetbundlelog = logOutputLine.split(`[AssetBundleDownloadManager] `)[1]
    // console.log(`${loglv().log}${selflog} [AssetBundleDownloadManager]: ${assetbundlelog}`)

    if (assetbundlelog.includes('Unpacking Avatar')) {
        // console.log(`${loglv().log}${selflog} [AssetBundle]: ${assetbundlelog}`)
        // [AssetBundle]: [593] Unpacking Avatar (Alula v3․48 Basic by 14anthony7095)
        let avatarswitchedto = assetbundlelog.split('Unpacking Avatar (')[1].split(' by ')[0]
        let avatarauthor = assetbundlelog.split('Unpacking Avatar (')[1].split(' by ')[1].slice(0, -1)

        try {
            var assSa = avatarStatSummary.seenAvatars.filter(a => a.name == avatarauthor)[0]
            assSa.author = I_author
            console.log(`${loglv().log}\x1b[0m[\x1b[32mVRC_Log\x1b[0m] [AvatarChange]: ${assSa.wearers.toString()} in avatar (${assSa.name} by ${assSa.author})`)
        } catch (err) {
            console.log(`${loglv().hey}\x1b[0m[\x1b[32mVRC_Log\x1b[0m] [AvatarFallback]: No Wearer for (${avatarauthor} by ${avatarswitchedto})`)
            avatarStatSummary.seenAvatars.push({ "name": avatarauthor, "author": avatarswitchedto, "wearers": [], "lastAccessed": Date.now() })
        }

        clearTimeout(loadingAvatarTimer)
        loadingAvatarTimer = setTimeout(() => {
            logEmitter.emit('avatarQueueFinish', true)
        }, 10000);
    }

    if (assetbundlelog.includes('Starting download of')) {
        let dlqueue = parseInt(logOutputLine.split(', ')[1].split(' ')[0].trim())
        if (dlqueue >= 1) {
            console.log(`${loglv().log}${selflogL} [AssetBundle]: Download Queue: ${dlqueue}`)
        }
    }
}



var cooldownUrl = false
function videoUrlResolver(videourl) {
    if (lastVideoURL === videourl) { console.log(`${loglv().log}${selflogL} Skipping url, already been displayed.`); return }
    if (seenVideoURLs.includes(videourl)) { console.log(`${loglv().log}${selflogL} Skipping url, is in seen list.`); return }
    if (videourl.includes('media.cdn.furality')) { console.log(`${loglv().log}${selflogL} Skipping url, Furality Content network.`); return }
    /*
    console.log(`${loglv().debug}${selflog}\n	OLD= ${lastVideoURL}\n	NEW= ${videourl}`)
    console.log(`${loglv().debug}${selflog} IS EQUAL? ${lastVideoURL === videourl}`)
    console.log(`${loglv().debug}${selflog} Stringifiy ${JSON.stringify(videourl)}`)
    */
    lastVideoURL = videourl
    seenVideoURLs.push(videourl)

    if (cooldownUrl == true) { console.log(`${loglv().log}${selflogL} Skipping url, forcing Ratelimit`); return }

    cooldownUrl = true
    setTimeout(() => { cooldownUrl = false }, 5000);

    //	--- Print Video URL ---
    console.log(`${loglv().log}${selflogL} Video URL: ${videourl}`)
    if (ChatVideoURL == true) { oscChatBoxV2(`~VideoURL:\v${fitChars(videourl, 3)}`, 5000, true, true) }

    //	---	Twitch Channel URL Resolver	---
    if (videourl.includes('twitch.tv/') && !videourl.includes('twitch.tv/videos')) {
        //oscSend('/avatar/parameters/ttvEnabled', 1 )
        if (ttvFetchFrom == 1) { switchChannel(videourl.split('twitch.tv/')[1]) }
        if (urlType != 'twitch') {
            console.log(`${loglv().log}${selflogL} Video URL Type set to "Twitch"`)
            urlType = 'twitch'
        }
    }

    //	---	Hyperbeam URL Resolver	---
    if (videourl.includes('hyperbeam.com') && playersInInstance.includes('Chriin')) {
        if (ttvFetchFrom == 1) { switchChannel('sirlarr') }
        if (urlType != 'twitch') {
            console.log(`${loglv().log}${selflogL} Video URL Type set to "Twitch"`)
            urlType = 'twitch'
        }
    }

    //	---	Youtube Title Resolver	---
    if (videourl.includes('youtube.com/')) {
        videourl = 'http://www.youtube.com/' + videourl.split('youtube.com/')[1].split(' ')[0]
    } else if (videourl.includes('youtu.be/')) {
        videourl = 'http://www.youtube.com/watch?v=' + videourl.split('youtu.be/')[1].split(' ')[0]
    }

    var isValidateYTurl = ytdl.validateURL(videourl)
    //console.log(`${loglv().debug}${selflog} yt-dl is validate url? ${isValidateYTurl}`)

    if (isValidateYTurl == true) {
        //if( ttvAlwaysRun == false ){ oscSend('/avatar/parameters/ttvEnabled', 0 ) }

        if (urlType != 'youtube') {
            console.log(`${loglv().log}${selflogL} Video URL Type set to "Youtube"`)
            urlType = 'youtube'
            if (ttvFetchFrom == 1) { switchChannel(process.env["VRC_ACC_NAME_1"]) }
        }
        ytdl.getBasicInfo(videourl)
            .then((data) => {
                setTimeout(() => {
                    console.log(`${loglv().log}${selflogL} Video Title: ${data.videoDetails.title}`)
                    if (ChatVideoTitle == true) { oscChatBoxV2(`~VideoTitle:\v${fitChars(data.videoDetails.title, 3)}`, 2000, true, true) }
                }, 2000)
            })
            .catch((err) => {
                console.log(`${loglv().warn}${selflogL} Youtube-dl: ${err}`)
                if (ChatVideoURL == true) { oscChatBoxV2(`~${err}`, 2000, true, true, false, false, false) }
            })
    }
}


function worldDownloadProgress(dlduration, dlprogress) {
    var dlETAtotal = Math.floor(partWhole(part = dlduration, percent = dlprogress));
    var dlETA = dlETAtotal - dlduration;

    if (dlETAtotal >= 60) {
        min = Math.floor(dlETAtotal / 60);
        sec = Math.floor(dlETAtotal - (min * 60));
        dlETAtotal = min + 'm' + sec + 's';
    } else {
        dlETAtotal = dlETAtotal + 'sec';
    }

    if (dlETA >= 60) {
        min = Math.floor(dlETA / 60);
        sec = Math.floor(dlETA - (min * 60));
        dlETA = min + ' min ' + sec + ' seconds';
    } else {
        dlETA = dlETA + ' seconds';
    }
    console.log(`${loglv().log}${selflogL} World Download ETA ${dlETA}`);
    say.speak(`E T A ${dlETA}`, 'Microsoft Zira Desktop', 1.0, (err) => {
        if (err) { return console.error(`${loglv().warn}${selflogL} say.js error: ` + err) }
        setTimeout(() => {
            isTalking = false
        }, 1000)
    })
}