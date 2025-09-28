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
    groupUpdate,
    groupInstanceCreateWASNT18PLUS } = require('./interace_WebHook.js')
const fs = require('fs');
const { cmdEmitter } = require('./input.js');
const { oscEmitter, oscChatBox } = require('./Interface_osc_v1.js');
const { logEmitter, getPlayersInInstance, getPlayersInstanceObject, getCurrentAccountInUse, fetchLogFile, getInstanceGroupID } = require('./Interface_vrc-Log.js');
const { VRChat } = require("vrchat");
require('dotenv').config()

let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
console.log(`${loglv().log}${selflog} Loaded`)

const vrchat = new VRChat({
    application: {
        name: "Api-Osc-Interface",
        version: "1.2",
        contact: process.env["CONTACT_EMAIL"]
    },
    authentication: {
        credentials: {
            username: process.env["VRCHAT_USERNAME"],
            password: process.env["VRCHAT_PASSWORD"],
            totpSecret: process.env["VRCHAT_TOTPSECRET"]
        }
    }
});

// Global Vars
var avatarsToCycleThrough = []
var instancesFound = []
var vrcIsOpen = false
exports.vrcIsOpen = vrcIsOpen
var lastFetchGroupLogs;
var currentUser;
var authcookie;
var worldQueueTxt = './datasets/worldQueue.txt'
var exploreMode = false
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


cmdEmitter.on('cmd', (cmd, args) => {
    if (cmd == 'help') {
        console.log(`${selflog}
-   api requestall
-   lunarhowl scan
-   rep scan
`)
    }
    if (cmd == 'api' && args[0] == 'requestall') { requestAllOnlineFriends(currentUser) }
    if (cmd == 'rep' && args[0] == 'scan') { getGroupRepsForInstance() }
})

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
        inviteLocalQueue()
    }
})
logEmitter.on('stopworld', (output) => {
    if (exploreMode == true) {
        console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - Quit VRChat`)
        setUserStatus('')
        exploreMode = false
    }
})


async function main() {
    console.log(`${loglv().debug}${selflog} start main function`)
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);

    // {
    //     profileIndex?: number,
    //     hoursInWorld?: number, 
    //     hasCloseAccess?: boolean, 
    //     hoursInstanceClose?: number, 
    //     worldStartGroup?: string<GroupID>, 
    //     worldInstanceTypes = string<'members'|'plus'|'public'>,
    //     worldStartTimes?: { number<DayOfWeek0-6>: { number<TimeOfDay0-23>: string<WorldID>; }; }
    // }

    // startvrcworlds()

}

var markededSomnaGroupInstances = []
var trackedSomnaIns = {}
async function scanSomnaGroupInstances() {
    console.log(`${loglv().log}${selflog} [Somnophilia] Checking for instances`)
    let res = await vrchat.getGroupInstances({ 'path': { 'groupId': 'grp_10bb5d71-aa5e-43d8-9dd2-3c8cebe17152' } })
    if (res.data == undefined) {
        console.log(res)
    } else if (res.data.length > 0) {
        console.log(`${loglv().log}${selflog} [Somnophilia] 0/${res.data.length}: Found ${res.data.length} instances`)
        res.data.forEach((grpins, index, arr) => {
            if (grpins.instanceId.includes('~ageGate')) {

                if (trackedSomnaIns[grpins.instanceId.split('~')[0]]) {
                    trackedSomnaIns[grpins.instanceId.split('~')[0]] = 1 + trackedSomnaIns[grpins.instanceId.split('~')[0]]
                } else {
                    trackedSomnaIns[grpins.instanceId.split('~')[0]] = 1
                }

                console.log(`${loglv().log}${selflog} [Somnophilia] ${index + 1}/${arr.length}: - AgeGated #${grpins.instanceId.split('~')[0]} - (${trackedSomnaIns[grpins.instanceId.split('~')[0]] * 10}min) - ${grpins.world.id}`)
            } else {
                console.log(`${loglv().hey}${selflog} [Somnophilia] ${index + 1}/${arr.length}: - Not Gated #${grpins.instanceId.split('~')[0]} - (${trackedSomnaIns[grpins.instanceId.split('~')[0]] * 10}min) - ${grpins.world.id} - Sending message to WebHook`)
                if (!markededSomnaGroupInstances.includes(grpins.instanceId)) {
                    markededSomnaGroupInstances.push(grpins.instanceId)
                    groupInstanceCreateWASNT18PLUS(grpins.world.id, grpins.instanceId, grpins.world.name, grpins.world.imageUrl)
                }
            }
        })
    }
}

