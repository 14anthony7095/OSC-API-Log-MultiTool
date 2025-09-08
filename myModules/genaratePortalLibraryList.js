/*
-------------------------------------

    VRChat API Requests

-------------------------------------
*/
// Libraries
const { loglv } = require("./config.js");
const { VRChat } = require("vrchat");
const fs = require('fs');
require('dotenv').config()

let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
console.log(`${loglv().log}${selflog} Loaded`)

const vrchat = new VRChat({
    application: {
        name: "Api-Osc-Interface_DEV",
        version: "1.2-DEV",
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


async function main() {
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);

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
        Object.keys(worldJson).forEach(key=>{ totalCount = totalCount + worldJson[key].length })
        await scan(worldJson.myworlds, 1)
        await scan(worldJson.games_activity, 2)
        await scan(worldJson.private_worlds, 3)
        await scan(worldJson.worldhop_legacy, 4)

        await scan(worldJson.worldhop_01_jan, 5)
        await scan(worldJson.worldhop_02_feb, 6)
        await scan(worldJson.worldhop_03_mar, 7)
        await scan(worldJson.worldhop_04_apr, 8)
        await scan(worldJson.worldhop_05_may, 9)
        await scan(worldJson.worldhop_06_june, 10)
        await scan(worldJson.worldhop_07_july, 11)
        await scan(worldJson.worldhop_08_aug, 12)
        await scan(worldJson.worldhop_09_sep, 13)
        await scan(worldJson.worldhop_10_oct, 14)
        await scan(worldJson.worldhop_11_nov, 15)
        await scan(worldJson.worldhop_12_dec, 16)

        await scan(worldJson.personal_collection, 17)
        await scan(worldJson.friends_only, 18)

        let writeString = {
            "ShowPrivateWorld": true, "ReverseCategorys": false, "Roles": [
                { "RoleName": "Friend", "DisplayNames": ["Lhun", "Manolo", "TheTacticion", "Gorange", "Turtlesnack256", "Escondan", "Breakfasto", "Nycelly", "Sagedabluemage", "Krantu", "ThunderClaw", process.env["VRC_ACC_NAME_2"], "Asagao_", "ApexGamingVR", "Zan X", "Maxi_", "Rezobyte", "Jeror7", "BluCloudy", "Lou Lou Waifu", "Skull_korn", "Chriin", "Melting3D", "ColdWinter0", "Shadowriver", "＝Grim＝", "Nestorboy", "Coaldran", "Ablemon", "Estefanoida", "Strange Petals", "B̴litz", "Zenolith", "Riku Satori", "Axolava", "Bloomin'", "Molly_Dreemurr", "Air In", "TummyTime", "Shiro Fuun", "Marino", "Kushogade", "Yugenki", "14anthony7097", "Kanokochan", "FrostyHase", "AzureNightOwl", "Swingly", "GoshImDowNowGG", "DrBlackRat", "Aesthiore", "Kainet", "Meowiie", "Ranirr", "sweetmetadata", "14anthony7069", "DrAbubu", "Wishdream", "ArtGhostt", "stereofoxmuviz", "Tabi Rita", "OJRmk1", "Chickenbreadlp", "Pyrii", "KatNX", "Supershy24 59d7", "Sunny_Bounder", "Speculabundus", "Flare_Blitz", "FUNTIME_FLEXIRO", "Dragon Stardust", "Shymity", "RoriCandyDemon", "Furality", "miam520", "NoirOvis", "dragonos130", "MMDREWIND", "CATMANDEAF", "BigOreoUwU", "TheFakeBlaze", "JusAri", "KangarooKisser", "Mishuuu", "Vigiloannalis", "Absumsocietas", "I'm_READY", "DementedGiggles", "RaineBow6", "LujiBoujee", "~Eros", "DarkBlueTail", "John_JLB", "itsBiffy", "SooShey", "Mr․Clasherton", "VantablackWolf", "Pyrosshade", "SirNate519", "Cmdr_mantis308", "․Lex․", "Sphoosel", "ShadowBun", "Pein is Styxus", "savvydigitigrades", "Luna-The-Bunny", "0P4 X45", "PatchkinBunny", "TheAyteYo", "E․N․T․E․R", "loki_bad", "ConsMayVary"] },
                { "RoleName": "Me", "DisplayNames": ["14anthony7069", "14anthony7095", "14anthony7096", "14anthony7097"] }
            ],
            "Categorys": [
                { "Category": "My Worlds", "Worlds": myWorldsArray },
                { "Category": "Games & Activity", "Worlds": gameWorldsArray },
                { "Category": "Private Worlds", "Worlds": privateWorldsArray },
                { "Category": "World Hop (Legacy)", "Worlds": worldHopFindLegacy },
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
                { "Category": "Personal Collection", "Worlds": personalCollectionArray, "PermittedRoles": ["Me"] },
                { "Category": "Friends Only", "Worlds": friendsOnlyWorldsArray, "PermittedRoles": ["Friend", "Me"] }
            ]
        }
        fs.writeFile('./worldThumbnails/output/worlds.json', JSON.stringify(writeString), (err) => {
            console.log(`[100%] Writing to worlds.json`)
            if (err) { console.log(err); return }
        })

        thumbnailCount++
        console.log(`[${Math.round(thumbnailCount / totalCount * 100)}%] Downloading final thumbnail`)
        require('https').get('https://i.imgur.com/vphs047.png', (res) => {
            let tnctxt = `${thumbnailCount}`.padStart(5, '0')
            res.pipe(fs.createWriteStream('./worldThumbnails/dl/' + tnctxt + '.png'))
            setTimeout(() => {
                process.exit()
            }, 10_000)
        })

    })

    function scan(worldIDarr, worldList) {
        console.log(`[${Math.round(thumbnailCount / totalCount * 100)}%] Scanning list ${worldList}`)
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true)
            }, 2000 + (worldIDarr.length * 2000))

            worldIDarr.forEach((wID, index, arr) => {
                setTimeout(async () => {
                    console.log(`[${Math.round(thumbnailCount / totalCount * 100)}%] Looking up world details for ${wID}`)
                    let { data: worldData } = await vrchat.getWorld({ 'path': { 'worldId': wID } })

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

                        console.log(`[${Math.round(thumbnailCount / totalCount * 100)}%] Downloading thumbnail for ${worldData.name}`)
                        require('https').get(worldData.thumbnailImageUrl, { 'headers': { 'User-Agent': "NodeJS/14anthony7095" } }, (res) => {
                            // console.log(res)
                            require('https').get(res.headers.location, (res2) => {
                                let tnctxt = `${thumbnailCount}`.padStart(5, '0')
                                console.log(`[${Math.round(thumbnailCount / totalCount * 100)}%] Saved as ${tnctxt}.png`)
                                res2.pipe(fs.createWriteStream('./worldThumbnails/dl/' + tnctxt + '.png'))
                            })
                        })

                    } catch (error) {
                        console.log(error)
                        totalCount--
                        console.log(`[${Math.round(thumbnailCount / totalCount * 100)}%] Downloading placeholder thumbnail for ${wID}`)
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

