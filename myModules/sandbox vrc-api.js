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

var worldQueueTxt = './worldListBuilder.txt'
async function main() {
    const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
    console.log(`${loglv().log}${selflog} Logged in as: ${currentUser.displayName}`);

    var props = [
        "prop_89be973f-9e1a-4260-8deb-211e32da8196",
        "prop_829ba6f6-b837-49d9-b9a9-056b82103b58",
        "prop_5c54ccdb-cafb-461b-b07f-91d189fc7b72",
        "prop_79789b58-e020-4b2e-aa25-ba21a1938eec",
        "prop_49fec698-f0cb-475c-9bc3-8f24e1bcc4eb",
        "prop_fb4e6b9e-ddd2-464c-8e44-cdba7f77eb5d",
        "prop_213156fd-eb54-4c2c-8e12-cc840581ec73",
        "prop_0b5e9595-e9e6-4f11-bd59-5ae6abe34f67",
        "prop_57484479-1f1b-4a9c-986b-b0c86e1c0dda",
        "prop_dae2be6b-9c3b-4783-948b-4ff46d3a14e5",
        "prop_0fd9deb0-6ca8-4c69-acbe-17035f93792b",
        "prop_e9d0bc1f-f7fd-4886-abec-d299745b2264",
        "prop_3e81ff20-b64a-4ecb-9429-bd076a96fcf8",
        "prop_81ce8d80-72d8-4f60-9d6b-689a8340f55d"
    ]
    var propsDataBase = 'name,description,id,authorName,authorId,created_at,updated_at,version,releaseStatus,itemTemplate,maxCountPerUser,scaleWithAvatar,spawnType,visibilityType,worldPlacementMask'

    for (const item in props) {
        console.log(props[item])
        let propData = await vrchat.getProp({ 'path': { 'propId': props[item] } })
        propsDataBase += `\n"${propData.data.name}","${propData.data.description.replace(`\n`,'')}",${propData.data.id},${propData.data.authorName},${propData.data.authorId},${propData.data._created_at},${propData.data._updated_at},${propData.data.version},${propData.data.releaseStatus},${propData.data.itemTemplate},${propData.data.maxCountPerUser},${propData.data.scaleWithAvatar},${propData.data.spawnType},${propData.data.visibilityType},${propData.data.worldPlacementMask}`
    }

    fs.writeFile('datasets/prop_data.csv', propsDataBase, 'utf-8', (err) => { if (err) { console.log(err) } })

    // manualCall()

    /* var worldData = []
    var searchTags = ['factory', 'automation', 'factorio', 'shapez', 'satisfactory', 'opus magnum', 'simulation', 'automate', 'factory simulation', 'factory automation']

    searchTags.forEach((tag, index, arr) => {
        setTimeout(async () => {
            console.log(`searching ${tag} tags`)
            let tagString = ''
            tag.split(' ').forEach((spaced) => {
                tagString == '' ? tagString += `author_tag_${spaced}` : tagString += `,author_tag_${spaced}`
            })
            let worldData1 = await vrchat.searchWorlds({ 'query': { 'n': 100, 'tag': tagString } })

            console.log(`searching ${tag}`)
            let worldData2 = await vrchat.searchWorlds({ 'query': { 'n': 100, 'search': tag } })

            console.log(`searching ${tag} tags in Community Labs`)
            tagString = 'system_labs,'
            tag.split(' ').forEach((spaced) => {
                tagString == 'system_labs,' ? tagString += `author_tag_${spaced}` : tagString += `,author_tag_${spaced}`
            })
            let worldData3 = await vrchat.searchWorlds({ 'query': { 'sort': 'labsPublicationDate', 'n': 100, 'tag': tagString } })

            console.log(`searching ${tag} in Community Labs`)
            let worldData4 = await vrchat.searchWorlds({ 'query': { 'sort': 'labsPublicationDate', 'n': 100, 'search': tag } })

            worldData = worldData1.data.concat(worldData2.data, worldData3.data, worldData4.data)

            let worldlist = ''
            worldData.forEach((w, index, arr) => {
                console.log(`(${index + 1}/${arr.length}) Added ${w.name} to queue`)
                // console.log(`${loglv().log}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
                index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
            })
            fs.appendFile(worldQueueTxt, worldlist + `\r\n`, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
        }, 10_000 * index);
    }) */

    // 'search':'factory'

    // author_tag_

    // 'tag': 'system_labs, '
    // 'sort':'labsPublicationDate'







}

main()




async function manualCall() {
    let { data: auth } = await vrchat.verifyAuthToken()
    auth.ok == true ? console.log(auth.token) : console.log(`Couldn't return authcookie for whatever reason..`)
    const vrcapihttp = `https://vrchat.com/api/1/`

    var request = await fetch(vrcapihttp + "inventory/inv_c74dca5d-b15c-4693-99f6-b7b8a6ff12dd/equip",
        {
            method: 'PUT',
            headers: {
                'User-Agent': '14anthony7095/Curl',
                'Cookie': 'auth=' + auth.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "equipSlot": "portal" })
        })
    var data = await request.json()
    console.log(data)

}


setInterval(() => {
    console.log('30s')
}, 30_000);

