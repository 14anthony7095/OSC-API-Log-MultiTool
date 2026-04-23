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
require('dotenv').config({ 'quiet': true })


let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
console.log(`${loglv().log}${selflog} Loaded`)

var vrchat = new VRChat({ application: { name: "Api-Osc-Interface_DEV", version: "1.2-DEV", contact: process.env["CONTACT_EMAIL"] }, authentication: { credentials: { username: process.env["VRC_ACC_LOGIN_1"], password: process.env["VRC_ACC_PASSWORD_1"], totpSecret: process.env["VRC_ACC_TOTPSECRET_1"] } }, keyv: new KeyvFile({ filename: "./datasets/vrcA.json" }) });
var isApiErrorSkip = false

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


main()
async function main() {
    console.log('MAIN')
    try {
        const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
        console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);
    } catch (error) { if (error.statusCode == 500) { isApiErrorSkip = true }; return }

    /* 
        for (const item in vrcFriendsList.friends) {
            var res = await vrchat.getUser({ 'path': { 'userId': vrcFriendsList.friends[item] } })
            res.data.discordId != undefined ? console.log(`${res.data.displayName} - ${res.data.discordId}`) : ''
        }
    */
    // await sleep(10000)


    // Shared groups in YEAR Groups
    /* await foundMemberMutualGroups('grp_4f5d0456-4200-4b2c-8331-78856d1869e4', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_378c0550-07a1-4cab-aa45-65ad4a817117', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_5eb28410-68df-4609-b0c5-bc98cf754264', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_18aa4b68-9118-4716-9a39-42413e54db8c', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_768a2c3d-b22c-48d2-aae1-650483c347ea', undefined, undefined, false)
    await sleep(10000)
    await foundMemberMutualGroups('grp_243d9742-ce05-4fc3-b399-cd436528c432', undefined, undefined, true) */

    // var gi = await vrchat.getWorld({ 'path': { 'worldId': 'wrld_0c3caeaa-7224-4800-aa64-bc473ccb18a2' } }); console.log(gi.data)

    // Search for anti-avatar-flight worlds
    /* var sw1 = await vrchat.searchWorlds({ 'query': { 'n': 100, 'tag': 'admin_disable_avatar_collision' } })
   var sw2 = await vrchat.searchWorlds({ 'query': { 'n': 100, 'tag': 'admin_disable_avatar_stations' } })
   console.log('admin_disable_avatar_collision', sw1.data.map((e) => { return e.name }))
   console.log('admin_disable_avatar_stations', sw2.data.map((e) => { return e.name }))  */

    // Get Feedback Reports
    // var gModr = await vrchat.getModerationReports({ 'query': { 'reportingUserId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752', 'n': 100, 'offset': 0 } })
    // console.log(JSON.stringify(gModr.data))



}

class ratelimitHandler {
    pause_sec = 30
    pause_exp = 1
    isLimiting = false
    limiterCache = { "user": [], "world": [], "file": [], "group": [], "userGroups": [] }
    #cachedTime = 60_000
    constructor(pause_exp, pause_sec, isLimiting, limiterCache) {
        this.pause_sec
        this.pause_exp
        this.isLimiting
        this.limiterCache
    }
    get waitTimeMS() { return 1000 * (this.pause_sec * Math.pow(2, this.pause_exp)) }
    get waitTimeSec() { return this.pause_sec * Math.pow(2, this.pause_exp) }
    get delayMulti() { return this.pause_exp }
    async backoff() {
        return new Promise((resolve, reject) => {
            console.log(`${loglv().warn}${selflogA}\x1b[0m[\x1b[31mRatelimit-Handler\x1b[0m] Backing off for ${this.waitTimeSec} sec
    Retry: ${new Date(Date.now() + this.waitTimeMS).toTimeString()}`)
            setTimeout(() => {
                if (this.pause_exp < 7) { this.pause_exp++ }
                resolve(true)
            }, this.waitTimeMS);
        })
    }
    cooloff() {
        if (this.pause_exp > 1) { this.pause_exp = this.pause_exp - this.pause_exp * 0.1 } else if (this.pause_exp < 1) { this.pause_exp = 1 }
    }
    sweepCache() {
        console.log(`${loglv().hey}${selflogA}\x1b[0m[\x1b[31mRatelimit-Handler\x1b[0m] Sweeping API-Cache.`)
        var count = 0
        var totalc = 0
        Object.keys(this.limiterCache).forEach(k => {
            var fromc = this.limiterCache[k].length
            totalc += this.limiterCache[k].length
            this.limiterCache[k] = this.limiterCache[k].filter(c => c.cache_expire > Date.now())
            count += fromc - this.limiterCache[k].length
        })
        console.log(`${loglv().hey}${selflogA}\x1b[0m[\x1b[31mRatelimit-Handler\x1b[0m] Cleared ${count} items from API-Cache. Remaining ${totalc - count}`)
    }
    
