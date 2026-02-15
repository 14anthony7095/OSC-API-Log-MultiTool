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

const vrcFriendsList = {
    "friends": [
        "usr_4904f9c3-3ffe-4845-9f1d-86edee5442f4",
        "usr_4336eb60-5e95-4541-9fcf-3b8da5fc3bea",
        "usr_ee815921-8067-4486-a3e2-ded009457cf3",
        "usr_ce4369d7-9b7a-4ff0-8525-53ff6400b9b0",
        "usr_8963b9ee-815e-4e1f-9a9f-3696e8fd81c6",
        "usr_67997c8f-2f74-43bf-8ad2-a0c1c3e2c396",
        "usr_73b07248-81e2-4830-b0fc-bb8297364d22",
        "usr_2f95d21e-6cb1-4e3b-a692-bf0cbf1b98a8",
        "usr_10083767-0ce8-4819-8462-5cc606010ed2",
        "wS0bCRCA2Q",
        "usr_dd28d6b7-9e03-4f8c-950a-c8a5948bbdd8",
        "usr_a4c5014d-7ab3-41c1-bf11-5f554439fd29",
        "usr_1322298e-2215-47d2-ba99-4e19e3f470a8",
        "usr_0713889f-c2f0-48b7-aae4-e5da34f523b9",
        "usr_3857093d-12d3-492c-804b-d27dd421dff8",
        "usr_626775f6-4368-40b3-b6f9-1bf33683be24",
        "usr_2fe401d6-268d-4a0c-bd7d-68f6c13ed87d",
        "usr_4b6e356d-042d-4d40-b550-bd101da8352e",
        "usr_cde319bf-a5f5-47bb-8e78-5aff9a8cb5e6",
        "usr_bba4ca7a-5447-4672-828d-0a09d85f854e",
        "usr_3f072921-f926-4ffa-91f0-74a04838ea5f",
        "usr_d05302eb-f986-4300-a294-e0286cabc368",
        "usr_95c31e1e-15c3-4bf4-b8dd-00373124d67a",
        "usr_34182235-335d-48a7-bd3f-616e343b4d16",
        "usr_af56363e-1342-4ab1-98b9-62f0e446ab37",
        "usr_d325e73d-47b6-4190-b26f-d0a266d75179",
        "usr_8c03d7ce-685a-400d-9a42-eba01c9b8e98",
        "usr_a3b22558-55b2-4847-982a-d4e3a2bffee5",
        "usr_469ba82d-a0eb-4938-b199-e773af70c8f9",
        "usr_ad0aa613-faf2-4386-9c34-2c1f9111a414",
        "usr_1caf73d5-4028-4c04-913c-f9ff0018670e",
        "DJuzKVCGUJ",
        "usr_b436a003-9dd6-4abb-9889-60eb762978b3",
        "usr_0fc19edf-1eb0-4c60-b0bc-1e84ed0ed3a8",
        "usr_666496dc-243c-4978-a386-35a738cdfd6b",
        "usr_d4614a20-60f1-4ddd-ba5e-173e2ddfb428",
        "usr_9e4832d8-a767-4e65-8625-3a045d723577",
        "usr_22df3294-e059-4c0a-9258-4020fd222a16",
        "usr_620a2406-9b7b-4014-aeb6-e571dc580baf",
        "usr_868f2607-4240-435f-b115-76fbcb489a4f",
        "usr_4d8b7274-2866-41f9-9a21-96dbd03ffc32",
        "usr_7c657a9f-3fc0-4dfd-81f8-aea3e174cefa",
        "usr_4c2469d6-a236-4a5f-801a-914c9451b349",
        "usr_f903de19-04ff-43a7-9977-3115ecc312bd",
        "usr_1e773333-355d-4163-b93d-bd3ec7740a31",
        "usr_41e9218b-1c8b-4de3-ad2c-cb6f08557922",
        "usr_d79cf307-8e27-445b-85ef-8e9632217ddd",
        "usr_eb71327e-9afc-4a7c-accb-dd8ee2b9a882",
        "usr_d0891533-36dd-4d07-bb89-e1a8e361603d",
        "usr_4e2b299c-3431-498f-a18e-cfaa5aec489e",
        "usr_ef656ebe-49a5-4626-93dc-aa7113e062f2",
        "usr_17a53295-03cd-4bc4-b9e3-281cac09e86d",
        "usr_b0a081c1-ef49-4bda-b21a-d4bda6d6830a",
        "usr_39a91182-0df7-476e-bc4a-e5d709cca692",
        "usr_46296ab8-098e-4172-b044-c2d05db720ee",
        "usr_eda6f031-c4cb-4d3f-8d08-b878ed489d1a",
        "usr_732ae37f-307f-4a6d-ba1b-f7331cf12cb2",
        "usr_6f14da99-5083-4313-91ec-b4560477af11",
        "usr_8e02a5af-7198-4381-b3be-e99682c4f467",
        "usr_1786c130-8397-4928-bfa5-8a28efdca3a5",
        "usr_af676842-fd63-469a-aa84-cc08914559d7",
        "usr_8625697d-766f-4a95-8eaf-ff3edc0c27f0",
        "usr_74043f8b-2aba-4b74-ba06-d460d11f40b0",
        "usr_27a3edeb-618d-4216-b2a3-00f9bf5835dc",
        "usr_ca11950e-1b2a-4f55-b6eb-fb411968f14d",
        "usr_df10c726-a5d8-48c0-8562-fe4c491d0d0b",
        "usr_de2e68aa-726f-464f-8c64-8a6298f2732f",
        "usr_7688f6db-10c2-4cde-a7a1-b07e5aa74aab",
        "usr_381cbc2d-4ead-4d42-8d50-17372a0497c6",
        "usr_67a65a48-bb54-41c5-93ec-c4de625e8f63",
        "usr_cfa0d20d-85e1-4d72-ba32-86b5d92c2510",
        "usr_0ff2e767-bf15-43ef-a4bf-a59c12b2f4f6",
        "usr_b8489476-54af-4391-86c7-e3722f020ddc",
        "usr_e86f244d-31ba-4d25-9f82-65b91bf21aee",
        "usr_73a95799-ecf7-4f37-89c9-46dc0132e707",
        "usr_b28f895f-6145-447e-ae98-1e010264fa8d",
        "usr_d05ba252-e280-4b20-8cd6-b86702677bf4",
        "usr_92274ca5-7efd-45f2-9505-2b458dd52e72",
        "usr_b4dc18cf-cd76-4e42-9821-20e9b0329506",
        "usr_734b5a03-a4f0-4f3d-8af0-bfd93e0e8c3f",
        "usr_65e830b6-f4c5-443d-be5e-f0189e79a4dc",
        "usr_f9cd6884-f10a-4787-b3ca-f187617d2a00",
        "usr_bd13db3a-d070-4fc6-8d80-098e15f89785",
        "usr_542b963e-dafb-4706-841a-34ea0c543bb0",
        "usr_da7231d6-baf3-4dc9-a736-ea50561142bc",
        "usr_d223d957-8e54-4621-aa19-48ebd8d54d42",
        "usr_e782d702-4d9b-41d2-b9f4-c6e696724ecc",
        "usr_6cb936bb-afb8-4e51-a802-f3fb631773af",
        "usr_f020c221-21bb-454d-9b3c-f73cd516743c",
        "usr_f5cf9730-b7f4-4a8e-8aa0-3f72bba1d054",
        "usr_39b5a285-6035-43ed-864c-3c967b8b69c3",
        "usr_75669630-2851-470e-8972-fc2f52f5b746",
        "usr_c3201b4a-476c-49ca-a1a9-c1e931107e0a",
        "usr_e3ee14ae-9d97-4633-8472-644bb790d3a5",
        "usr_d3f2b55b-df07-4584-98c8-d162f2340744",
        "usr_73fafbef-1f6a-4aa3-9507-5e4c907fc743",
        "usr_fafcf782-7468-45b2-b00c-25d5bba3e1dd",
        "usr_ac16489f-db52-43ed-87d3-dc49c33b164a",
        "usr_60b263b7-77f7-4792-ba7b-296b11144cd0",
        "usr_42e46e78-70ae-4d3f-8a1e-504e041ca1a7",
        "usr_63c23aac-6d1e-4030-accf-a48731cdd069",
        "usr_fe203d3a-8098-4dc8-ac73-46cb5e9393ec",
        "usr_3aa2ab45-8070-4241-a78c-d73820f974d9",
        "usr_e19b4163-b877-43a1-a65d-2e84d4496964",
        "usr_7725e9ee-b8f5-4aea-9ded-989931597887",
        "usr_90e511a6-ffb9-4e19-a232-93c9bf0b3605",
        "usr_cca1a85f-c374-4e5a-99b8-6cb17d533189",
        "usr_3e6ecd79-0104-4eff-9092-11882e583281",
        "usr_3ed5706f-8278-4bc4-9913-44e271ea32cb",
        "usr_db6b86b5-19ba-4a3d-ab92-e698c8baef1f",
        "usr_e7ec6241-cdfa-44c9-a955-97bfb4744158",
        "usr_bc46c98c-5e78-4a17-9adf-80ee0a436c00",
        "usr_a6284483-de0d-4533-b097-c52e6c5841ca",
        "usr_e70c5f32-e658-46ee-ad9d-3b9cabeee68d",
        "usr_4c09e232-19e5-4f15-8204-561bbe010a2d",
        "usr_29cb2349-c411-417a-8ac8-420c0a4faee6",
        "usr_c80bb859-7945-4f67-9978-e1142b265295",
        "usr_df23e9ef-30be-4d8a-812f-762e3236c785",
        "usr_01cef8fa-0d04-4f39-9029-61090249ee1f",
        "usr_4ba82dee-9b54-4db6-91e3-1281391d8a00",
        "usr_ce5e2689-a60e-40c5-a511-10fc18f6e8d1",
        "usr_fde4aec7-b117-494a-8bd7-0f65243ef2c9",
        "usr_86a85c3a-3c27-4dee-991e-12fb3db66822",
        "usr_59f5b4c9-c508-4bda-955d-36beffda015d",
        "usr_fc35c588-89fe-4f12-a6f5-0e4806b2f6a9"
    ]
}
// main()
async function main() {
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);

    // 2026.01.28 01:35:17 Debug      -  [Behaviour] Switching Yugenki to avatar 01 - Akiho Nagase V2


    for (const item in vrcFriendsList.friends) {
        var res = await vrchat.getUser({ 'path': { 'userId': vrcFriendsList.friends[item] } })
        res.data.discordId != undefined ? console.log(`${res.data.displayName} - ${res.data.discordId}`) : ''
    }



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
// fileCheck('file_abe45c22-5700-487f-bdf2-68ee4baa63fc', 1)


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