function getGroupRepsForInstance() {
    var repGroups = {}
    let count = 0
    getPlayersInstanceObject().forEach((player, index, arr) => {
        count = arr.length
        setTimeout(async () => {
            console.log(`${loglv().debug} [${index}/${arr.length - 1}] playerDisplayName ${player.name} - ${player.id}`)

            let groupRes = await vrchat.getUserRepresentedGroup({ 'path': { 'userId': player.id } })
            // console.log(`${loglv().debug} groupRes ${JSON.stringify(groupRes).slice(0,256)}`)
            console.log(`${loglv().debug} Rep'd group name ${groupRes.data.name}`)

            // console.log(`${loglv().debug} repGroups[group name] ${ repGroups[groupRes.data.name] }`)
            if (!repGroups[groupRes.data.name]) { repGroups[groupRes.data.name] = [] }
            repGroups[groupRes.data.name].push(player.name)

        }, index * 1_000)
    })
    setTimeout(() => { console.log(repGroups) }, count * 1_000)
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
        let lastInQueue = localQueueList[localQueueList.length-1]
        
        let worldlist = ''
        worldData.forEach((w, index, arr) => {
            console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
            index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
        })

        if( worldlist.includes(lastInQueue) ){
            console.log(`${loglv().hey}${selflog} Cancelled list appendage, Queue already contains part of latest batch`)
            oscChatBox(`Cancelled queue append:\v Queue already contains latest labs batch`)
        }else{
            fs.appendFile(worldQueueTxt, worldlist, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
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
    let { data: fav1 } = await vrchat.getFavoritedWorlds({ query: { featured: false, sort: 'random', n: 100, order: 'ascending', offset: 0 } })
    let { data: fav2 } = await vrchat.getFavoritedWorlds({ query: { featured: false, sort: 'random', n: 100, order: 'ascending', offset: 100 } })
    let { data: fav3 } = await vrchat.getFavoritedWorlds({ query: { featured: false, sort: 'random', n: 100, order: 'ascending', offset: 200 } })
    let { data: fav4 } = await vrchat.getFavoritedWorlds({ query: { featured: false, sort: 'random', n: 100, order: 'ascending', offset: 300 } })
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

    console.log(`${loglv().hey}${selflog} Explore Mode: Enabled`)
    setUserStatus(`Exploring World Queue`)
    exploreMode = true

    inviteOnlineWorlds_Loop(worldsToExplore[0])
}
var exploreNextCountDownTimer;
async function inviteOnlineWorlds_Loop(world_id) {
    let { data: checkCap } = await vrchat.getWorld({ 'path': { 'worldId': world_id } })
    if (checkCap.capacity < getPlayersInInstance().length && getInstanceGroupID() == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
        console.log(`${loglv().hey}${selflog} World can not fit everyone. Skipping`)
        oscChatBox(`World can't fit everyone.\vSkipping.`, 5);
        worldsToExplore.shift()
        if (worldsToExplore.length == 0) {
            console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - out of worlds`)
            exploreMode = false
        }
        exploreNextCountDownTimer = setTimeout(() => {
            if (exploreMode == true) { inviteOnlineWorlds_Loop(worldsToExplore[0]) }
        }, 600_000)
    } else {
        console.log(`${loglv().hey}${selflog} Creating group instance for ${world_id}`)
        vrchat.createInstance({
            body: {
                'worldId': world_id,
                'type': 'group',
                'region': 'use',
                'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
                'groupAccessType': 'plus',
                'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
            }
        }).then(created_instance => {
            // `&shortName=${created_instance.data.secureName}`
            startvrc(0, created_instance.data.location, true)
            console.log(`${loglv().log}${selflog} Auto-Close set for ${created_instance.data.closedAt}.`)

            worldsToExplore.shift()
            if (worldsToExplore.length == 0) {
                console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - out of worlds`)
                exploreMode = false
            }
            exploreNextCountDownTimer = setTimeout(() => {
                if (exploreMode == true) { inviteOnlineWorlds_Loop(worldsToExplore[0]) }
            }, 600_000)
        })
    }
}

