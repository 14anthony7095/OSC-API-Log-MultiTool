/*
-------------------------------------

    VRChat API Requests

-------------------------------------
*/
// Libraries
const { VRChat } = require("vrchat");
const fs = require('fs');
require('dotenv').config()

let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
console.log(`${selflog} Loaded`)

const vrchat = new VRChat({
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
    }
});


async function main() {
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${selflog} Logged in as: ${currentUser.displayName}`);

    // manualCall()

    // vrchat.getOwnAvatar({'body':{},'query':{''},path:{'userId'}})
    // var targetGroupLogID_NHI = 'grp_3473d54b-8e10-4752-9548-d77a092051a4' // Nanachi's Hollow Inn
    // const { data: logOutput_NHI } = await vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_NHI }, query: { n: 100, offset: 0 } })
    // console.log(logOutput_NHI)

    // vrchat.uploadPrint({'body':{''}})

    // let { data: gfg } = await vrchat.getFavoriteGroups({ 'query':{ 'n':100, 'offset':0, 'ownerId':'usr_bea83aa3-dc28-4a08-8a55-5a5dabb66bc3' } })
    // console.log(gfg)

    // let getnots = await vrchat.getNotifications(); console.log(getnots)
    // let notifRes = await vrchat.getNotification({ 'path':{ 'notificationId':'not_cf3adb23-de16-4c3a-a57c-ab7a9aa32aeb' } }); console.log(notifRes)

    genaratePortalLibrary()

}

function updateProgress(current, total) {
    var progressBarTextGraphic = `[`
    let percent = Math.round(current / total * 100)
    let invPercent = 100 - percent
    for (let index = 0; index < percent; index++) { progressBarTextGraphic += `█` }
    for (let index = 0; index < invPercent; index++) { progressBarTextGraphic += `░` }
    progressBarTextGraphic += `]`
    console.log(progressBarTextGraphic+' '+percent+'%')
}

console.log(`[0%] Downloading first thumbnail`)
require('https').get('https://i.imgur.com/vphs047.png', (res) => {
    res.pipe(fs.createWriteStream('./worldThumbnails/dl/00000.png'))
    setTimeout(() => {
        main()
    }, 2_000)
})



var myWorldsArray = []
var gameWorldsArray = []
var privateWorldsArray = []
var worldHopFindLegacy = []
var worldHopFind2025 = []

var worldHopFinds01Array = []
var worldHopFinds02Array = []
var worldHopFinds03Array = []
var worldHopFinds04Array = []
var worldHopFinds05Array = []
var worldHopFinds06Array = []
var worldHopFinds07Array = []
var worldHopFinds08Array = []
var worldHopFinds09Array = []
var worldHopFinds10Array = []
var worldHopFinds11Array = []
var worldHopFinds12Array = []

var personalCollectionArray = []
var friendsOnlyWorldsArray = []
function genaratePortalLibrary() {
    console.log(`[0%] Starting Genaration`)
    let thumbnailCount = 0
    let totalCount = 0
    fs.readFile('./worldThumbnails/worldDatabase.json', 'utf8', async (err, data) => {
        console.log(`[0%] Loaded world database file`)
        let worldJson = JSON.parse(data)
        Object.keys(worldJson).forEach(key => { totalCount = totalCount + worldJson[key].length })
        let indexcount = 1
        await scan(worldJson.myworlds, indexcount);indexcount++
        await scan(worldJson.games_activity, indexcount);indexcount++
        await scan(worldJson.private_worlds, indexcount);indexcount++
        await scan(worldJson.worldhop_legacy, indexcount);indexcount++
        await scan(worldJson.worldhop_2025, indexcount);indexcount++
        await scan(worldJson.worldhop_01_jan, indexcount);indexcount++
        await scan(worldJson.worldhop_02_feb, indexcount);indexcount++
        await scan(worldJson.worldhop_03_mar, indexcount);indexcount++
        await scan(worldJson.worldhop_04_apr, indexcount);indexcount++
        await scan(worldJson.worldhop_05_may, indexcount);indexcount++
        await scan(worldJson.worldhop_06_june, indexcount);indexcount++
        await scan(worldJson.worldhop_07_july, indexcount);indexcount++
        await scan(worldJson.worldhop_08_aug, indexcount);indexcount++
        await scan(worldJson.worldhop_09_sep, indexcount);indexcount++
        await scan(worldJson.worldhop_10_oct, indexcount);indexcount++
        await scan(worldJson.worldhop_11_nov, indexcount);indexcount++
        await scan(worldJson.worldhop_12_dec, indexcount);indexcount++
        await scan(worldJson.personal_collection, indexcount);indexcount++

        let writeString = {
            "ShowPrivateWorld": true, "ReverseCategorys": false, "Roles": [
                { "RoleName": "Me", "DisplayNames": ["14anthony7069", "14anthony7095", "14anthony7096", "14anthony7097"] }
            ],
            "Categorys": [
                { "Category": "My Worlds", "Worlds": myWorldsArray },
                { "Category": "Games & Activity", "Worlds": gameWorldsArray },
                { "Category": "Private Worlds", "Worlds": privateWorldsArray },
                { "Category": "World Hop (Legacy)", "Worlds": worldHopFindLegacy },
                { "Category": "World Hop (2025)", "Worlds": worldHopFind2025 },
                { "Category": "World Hop (1-Jan)", "Worlds": worldHopFinds01Array },
                { "Category": "World Hop (2-Feb)", "Worlds": worldHopFinds02Array },
                { "Category": "World Hop (3-Mar)", "Worlds": worldHopFinds03Array },
                { "Category": "World Hop (4-Apr)", "Worlds": worldHopFinds04Array },
                { "Category": "World Hop (5-May)", "Worlds": worldHopFinds05Array },
                { "Category": "World Hop (6-June)", "Worlds": worldHopFinds06Array },
                { "Category": "World Hop (7-July)", "Worlds": worldHopFinds07Array },
                { "Category": "World Hop (8-Aug)", "Worlds": worldHopFinds08Array },
                { "Category": "World Hop (9-Sep)", "Worlds": worldHopFinds09Array },
                { "Category": "World Hop (10-Oct)", "Worlds": worldHopFinds10Array },
                { "Category": "World Hop (11-Nov)", "Worlds": worldHopFinds11Array },
                { "Category": "World Hop (12-Dec)", "Worlds": worldHopFinds12Array },
                { "Category": "Personal Collection", "Worlds": personalCollectionArray, "PermittedRoles": ["Me"] }
            ]
        }
        fs.writeFile('./worldThumbnails/output/worlds.json', JSON.stringify(writeString), (err) => {
            console.log(`[100%] Writing to worlds.json`)
            if (err) { console.log(err); return }
        })

        thumbnailCount++
        updateProgress(thumbnailCount, totalCount)
        console.log(`Downloading final thumbnail`)
        require('https').get('https://i.imgur.com/vphs047.png', (res) => {
            let tnctxt = `${thumbnailCount}`.padStart(5, '0')
            res.pipe(fs.createWriteStream('./worldThumbnails/dl/' + tnctxt + '.png'))
            setTimeout(() => {
                process.exit()
            }, 10_000)
        })

    })

    function scan(worldIDarr, worldList) {
        updateProgress(thumbnailCount, totalCount)
        console.log(`Scanning list ${worldList}`)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
            }, 2000 + (worldIDarr.length * 2000))

            worldIDarr.forEach((wID, index, arr) => {
                setTimeout(async () => {
                    updateProgress(thumbnailCount, totalCount)
                    console.log(`Looking up world details for ${wID}`)
                    let { data: worldData } = await vrchat.getWorld({ 'path': { 'worldId': wID } })

                    if (worldData == undefined) { console.log(`[WARNING] world 404 Error - ${wID}`) }

                    try {
                        thumbnailCount++

                        let dataPush = { "ID": worldData.id, "Name": worldData.name, "RecommendedCapacity": worldData.recommendedCapacity, "Capacity": worldData.capacity, "Description": worldData.description, "Platform": { "PC": (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'standalonewindows') != undefined), "Android": (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'android') != undefined), "iOS": (worldData.unityPackages.find(unityPackages => unityPackages.platform == 'ios') != undefined) }, "ReleaseStatus": worldData.releaseStatus }

                        switch (worldList) {
                            case 1: myWorldsArray.push(dataPush); break;
                            case 2: gameWorldsArray.push(dataPush); break;
                            case 3: privateWorldsArray.push(dataPush); break;
                            case 4: worldHopFindLegacy.push(dataPush); break;

                            case 5: worldHopFinds01Array.push(dataPush); break;
                            case 6: worldHopFinds02Array.push(dataPush); break;
                            case 7: worldHopFinds03Array.push(dataPush); break;
                            case 8: worldHopFinds04Array.push(dataPush); break;
                            case 9: worldHopFinds05Array.push(dataPush); break;
                            case 10: worldHopFinds06Array.push(dataPush); break;
                            case 11: worldHopFinds07Array.push(dataPush); break;
                            case 12: worldHopFinds08Array.push(dataPush); break;
                            case 13: worldHopFinds09Array.push(dataPush); break;
                            case 14: worldHopFinds10Array.push(dataPush); break;
                            case 15: worldHopFinds11Array.push(dataPush); break;
                            case 16: worldHopFinds12Array.push(dataPush); break;

                            case 17: personalCollectionArray.push(dataPush); break;
                            case 18: friendsOnlyWorldsArray.push(dataPush); break;
                            default: break;
                        }

                        updateProgress(thumbnailCount, totalCount)
                        console.log(`Downloading thumbnail for ${worldData.name}`)
                        require('https').get(worldData.thumbnailImageUrl, { 'headers': { 'User-Agent': "NodeJS/14anthony7095" } }, (res) => {
                            // console.log(res)
                            require('https').get(res.headers.location, (res2) => {
                                let tnctxt = `${thumbnailCount}`.padStart(5, '0')
                                updateProgress(thumbnailCount, totalCount)
                                console.log(`Saved as ${tnctxt}.png`)
                                res2.pipe(fs.createWriteStream('./worldThumbnails/dl/' + tnctxt + '.png'))
                            })
                        })

                    } catch (error) {
                        console.log(error)
                        totalCount--
                        updateProgress(thumbnailCount, totalCount)
                        console.log(`Downloading placeholder thumbnail for ${wID}`)
                        require('https').get('https://i.imgur.com/vphs047.png', (res) => {
                            let tnctxt = `${thumbnailCount}`.padStart(5, '0')
                            res.pipe(fs.createWriteStream('./worldThumbnails/dl/' + tnctxt + '.png'))
                        })
                    }

                }, index * 2000)

            })
        })

    }
}

