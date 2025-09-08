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


    let {data: avatarData} = await vrchat.getAvatar({ 'path':{ 'avatarId':'avtr_0c97e918-23d0-4934-b364-5fd28fb10236' } })

    console.log( avatarData.performance.standalonewindows )


}

main()



async function manualCall() {
    let { data: auth } = await vrchat.verifyAuthToken()
    // auth.ok != true ?console.log(auth.token) : console.log(`Couldn't return authcookie for whatever reason..`)
    const vrcapihttp = `https://vrchat.com/api/1/`



    fetch(vrcapihttp + "calendar/grp_5748540d-1466-4b0b-a771-b7cac5dc0ca3/event",
        {
            method: 'POST',
            headers: {
                'Cookie': "auth=" + auth.token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "startsAt": "2025-08-15T21:00:00.000Z",
                "endsAt": "2025-08-15T23:00:00.000Z",
                "title": "EventClone test",
                "accessType": "group",
                "description": "weekly meetup gathering hangout explore etc\nevent created to be cloned onto 5 weeks afterward",
                "category": "hangout",
                "tags": [],
                "isDraft": false,
                "imageId": "file_072c4481-1642-4226-91b8-01bbb61444d9",
                "roleIds": [],
                "parentId": null,
                "platforms": [
                    "standalonewindows"
                ],
                "languages": [
                    "eng"
                ],
                "sendCreationNotification": false,
                "featured": false,
                "hostEarlyJoinMinutes": 60,
                "guestEarlyJoinMinutes": 5,
                "closeInstanceAfterEndMinutes": 5,
                "usesInstanceOverflow": true
            })
        }).then(res => { console.log(res) })


    // fetch(vrcapihttp + 'groups/grp_75bcbc95-361e-4d90-9752-5a2d7bc270a3/transfer?transferTargetId=usr_df10c726-a5d8-48c0-8562-fe4c491d0d0b',
    //     {
    //         method: 'POST',
    //         headers: {
    //             'Cookie': "auth=" + auth.token,
    //             "Content-Type": "application/json"
    //         },
    //         body: JSON.stringify({})
    //     })



}


setInterval(() => {
    console.log('30s')
}, 30_000);