function inviteLocalQueue() {
    fs.readFile(worldQueueTxt, 'utf8', async (err, data) => {
        // err ? console.log(err); return : ''
        let localQueueList = data.split(`\r\n`)
        let randnum = Math.round(Math.random() * (localQueueList.length-1))
        let world_id = localQueueList[randnum]

        let extimelow = Math.floor((localQueueList.length * 2) / 60)
        let extimehig = Math.floor((localQueueList.length * 10) / 60)
        console.log(`${loglv().log}${selflog} ${localQueueList.length} worlds to explore. [${extimelow} to ${extimehig} Hours]`)

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

        console.log(`${loglv().hey}${selflog} Creating group instance for ${world_id}`)
        vrchat.createInstance({
            body: {
                'worldId': world_id,
                'type': 'group',
                'region': 'use',
                'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
                'groupAccessType': 'plus',
                'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
            }
        }).then(created_instance => {
            // `&shortName=${created_instance.data.secureName}`
            startvrc(0, created_instance.data.location, true)
            console.log(`${loglv().log}${selflog} Auto-Close set for ${created_instance.data.closedAt}.`)
        }).catch(err => {
            console.log(err)
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

function getVisitsCount() {
    return new Promise(async (resolve, reject) => {
        let { data: visitsCount } = await vrchat.getCurrentOnlineUsers()
        resolve(visitsCount == undefined ? 0 : visitsCount)
    })
}
exports.getVisitsCount = getVisitsCount;

const { default: open } = require('open');
async function startvrc(profileIndex, vrclocation, direct) {
    // vrcIsOpen = true
    // require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr --profile=${profileIndex} "vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=${parseInt(direct)}"`)

    await open(`vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=1`)
    // await open(`vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=${parseInt(direct)}`, {arguments: ['--no-vr']})
    // require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr --profile=${profileIndex} "vrchat://launch/?ref=14aOSCAPI.app&id=${vrclocation}&attach=${parseInt(direct)}"`)
    // direct == false ? fetchLogFile() : ''
}


var startvrcworldsLastDayTime = [9, 25]
function startvrcworlds(profileIndex = 0, minutesInWorld = 60, hasCloseAccess = false, minutesInstanceClose = 180, worldStartGroup = 'grp_3473d54b-8e10-4752-9548-d77a092051a4', worldInstanceTypes = 'members', worldStartTimes = { "0": { "0": 'wrld_10000000-0000-0000-0000-000000000000', "12": 'wrld_10000000-0000-0000-0000-000000000000' } }) {

    if (worldStartTimes[new Date().getDay()][new Date().getHours()] == undefined) {
        // console.log(`${loglv().debug}${selflog} Not time to start a Quarterly instance yet..`)
        return
    } else if (startvrcworldsLastDayTime[0] == new Date().getDay() && startvrcworldsLastDayTime[1] == new Date().getHours()) {
        // console.log(`${loglv().debug}${selflog} Already Visited this Quarterly instance..`)
        return
    }
    // if (vrcIsOpen == true) { killprep() }

    console.log(`${loglv().hey}${selflog} Starting a Quarterly instance!`)
    startvrcworldsLastDayTime = [new Date().getDay(), new Date().getHours()]

    let bodybuild = {}
    if (hasCloseAccess == true) {
        bodybuild = {
            'ownerId': worldStartGroup,
            'worldId': worldStartTimes[new Date().getDay()][new Date().getHours()],
            'type': 'group',
            'groupAccessType': worldInstanceTypes,
            'region': 'use',
            'closedAt': new Date(Date.now() + (minutesInstanceClose * 3600_000)).toISOString()
        }
    } else {
        bodybuild = {
            'ownerId': worldStartGroup,
            'worldId': worldStartTimes[new Date().getDay()][new Date().getHours()],
            'type': 'group',
            'groupAccessType': worldInstanceTypes,
            'region': 'use'
        }
    }

    vrchat.createInstance({
        body: bodybuild
    }).then(created_instance => {
        console.log(`${loglv().hey}${selflog} Launching self into instance.. `)
        console.log(created_instance)
        vrcIsOpen = true
        require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr --profile=${profileIndex} "vrchat://launch/?ref=vrchat.com&id=${created_instance.data.location}"`)
        fetchLogFile()
        setTimeout(() => { killprep() }, (minutesInWorld - 1) * 60_000)
        setTimeout(() => { vrcIsOpen = false; killvrc(1) }, minutesInWorld * 60_000)
    })

}

setInterval(() => {
    scanGroupAuditLogs()
}, 600_000)

async function scanGroupAuditLogs() {
    // var targetGroupLogID_NHI = 'grp_3473d54b-8e10-4752-9548-d77a092051a4' // Nanachi's Hollow Inn
    var targetGroupLogID_14aHop = 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce' // 14aHop
    var targetGroupLogID_Leash = 'grp_75bcbc95-361e-4d90-9752-5a2d7bc270a3' // LeashChildren
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
    const { data: logOutput_Leash } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_Leash }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } })
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
    await scanaudit(logOutput_Leash, targetGroupLogID_Leash);
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

    // scanSomnaGroupInstances()
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

var vrcDataCache = {}
function scanaudit(logoutput, groupID) {
    console.log(`${loglv().log}${selflog} Scanning through audit log for group ${groupID}`)
    return new Promise((resolve, reject) => {
        if (logoutput.results.length == 0) {
            setTimeout(() => {
                resolve(true)
                console.log(`${loglv().log}${selflog} Audit Log was Empty for ${groupID}`)
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
                                if (userBadgeYearNum < 1) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`:
                                if (userBadgeYearNum < 2) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_378c0550-07a1-4cab-aa45-65ad4a817117`:
                                if (userBadgeYearNum < 3) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`:
                                if (userBadgeYearNum < 4) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`:
                                if (userBadgeYearNum < 5) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`:
                                if (userBadgeYearNum < 6) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_5eb28410-68df-4609-b0c5-bc98cf754264`:
                                if (userBadgeYearNum < 7) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_18aa4b68-9118-4716-9a39-42413e54db8c`:
                                if (userBadgeYearNum < 8) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`:
                                if (userBadgeYearNum < 9) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
                                }
                                break;
                            case `grp_243d9742-ce05-4fc3-b399-cd436528c432`:
                                if (userBadgeYearNum < 10) {
                                    await vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } })
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
                    undiscoveredEvent(groupID, l.created_at, l.eventType, JSON.stringify(l))
                    console.log(`${loglv().warn} - ${l.eventType} does not exist yet`)
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