    async reqCached(I_type, I_cacheSearch) {
        return new Promise((resolve, reject) => {
            switch (I_type) {
                case 'userGroups':
                    var search = this.limiterCache['userGroups'].find(c => c.userId == I_cacheSearch && c.cache_expire > Date.now())
                    if (search != undefined) {
                        resolve(search['data'])
                    } else {
                        reject('Not Cached or is Expired')
                    }
                    break;
                default:
                    var search = this.limiterCache[I_type].find(c => c.data.id == I_cacheSearch && c.cache_expire > Date.now())
                    if (search != undefined) {
                        resolve(search)
                    } else {
                        reject('Not Cached or is Expired')
                    }
                    break;
            }
        })
    }
    async req(I_request, I_type = '', I_param = '') {
        return new Promise((resolve, reject) => {
            checkLimit()
            function checkLimit() {
                if (limiter.isLimiting == false) { attemptRequest() } else { setTimeout(() => { checkLimit() }, limiter.delayMulti * 10000) }
            }
            async function attemptRequest() {
                var res = await I_request
                if (res.error?.statusCode == 429 || res.error?.response.status == 429 || res.error?.statusCode == 500 || res.error?.response.status == 500) {
                    limiter.isLimiting = true
                    await limiter.backoff()
                    if (limiter.pause_exp == 7) {
                        console.log(I_request)
                        resolve('ForceSkip')
                    } else { attemptRequest() }
                } else {
                    limiter.isLimiting = false
                    limiter.cooloff()
                    if (I_type != '') {
                        switch (I_type) {
                            case 'userGroups':
                                limiter.limiterCache['userGroups'].push({ 'userId': I_param, 'data': res, 'cache_expire': Date.now() + limiter.#cachedTime })
                                break;
                            default:
                                res['cache_expire'] = Date.now() + limiter.#cachedTime
                                limiter.limiterCache[I_type].push(res)
                                break;
                        }
                    }
                    resolve(res)
                }
            }
        })
    }
}
const limiter = new ratelimitHandler();


async function sleep(timeMS) { return new Promise((resolve, reject) => { setTimeout(() => { resolve('done') }, timeMS) }) }
async function foundMemberMutualGroups(groupID, membersOverride, membersIDs, writeCSV = true, checkMutualFriends = false) {
    return new Promise(async (resolve, reject) => {
        var members = []
        var chkMembers = []
        var groups = []
        const sleeptime = 200
        fs.readFile('datasets/groupMembers-mutualGroups.json', (err, data) => {
            if (err) { console.error(err) }
            if (data.length != 0) { groups = JSON.parse(data).groups; chkMembers = JSON.parse(data).members }
        })

        // Get current group's members
        console.log('[API] Fetching Group')
        if (groupID == undefined) {
            console.log(`[14A] No group specified`)
            if (membersOverride != undefined) {
                console.log(`[14A] Using member override`)
                members = membersOverride
            } else {
                console.log(`[14A] Using member id list`)
                for (const id in membersIDs) {
                    console.log(`[API][${id}/${membersIDs.length - 1}][${Math.round(id / (membersIDs.length - 1) * 100)}%] Fetching user ${membersIDs[id]}`)
                    if (!chkMembers.includes(membersIDs[id])) {
                        var gotUser = await limiter.req(vrchat.getUser({ 'path': { 'userId': membersIDs[id] } }))
                        console.log(`[API] Got user ${gotUser.data.displayName}`)

                        if (!chkMembers.includes(gotUser.data.displayName)) {
                            if (checkMutualFriends == true) {
                                var gotMutuals = await limiter.req(vrchat.getMutualFriends({ 'path': { 'userId': membersIDs[id] } }))

                                members.push({
                                    'id': gotUser.data.id,
                                    'name': gotUser.data.displayName,
                                    'mutualfriends': gotMutuals.data.map(m => m.displayName)
                                })
                            } else {
                                members.push({
                                    'id': gotUser.data.id,
                                    'name': gotUser.data.displayName
                                })
                            }
                        }
                    }
                    await sleep(sleeptime * limiter.delayMulti)
                }
            }
        } else {
            var gotGroup = await limiter.req(vrchat.getGroup({ 'path': { 'groupId': groupID } }))
            console.log(`[API] Found ${gotGroup.data.name} with ${gotGroup.data.memberCount} members`)

            var forAmount = new Array(1 + Math.floor(gotGroup.data.memberCount / 100)).fill(0)
            console.log(forAmount)
            for (const i in forAmount) {
                console.log(`[API][${i}/${forAmount.length - 1}][${Math.round(i / (forAmount.length - 1) * 100)}%] Fetching GroupMembers offset ${i * 100}`)
                var groupMembers = await limiter.req(vrchat.getGroupMembers({ 'path': { 'groupId': groupID }, 'query': { 'n': 100, 'offset': i * 100 } }))
                if (userGroups == 'ForceSkip') {
                    fs.writeFile('datasets/groupMembers-mutualGroups.json', JSON.stringify({ 'groups': groups, 'members': chkMembers }), (err) => { if (err) { console.error(err) } })
                    continue
                }
                console.log(`[API] Found ${groupMembers.data.length} members`)

                for (const memberIndex in groupMembers.data) {
                    // console.log(`[API] Member: ${groupMembers.data[memberIndex].user.displayName}`)
                    if (!chkMembers.includes(groupMembers.data[memberIndex].user.displayName)) {
                        members.push({
                            'id': groupMembers.data[memberIndex].userId,
                            'name': groupMembers.data[memberIndex].user.displayName
                        })
                    }
                }
                await sleep(sleeptime * limiter.delayMulti)
            }
        }


        console.log(`Switching to Members' Groups - Pausing for 5secs`)
        await sleep(5000)

        // Get each member's group list
        for (const memberIndex in members) {
            console.log(`[API][${memberIndex}/${members.length - 1}][${Math.round(memberIndex / (members.length - 1) * 100)}%] Fetching Groups for ${members[memberIndex].name}`)
            var userGroups = await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': members[memberIndex].id } }))
            if (userGroups == 'ForceSkip') {
                fs.writeFile('datasets/groupMembers-mutualGroups.json', JSON.stringify({ 'groups': groups, 'members': chkMembers }), (err) => { if (err) { console.error(err) } })
                continue
            }
            console.log(`[API] Found ${userGroups.data.length} groups`)

            let cntCreated = 0
            let cntAdds = 0
            let cntDupes = 0
            for (const groupIndex in userGroups.data) {
                // console.log(`[MEM] Checking if group is in cache`)
                var foundGroup = groups.find(e => e.id == userGroups.data[groupIndex].groupId)
                if (foundGroup == undefined) {
                    cntCreated++
                    // console.log(`[MEM] Creating ${userGroups.data[groupIndex].name}`)
                    // console.log(`[MEM] Adding ${members[memberIndex].name} to ${userGroups.data[groupIndex].name}`)
                    groups.push({ 'name': userGroups.data[groupIndex].name, 'members': [members[memberIndex].name], 'id': userGroups.data[groupIndex].groupId })
                } else {
                    cntAdds++
                    // console.log(`[MEM] Adding ${members[memberIndex].name} to ${foundGroup.name} [Users: ${foundGroup.members.length}]`)
                    if (!groups[groups.indexOf(foundGroup)].members.includes(members[memberIndex].name)) {
                        groups[groups.indexOf(foundGroup)].members.push(members[memberIndex].name)
                    } else {
                        cntDupes++
                    }
                }
            }
            console.log(`[MEM] Added ${cntAdds} | Created ${cntCreated} | Dupes? ${cntDupes}`)
            chkMembers.push(members[memberIndex].name)
            await sleep(sleeptime * limiter.delayMulti)
        }

        if (writeCSV == true) {
            var stringToWrite = ``
            console.log(groups)
            groups.sort((a, b) => { return b.members.length - a.members.length }).filter(f => f.members.length >= 2).forEach(gr => {
                stringToWrite += `${stringToWrite.length == 0 ? '' : '\n'}"${gr.name}","${gr.members.toString().replaceAll(',', '","')}"`
            })
            members.filter(f => f.mutualfriends?.length >= 1).forEach(mm => {
                stringToWrite += `${stringToWrite.length == 0 ? '' : '\n'}"${mm.name}","${mm.mutualfriends.toString().replaceAll(',', '","')}"`
            })

            console.log(stringToWrite)
            fs.writeFile('./output_memberMutualGroups.csv', stringToWrite, (err) => { if (err) { console.err(err) } })
        }
        fs.writeFile('datasets/groupMembers-mutualGroups.json', JSON.stringify({ 'groups': groups, 'members': chkMembers }), (err) => {
            if (err) { console.error(err) }
            resolve(true)
        })
    })
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
})
logEmitter.on('fileanalysis', async (fileid, fileversion) => {
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
    let res = await vrchat.getFile({ 'path': { 'fileId': fileid, 'versionId': fileversion } }); console.log(res)
    let res2 = await vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } }); console.log(res2)
}
// fileCheck('file_c34d0d63-ce1b-4b1c-ae2d-9c52f2ace478',30)



// getAvatarThumbnail()
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

