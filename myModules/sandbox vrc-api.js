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


    // manualCall()

    var worldData = []
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
    })

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

