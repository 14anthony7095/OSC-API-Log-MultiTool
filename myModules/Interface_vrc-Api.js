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
const fs = require('fs')
const fsp = require('fs').promises
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



// Global Vars
var vrcDataCache = {}
var vrcIsOpen = false
exports.vrcIsOpen = vrcIsOpen
var lastFetchGroupLogs;
var currentUser;
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
-   years open
-   years close
-   preload [wrldID...]
-   explore start
-   avatars
`)
    }
    if (cmd == 'api' && args[0] == 'requestall') { requestAllOnlineFriends(currentUser) }
    if (cmd == 'years' && args[0] == 'close') { switchYearGroupsClosed() }
    if (cmd == 'years' && args[0] == 'open') { switchYearGroupsReOpen() }
    if (cmd == 'preload') { worldAutoPreloadQueue(args[0].split(',')) }
    if (cmd == 'avatars') { requestAvatarStatTable(false, 0.05, false) }
    if (cmd == 'allavatars') { scanAllAvatarStats() }
    // if (cmd == 'explore' && args[0] == 'start') { getOnlineWorlds('worlds1', false) }
})

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, time)
    })
}

var exploreNextCountDownTimer
oscEmitter.on('osc', (address, value) => {
    if (address == `/avatar/parameters/api/explore/start` && value == true) {
        getOnlineWorlds('worlds1', false)
    }
    if (address == `/avatar/parameters/api/explore/next` && value == true) {
        if (exploreMode == true) {
            clearTimeout(exploreNextCountDownTimer)
            exploreNextCountDownTimer = null
            inviteOnlineWorlds_Loop(worldsToExplore[0]);
        } else if (exploreMode == false) {
            inviteLocalQueue()
        }
    }
    if (address == `/avatar/parameters/api/explore/stop` && value == true) {
        apiEmitter.emit('switch', 0, 'world')
        if (exploreMode == true) {
            console.log(`${loglv().hey}${selflog} Explore Mode: Disabled - Avatar Trigger`)
            clearTimeout(exploreNextCountDownTimer)
            exploreNextCountDownTimer = null
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
function mathSumValues(values_Arr) {
    var sum = 0
    for (const i in values_Arr) {
        sum += values_Arr[i]
    }
    return sum
}

// - Avatar Perf Allowance -
//  Stat / Value >= Threshold
const avatarStatWeights = {
    "lowerLimitWeight": 40,             // Display Evaluation Value
    "higherLimitWeight": 40,            // Warn Icon + True Stat
    "boundsLongest": 0.2,               //🔒locked in - from suggestion list
    "constraintCount": 17.55,           //🔒locked in - from suggestion list
    "constraintDepth": 5.05,            //🔒locked in - from suggestion list
    "totalTextureUsage": 3934781,       //🔒locked in - from suggestion list
    "totalPolygons": 5000,              //🔒locked in - from suggestion list
    "skinnedMeshCount": 0.5,            //🔒locked in - from suggestion list
    "meshCount": 1.5,                   //🔒locked in - from suggestion list
    "physBoneCollisionCheckCount": 25,  //🔒locked in - from suggestion list
    "physBoneColliderCount": 5,         //🔒locked in - from suggestion list
    "physBoneComponentCount": 2.6,      //🔒locked in - from suggestion list
    "physBoneTransformCount": 20,       //🔒locked in - from suggestion list
    "contactCount": 5.12,               //🔒locked in - from suggestion list
    "animatorCount": 2,
    "audioSourceCount": 0.45,
    "boneCount": 20.05,
    "cameraCount": 0.32,
    "clothCount": 0.1,
    "lineRendererCount": 0.45,
    "materialCount": 1.65,
    "meshParticleMaxPolygons": 250.05,
    "particleSystemCount": 0.85,
    "physicsColliders": 0.45,
    "physicsRigidbodies": 0.45,
    "totalClothVertices": 10.05,
    "totalMaxParticles": 2500,
    "trailRendererCount": 0.45,
    "materialSlotsUsed": 0.88,
    "lightCount": 0.15,
    "blendShapeCount": 10
}

var avatarStatSummary = {
    "totalAvatars": 0,
    "checkedFileIDs": [],
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


// const { distance, closestMatch } = require("closest-match");
logEmitter.on('fileanalysis', async (fileid, fileversion) => {
    // Has avatar already been seen while in this instance? - Escape
    if (avatarStatSummary.checkedFileIDs.includes(fileid + "-" + fileversion)) {
        console.log(`${loglv().log}${selflog} [AvatarAnalysis] Skipping: ${fileid} - ver ${fileversion}`); return
    }

    // Has avatar already been scanned before? - Check Cache folder
    var res = {}
    try {
        var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', 'utf8')
        console.log(`${loglv().log}${selflog} [AvatarAnalysis] Cached: ${fileid} - ver ${fileversion}`)
        res.data = JSON.parse(fsrdfile)
    } catch (error) {
        console.log(`${loglv().log}${selflog} [AvatarAnalysis] Fetching: ${fileid} - ver ${fileversion}`)

        res = await vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } })
        if (res.data.avatarStats || res.data.performanceRating) {
            let getName = await vrchat.getFile({ 'path': { 'fileId': fileid } })
            res.data["name"] = getName.data.name.slice(9).split(' - Asset bundle - ')[0]
            fs.writeFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', JSON.stringify(res.data), 'utf8', (err) => { if (err) { console.log(err) } })
        } else {
            return
        }
    }

    avatarStatSummary.checkedFileIDs.push(fileid + "-" + fileversion)

    let filesize = await formatBytes(res.data.fileSize)
    let uncompresssize = await formatBytes(res.data.uncompressedSize)
    let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
    console.log(`${loglv().log}${selflog} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
             📦 ${filesize} , 🗃️ ${uncompresssize} , 🐏 ${vramTexsize} , 📐 ${res.data.avatarStats.totalPolygons} , 💡 ${res.data.avatarStats.lightCount} , 🥎 ${res.data.avatarStats.contactCount} , 🔊 ${res.data.avatarStats.audioSourceCount} , 🧲 ${res.data.avatarStats.blendShapeCount} , 🧊 ${res.data.avatarStats.bounds.map(Math.ceil)}`)

    // - Performance Marks-
    let totalavatareval = ``
    var warnbox = ''
    let boundsLongest = Math.round(Math.max(...res.data.avatarStats.bounds) / avatarStatWeights.boundsLongest)
    if (boundsLongest >= avatarStatWeights.lowerLimitWeight) {
        //warnbox += `\vBounds ${Math.max(...res.data.avatarStats.bounds)}m`;
        totalavatareval += `\n              Bounds:                    ${boundsLongest} EV ${boundsLongest >= avatarStatWeights.higherLimitWeight ? '⚠️🧊' : ''}`
    }
    var animatorCount = Math.round(res.data.avatarStats.animatorCount / avatarStatWeights.animatorCount)
    if (animatorCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Animator Count:            ${animatorCount} EV ${animatorCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.animatorCount : ''}` }
    var audioSourceCount = Math.round(res.data.avatarStats.audioSourceCount / avatarStatWeights.audioSourceCount)
    if (audioSourceCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              AudioSource Count:         ${audioSourceCount} EV ${audioSourceCount >= avatarStatWeights.higherLimitWeight ? '⚠️🔊' : ''}` }
    var boneCount = Math.round(res.data.avatarStats.boneCount / avatarStatWeights.boneCount)
    if (boneCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Bones:                     ${boneCount} EV ${boneCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.boneCount : ''}` }
    var cameraCount = Math.round(res.data.avatarStats.cameraCount / avatarStatWeights.cameraCount)
    if (cameraCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Camera Count:              ${cameraCount} EV ${cameraCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.cameraCount : ''}` }
    var clothCount = Math.round(res.data.avatarStats.clothCount / avatarStatWeights.clothCount)
    if (clothCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Cloth Count:               ${clothCount} EV ${clothCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.clothCount : ''}` }
    var constraintCount = Math.round(res.data.avatarStats.constraintCount / avatarStatWeights.constraintCount)
    if (constraintCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Constraint Count:           ${constraintCount} EV ${constraintCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintCount : ''}` }
    var constraintDepth = Math.round(res.data.avatarStats.constraintDepth / avatarStatWeights.constraintDepth)
    if (constraintDepth >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Constraint Depth:          ${constraintDepth} EV ${constraintDepth >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintDepth : ''}` }
    var lineRendererCount = Math.round(res.data.avatarStats.lineRendererCount / avatarStatWeights.lineRendererCount)
    if (lineRendererCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Line Renderer Count:       ${lineRendererCount} EV ${lineRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.lineRendererCount : ''}` }
    var materialCount = Math.round(res.data.avatarStats.materialCount / avatarStatWeights.materialCount)
    if (materialCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Material Count:            ${materialCount} EV ${materialCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialCount : ''}` }
    var meshParticleMaxPolygons = Math.round(res.data.avatarStats.meshParticleMaxPolygons / avatarStatWeights.meshParticleMaxPolygons)
    if (meshParticleMaxPolygons >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Mesh Particle Max Polygons:${meshParticleMaxPolygons} EV ${meshParticleMaxPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshParticleMaxPolygons : ''}` }
    var particleSystemCount = Math.round(res.data.avatarStats.particleSystemCount / avatarStatWeights.particleSystemCount)
    if (particleSystemCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Particle System Count:     ${particleSystemCount} EV ${particleSystemCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.particleSystemCount : ''}` }
    var physicsColliders = Math.round(res.data.avatarStats.physicsColliders / avatarStatWeights.physicsColliders)
    if (physicsColliders >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Physics Colliders:         ${physicsColliders} EV ${physicsColliders >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsColliders : ''}` }
    var physicsRigidbodies = Math.round(res.data.avatarStats.physicsRigidbodies / avatarStatWeights.physicsRigidbodies)
    if (physicsRigidbodies >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Physics Rigidbodies:       ${physicsRigidbodies} EV ${physicsRigidbodies >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsRigidbodies : ''}` }
    var totalClothVertices = Math.round(res.data.avatarStats.totalClothVertices / avatarStatWeights.totalClothVertices)
    if (totalClothVertices >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Cloth Vertices:            ${totalClothVertices} EV ${totalClothVertices >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalClothVertices : ''}` }
    var totalMaxParticles = Math.round(res.data.avatarStats.totalMaxParticles / avatarStatWeights.totalMaxParticles)
    if (totalMaxParticles >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Max Particles:             ${totalMaxParticles} EV ${totalMaxParticles >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalMaxParticles : ''}` }
    var trailRendererCount = Math.round(res.data.avatarStats.trailRendererCount / avatarStatWeights.trailRendererCount)
    if (trailRendererCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Trail Renderer Count:      ${trailRendererCount} EV ${trailRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.trailRendererCount : ''}` }
    var totalTextureUsage = Math.round(res.data.avatarStats.totalTextureUsage / avatarStatWeights.totalTextureUsage)
    if (totalTextureUsage >= avatarStatWeights.lowerLimitWeight) {
        warnbox += `\vTexture Memory ${vramTexsize}`;
        totalavatareval += `\n              Texture Memory:            ${totalTextureUsage} EV ${totalTextureUsage >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
    }
    var uncompressedSize = Math.round(res.data.uncompressedSize / avatarStatWeights.uncompressedSize)
    if (uncompressedSize >= avatarStatWeights.lowerLimitWeight) {
        warnbox += `\vRAM ${uncompresssize}`
        totalavatareval += `\n              Uncompressed Size:         ${uncompressedSize} EV ${uncompressedSize >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
    }
    var totalPolygons = Math.round(res.data.avatarStats.totalPolygons / avatarStatWeights.totalPolygons)
    if (totalPolygons >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Polygons:                  ${totalPolygons} EV ${totalPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️📐' : ''}` }
    var skinnedMeshCount = Math.round(res.data.avatarStats.skinnedMeshCount / avatarStatWeights.skinnedMeshCount)
    if (skinnedMeshCount >= avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\vSkinnedMeshes ${res.data.avatarStats.skinnedMeshCount}`;
        totalavatareval += `\n              Skinned Meshes:            ${skinnedMeshCount} EV ${skinnedMeshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.skinnedMeshCount : ''}`
    }
    var meshCount = Math.round(res.data.avatarStats.meshCount / avatarStatWeights.meshCount)
    if (meshCount >= avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\vBasic Meshes ${res.data.avatarStats.meshCount}`;
        totalavatareval += `\n              Basic Meshes:              ${meshCount} EV ${meshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshCount : ''}`
    }
    var physBoneCollisionCheckCount = Math.round(res.data.avatarStats.physBoneCollisionCheckCount / avatarStatWeights.physBoneCollisionCheckCount)
    if (physBoneCollisionCheckCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              PhysBone Collision Checks: ${physBoneCollisionCheckCount} EV ${physBoneCollisionCheckCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneCollisionCheckCount : ''}` }
    var physBoneColliderCount = Math.round(res.data.avatarStats.physBoneColliderCount / avatarStatWeights.physBoneColliderCount)
    if (physBoneColliderCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              PhysBone Colliders:        ${physBoneColliderCount} EV ${physBoneColliderCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneColliderCount : ''}` }
    var physBoneComponentCount = Math.round(res.data.avatarStats.physBoneComponentCount / avatarStatWeights.physBoneComponentCount)
    if (physBoneComponentCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              PhysBone Components:       ${physBoneComponentCount} EV ${physBoneComponentCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneComponentCount : ''}` }
    var physBoneTransformCount = Math.round(res.data.avatarStats.physBoneTransformCount / avatarStatWeights.physBoneTransformCount)
    if (physBoneTransformCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              PhysBone Transforms:       ${physBoneTransformCount} EV ${physBoneTransformCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneTransformCount : ''}` }
    var contactCount = Math.round(res.data.avatarStats.contactCount / avatarStatWeights.contactCount)
    if (contactCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Contact Count:             ${contactCount} EV ${contactCount >= avatarStatWeights.higherLimitWeight ? '⚠️🥎' : ''}` }
    var materialSlotsUsed = Math.round(res.data.avatarStats.materialSlotsUsed / avatarStatWeights.materialSlotsUsed)
    if (materialSlotsUsed >= avatarStatWeights.lowerLimitWeight) {
        // warnbox += `\vMaterial Slots ${res.data.avatarStats.materialSlotsUsed}`;
        totalavatareval += `\n              Material Slots:            ${materialSlotsUsed} EV ${materialSlotsUsed >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialSlotsUsed : ''}`
    }
    var lightCount = Math.round(res.data.avatarStats.lightCount / avatarStatWeights.lightCount)
    if (lightCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              Light Count:               ${lightCount} EV ${lightCount >= avatarStatWeights.higherLimitWeight ? '⚠️💡' : ''}` }
    var blendShapeCount = Math.round(res.data.avatarStats.blendShapeCount / avatarStatWeights.blendShapeCount)
    if (blendShapeCount >= avatarStatWeights.lowerLimitWeight) { totalavatareval += `\n              BlendShapes:               ${blendShapeCount} EV ${blendShapeCount >= avatarStatWeights.higherLimitWeight ? '⚠️🧲' : ''}` }

    if (totalavatareval.length > 1) { console.log(totalavatareval.replace(/\n/, '') + "\n") }
    if (warnbox.length > 0 && getInstanceGroupID() == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {
        // if(warnbox.length > 0 ){
        oscChatBoxV2(`${res.data.name.slice(0, 14)}${warnbox}`, 30000, false, true, false, true)
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

})

async function scanAllAvatarStats() {

    var fsrddir = await fsp.readdir('./datasets/avatarStatCache/', 'utf8')
    fsrddir.forEach(async (file, index, arr) => {
        var res = {}
        var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + file, 'utf8')
        console.log(`${loglv().log}${selflog} [AvatarAnalysis] Cached: ${file}`)
        res.data = JSON.parse(fsrdfile)


        let filesize = await formatBytes(res.data.fileSize)
        let uncompresssize = await formatBytes(res.data.uncompressedSize)
        let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
        console.log(`${loglv().log}${selflog} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
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


async function worldAutoPreloadQueue(worldList = []) {
    console.log(`${loglv().log}${selflog} [Auto World Preload] Starting, have ${worldList.length} worlds to go through`)
    setUserStatus('Preloading worlds')
    for (const wrd in worldList) {
        await joinWorld(worldList[wrd])
        if (wrd == worldList.length - 1) {
            console.log(`${loglv().hey}${selflog} [Auto World Preload] Finished, can close VRC if want.`)
            oscChatBoxV2(`Automatic Preload has finished \v Can close VRC if want.`, 30_000)
            setUserStatus('')
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
                    // 'displayName': 'Preloading Worlds',
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

function shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
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
        favWorlds1.forEach((wrld, index, arr) => { worldsToExplore.unshift(wrld.id) })
        worldsToExplore = shuffle(worldsToExplore)

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
                    // 'displayName': 'World Hop',
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
                    // 'displayName': 'World Hop',
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
const { table } = require('table');
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
                console.log('=== Avatar Performance Stat Summary ===\nCreation Date-Time\n   ' + new Date().toLocaleString() + '\nInstance Location\n    ' + G_lastlocation + '\n' + table(avatarStatSummaryTable, tableOptions) + `    Excellent: ${avatarStatSummary.Excellent}\n         Good: ${avatarStatSummary.Good}\n       Medium: ${avatarStatSummary.Medium}\n         Poor: ${avatarStatSummary.Poor}\n     VeryPoor: ${avatarStatSummary.VeryPoor}`)
                if (writeToFile == true) {
                    fs.writeFile('./datasets/avatarStatSummarys/' + Date.now() +' '+ G_lastlocation+ '.txt', '=== Avatar Performance Stat Summary ===\nCreation Date-Time\n   ' + new Date().toLocaleString() + '\nInstance Location\n    ' + G_lastlocation + '\n' + table(avatarStatSummaryTable, tableOptions) + `    Excellent: ${avatarStatSummary.Excellent}\n         Good: ${avatarStatSummary.Good}\n       Medium: ${avatarStatSummary.Medium}\n         Poor: ${avatarStatSummary.Poor}\n     VeryPoor: ${avatarStatSummary.VeryPoor}\n` + '\n--Avatar Security Checks used--' + avatarStatSummary.checkedFileIDs.map((v) => { return '\n' + v }), 'utf8', (err) => {
                        if (err) { console.error(err) }
                    })
                }
            }
            if (resetData == true) {
                avatarStatSummary = {
                    "totalAvatars": 0,
                    "checkedFileIDs": [],
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
var G_lastlocation = ''
logEmitter.on('headingToWorld', async (I_worldID,I_groupID,I_instanceType) => {
    // Get world info for OBS Stream
    let res = await vrchat.getWorld({ 'path': { 'worldId': I_worldID } })
    apiEmitter.emit('fetchedDistThumbnail', res.data.imageUrl, res.data.name.slice(0, 50), res.data.authorName.slice(0, 50), I_worldID)

    // Save avatar stats for the instance
    await requestAvatarStatTable(true, 0.05, true)
    G_lastlocation != `${I_instanceType} - ${I_worldID}${I_groupID != '' ? ' - '+I_groupID:''}` ? G_lastlocation = `${I_instanceType} - ${I_worldID}${I_groupID != '' ? ' - '+I_groupID:''}` : ''
})
logEmitter.on('gameclose', () => {
    // Save avatar stats for the instance
    requestAvatarStatTable(true, 0.05, true)
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