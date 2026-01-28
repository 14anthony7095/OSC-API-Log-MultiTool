const fetch = require('node-fetch');
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const { loglv } = require('./config');
require('dotenv').config({'quiet':true})

// Home DISCORD below - all others
const hook_Self = new Webhook(process.env["WEBHOOK_HOME"]);

// Home DISCORD year - 14aYear groups
const hook_YEAR = new Webhook(process.env["WEBHOOK_YEAR"]);

// World hop group
const hook_Hop = new Webhook(process.env["WEBHOOK_WRLDHOP"]);

// NANACHI of VRChat DISCORD below
const hook_NoV = new Webhook(process.env["WEBHOOK_NOV"]);

// NANACHI Hollow Inn DISCORD below
const hook_NHI = new Webhook(process.env["WEBHOOK_NHI"]);

var hex = {
    Red: "#FF0000",
    Orange: "#FF9500",
    Yellow: "#FFD800",
    Green: "#00FF00",
    Cyan: "#409EFF",
    Blue: "#0026FF",
    Purple: "#B200FF",
    Pink: "#FF00DC",
    Black: "#000000",
    Grey_25_Lit: "#3F3F3F",
    Grey_50_Lit: "#808080",
    Grey_75_Lit: "#BDBDBD",
    White: "#FFFFFF"
}
var exampleTime = `2000-01-01T01:00:00.000Z`
var messageQueue = []

// const yearGroups = {
//     'grp_4f5d0456-4200-4b2c-8331-78856d1869e4': '1',
//     'grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233': '2',
//     'grp_378c0550-07a1-4cab-aa45-65ad4a817117': '3',
//     'grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8': '4',
//     'grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4': '5',
//     'grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675': '6',
//     'grp_5eb28410-68df-4609-b0c5-bc98cf754264': '7',
//     'grp_18aa4b68-9118-4716-9a39-42413e54db8c': '8',
//     'grp_768a2c3d-b22c-48d2-aae1-650483c347ea': '9',
//     'grp_243d9742-ce05-4fc3-b399-cd436528c432': '10'
// }

function hookSelector(grpID, embedMessage) {
    switch (grpID) {
        case 'grp_cdb7c49d-9a90-4b17-8137-ff17bc624c6c':
            hook_Self.setUsername('Weebs N Furries')
            hook_Self.setAvatar('https://cdn.discordapp.com/attachments/1363600318029627602/1465174032142831809/image.png')
            hook_Self.send(embedMessage).catch((err) => { console.log(err) })
            break;
       case 'grp_e483cc04-a610-471f-90eb-ec4eda8420be':
            hook_NoV.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case 'grp_3473d54b-8e10-4752-9548-d77a092051a4':
            hook_NHI.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_4f5d0456-4200-4b2c-8331-78856d1869e4`:
            hook_YEAR.setUsername('1 Year VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350425766596672/AccountAge_1.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`:
            hook_YEAR.setUsername('2 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350426013929542/AccountAge_2.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_378c0550-07a1-4cab-aa45-65ad4a817117`:
            hook_YEAR.setUsername('3 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350426291011694/AccountAge_3.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`:
            hook_YEAR.setUsername('4 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350426605453392/AccountAge_4.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`:
            hook_YEAR.setUsername('5 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350427066830899/AccountAge_5.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`:
            hook_YEAR.setUsername('6 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350427289260042/AccountAge_6.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_5eb28410-68df-4609-b0c5-bc98cf754264`:
            hook_YEAR.setUsername('7 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350427511423037/AccountAge_7.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_18aa4b68-9118-4716-9a39-42413e54db8c`:
            hook_YEAR.setUsername('8 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350427746435102/AccountAge_8.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`:
            hook_YEAR.setUsername('9 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350427993903194/AccountAge_9.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case `grp_243d9742-ce05-4fc3-b399-cd436528c432`:
            hook_YEAR.setUsername('10 Years VRC Collector')
            hook_YEAR.setAvatar('https://cdn.discordapp.com/attachments/1395338242689335406/1395350428396421271/AccountAge_10.png')
            hook_YEAR.send(embedMessage).catch((err) => { console.log(err) })
            break;
        case 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce':
            hook_Hop.send(embedMessage).catch((err) => { console.log(err) })
            break;
        default:
            hook_Self.send(embedMessage).catch((err) => { console.log(err) })
            break;
    }
}

function firstMessage(groupID, logtime) {
    let embed = new MessageBuilder()
        .setTitle(`Initial message`)
        .setDescription(`await logs`)
        .setColor(hex.White).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}

function undiscoveredEvent(groupID, logtime, eventType, logOutput) {
    let embed = new MessageBuilder()
        .setText(`<@111238505824342016>`)
        .setTitle(`Unregistered Event: ${eventType}`)
        .setDescription(`${logOutput.replace(/\*/g, '\\*').replace(/\_/g, '\\_')}`)
        .setColor(hex.White).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.undiscoveredEvent = undiscoveredEvent;


function groupInstanceCreate(groupID = '', logtime, actorName = '', actorImageURL = '', worldID = '', instanceID = '', instanceType = '', instanceRegion = '', worldName = '', worldImage = '', worldPlatformSupport = [false, false, false]) {
    var wpsTex = ''
    if (worldPlatformSupport[0] == true) { wpsTex += '<:platformPConly:1395167189845147800>' }
    if (worldPlatformSupport[1] == true) { wpsTex += '<:platformAndroidonly:1395167186645028945>' }
    if (worldPlatformSupport[2] == true) { wpsTex += '<:platformiOSonly:1395167188414890015>' }
    if (worldPlatformSupport == [false, false, false]) { wpsTex = 'none <:NOooo:992068007251685396>' }
    let embed = new MessageBuilder()
        .setTitle(`Group ${instanceType} instance created by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}.`).setThumbnail(actorImageURL)
        .addField(`Instance Info`, `
World: ${worldName}
Platform: ${wpsTex}
WorldID: [${worldID}](https://vrchat.com/home/world/${worldID}/info)
ID: ${instanceID}
Type: ${instanceType}
Region: ${instanceRegion}`)
        .setImage(worldImage)
        .setColor(hex.Green).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupInstanceCreate = groupInstanceCreate;
// instanceCreate(`2025-02-02T15:18:17.000Z`,process.env["VRC_ACC_NAME_1"],'https://cdn.discordapp.com/avatars/111238505824342016/754f691b9711ae9e568f0000338c8446.webp?size=128',`wrld_64c391dc-d1bd-448e-a869-95f10f506eaa`,`12345`,`Group+`,`US West`)

function groupInstanceClose(groupID, logtime, actorName, actorImageURL, worldID, instanceID, instanceType, instanceRegion, worldName, worldImage, worldPlatformSupport = [false, false, false]) {
    var wpsTex = ''
    if (worldPlatformSupport[0] == true) { wpsTex += '<:platformPConly:1395167189845147800>' }
    if (worldPlatformSupport[1] == true) { wpsTex += '<:platformAndroidonly:1395167186645028945>' }
    if (worldPlatformSupport[2] == true) { wpsTex += '<:platformiOSonly:1395167188414890015>' }
    if (worldPlatformSupport == [false, false, false]) { wpsTex = 'none <:NOooo:992068007251685396>' }
    let embed = new MessageBuilder()
        .setTitle(`Group ${instanceType} instance closed by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}.`).setThumbnail(actorImageURL)
        .addField(`Instance Info`, `
World: ${worldName}
Platform: ${wpsTex}
WorldID: [${worldID}](https://vrchat.com/home/world/${worldID}/info)
ID: ${instanceID}
Type: ${instanceType}
Region: ${instanceRegion}`)
        .setImage(worldImage)
        .setColor(hex.Red).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupInstanceClose = groupInstanceClose;
// instanceClose(`2025-02-02T15:18:17.000Z`,process.env["VRC_ACC_NAME_1"],'https://cdn.discordapp.com/avatars/111238505824342016/754f691b9711ae9e568f0000338c8446.webp?size=128',`wrld_64c391dc-d1bd-448e-a869-95f10f506eaa`,`12345`,`Group+`,`US West`)

function groupMemberJoin(groupID, logtime, actorName, actorImageURL, actorID, userPlatform, userTrustRank, ageVerifyStat, userJoinDate, userProfilePicURL) {
    var displayPlatform = `???`
    if (userPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (userPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (userPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    let embed = new MessageBuilder()
        .setTitle(`User ${actorName.replace(/(~|_|\*|#)/g, `\$1`)} has joined the group.`).setThumbnail(actorImageURL)
        .setDescription(`[View user on vrchat.com](https://vrchat.com/home/user/${actorID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${userTrustRank}`, true)
        .addField('Age Verification', `${ageVerifyStat}`, true)
        .addField(`Account Creation Date`, `${userJoinDate}`, true)
        // .setImage(`${userProfilePicURL}`)
        .setColor(hex.Green).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupMemberJoin = groupMemberJoin;


function groupMemberJoinAdded(groupID, logtime, targetName, actorName, actorImageURL, targetID, targetUserPlatform, targetUserTrustRank, targetAgeVerifyStat, targetUserJoinDate, targetUserProfilePicURL) {
    var displayPlatform = '???'
    if (targetUserPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (targetUserPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (targetUserPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    let embed = new MessageBuilder()
        .setTitle(`User ${targetName.replace(/(~|_|\*|#)/g, `\$1`)} has been added to the group by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}.`).setThumbnail(actorImageURL)
        .setDescription(`[View Added user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${targetUserTrustRank}`, true)
        .addField('Age Verification', `${targetAgeVerifyStat}`, true)
        .addField(`Account Creation Date`, `${targetUserJoinDate}`, true)
        // .setImage(`${targetUserProfilePicURL}`)
        .setColor(hex.Green).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupMemberJoinAdded = groupMemberJoinAdded;


function groupMemberLeave(groupID, logtime, actorName, actorImageURL, actorID, userPlatform, userTrustRank, ugeVerifyStat, userJoinDate) {
    var displayPlatform = '???'
    if (userPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (userPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (userPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    let embed = new MessageBuilder()
        .setTitle(`User ${actorName.replace(/(~|_|\*|#)/g, `\$1`)} has left the group.`).setThumbnail(actorImageURL)
        .setDescription(`[View user on vrchat.com](https://vrchat.com/home/user/${actorID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${userTrustRank}`, true)
        .addField('Age Verification', `${ugeVerifyStat}`, true)
        .addField(`Account Creation Date`, `${userJoinDate}`, true)
        .setColor(hex.Red).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupMemberLeave = groupMemberLeave;


function groupMemberRemove(groupID, logtime, actorName, actorImageURL, targetName, targetID, targetUserPlatform, targetUserTrustRank, targetAgeVerifyStat, targetUserJoinDate) {
    var displayPlatform = '???'
    if (targetUserPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (targetUserPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (targetUserPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    let embed = new MessageBuilder()
        .setTitle(`User ${targetName.replace(/(~|_|\*|#)/g, `\$1`)} was removed from the group by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}`).setThumbnail(actorImageURL)
        .setDescription(`[View Removed user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${targetUserTrustRank}`, true)
        .addField('Age Verification', `${targetAgeVerifyStat}`, true)
        .addField(`Account Creation Date`, `${targetUserJoinDate}`, true)
        .setColor(hex.Red).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupMemberRemove = groupMemberRemove;


function groupInstanceKick(groupID, logtime, actorName, actorImageURL, targetName, worldID, instanceID, instanceType, instanceRegion, targetID, worldName, worldImage, targetUserPlatform, targetUserTrustRank, targetAgeVerifyStat, targetUserJoinDate, worldPlatformSupport = [false, false, false]) {
    var displayPlatform = '???'
    if (targetUserPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (targetUserPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (targetUserPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    var wpsTex = ''
    if (worldPlatformSupport[0] == true) { wpsTex += '<:platformPConly:1395167189845147800>' }
    if (worldPlatformSupport[1] == true) { wpsTex += '<:platformAndroidonly:1395167186645028945>' }
    if (worldPlatformSupport[2] == true) { wpsTex += '<:platformiOSonly:1395167188414890015>' }
    if (worldPlatformSupport == [false, false, false]) { wpsTex = 'none <:NOooo:992068007251685396>' }
    let embed = new MessageBuilder()
        .setTitle(`${actorName.replace(/(~|_|\*|#)/g, `\$1`)} has issued an instance kick for ${targetName.replace(/(~|_|\*|#)/g, `\$1`)}`).setThumbnail(actorImageURL)
        .setDescription(`[View Kicked user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${targetUserTrustRank}`, true)
        .addField('Age Verification', `${targetAgeVerifyStat}`, true)
        .addField(`Account Creation Date`, `${targetUserJoinDate}`, true)
        .addField(`Instance Info`, `
World: ${worldName}
Platform: ${wpsTex}
WorldID: [${worldID}](https://vrchat.com/home/world/${worldID}/info)
ID: ${instanceID}
Type: ${instanceType}
Region: ${instanceRegion}`)
        //         .setImage(worldImage)
        .setColor(hex.Red).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupInstanceKick = groupInstanceKick;


function groupInstanceWarn(groupID, logtime, actorName, actorImageURL, targetName, worldID, instanceID, instanceType, instanceRegion, targetID, worldName, worldImage, targetUserPlatform, targetUserTrustRank, targetAgeVerifyStat, targetUserJoinDate, worldPlatformSupport = [false, false, false]) {
    var displayPlatform = '???'
    if (targetUserPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (targetUserPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (targetUserPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    var wpsTex = ''
    if (worldPlatformSupport[0] == true) { wpsTex += '<:platformPConly:1395167189845147800>' }
    if (worldPlatformSupport[1] == true) { wpsTex += '<:platformAndroidonly:1395167186645028945>' }
    if (worldPlatformSupport[2] == true) { wpsTex += '<:platformiOSonly:1395167188414890015>' }
    if (worldPlatformSupport == [false, false, false]) { wpsTex = 'none <:NOooo:992068007251685396>' }
    let embed = new MessageBuilder()
        .setTitle(`${actorName.replace(/(~|_|\*|#)/g, `\$1`)} has issued an instance warn for ${targetName.replace(/(~|_|\*|#)/g, `\$1`)}`).setThumbnail(actorImageURL)
        .setDescription(`[View Warned user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${targetUserTrustRank}`, true)
        .addField('Age Verification', `${targetAgeVerifyStat}`, true)
        .addField(`Account Creation Date`, `${targetUserJoinDate}`, true)
        .addField(`Instance Info`, `
World: ${worldName}
Platform: ${wpsTex}
WorldID: [${worldID}](https://vrchat.com/home/world/${worldID}/info)
ID: ${instanceID}
Type: ${instanceType}
Region: ${instanceRegion}`)
        // .setImage(worldImage)
        .setColor(hex.Orange).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupInstanceWarn = groupInstanceWarn;


function groupUserBan(groupID, logtime, actorName, actorImageURL, targetName, targetID, targetUserPlatform, targetUserTrustRank, targetAgeVerifyStat, targetUserJoinDate) {
    var displayPlatform = '???'
    if (targetUserPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (targetUserPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (targetUserPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    let embed = new MessageBuilder()
        .setTitle(`User ${targetName.replace(/(~|_|\*|#)/g, `\$1`)} was banned by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}.`).setThumbnail(actorImageURL)
        .setDescription(`[View Banned user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${targetUserTrustRank}`, true)
        .addField('Age Verification', `${targetAgeVerifyStat}`, true)
        .addField(`Account Creation Date`, `${targetUserJoinDate}`, true)
        .setColor(hex.Red).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupUserBan = groupUserBan;


function groupUserUnban(groupID, logtime, actorName, actorImageURL, targetName, targetID) {
    let embed = new MessageBuilder()
        .setTitle(`User ${targetName.replace(/(~|_|\*|#)/g, `\$1`)} was unbanned by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}.`).setThumbnail(actorImageURL)
        .setDescription(`[View Unbanned user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .setColor(hex.Green).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupUserUnban = groupUserUnban;


function groupInviteCreate(groupID, logtime, actorName, actorImageURL, targetName, targetID, targetUserPlatform, targetUserTrustRank, targetAgeVerifyStat, targetUserJoinDate) {
    var displayPlatform = '???'
    if (targetUserPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (targetUserPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (targetUserPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    let embed = new MessageBuilder()
        .setTitle(`User ${targetName.replace(/(~|_|\*|#)/g, `\$1`)} has been invited to the group by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}.`).setThumbnail(actorImageURL)
        .setDescription(`[View Invited user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${targetUserTrustRank}`, true)
        .addField('Age Verification', `${targetAgeVerifyStat}`, true)
        .addField(`Account Creation Date`, `${targetUserJoinDate}`, true)
        .setColor(hex.Cyan).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupInviteCreate = groupInviteCreate;


function groupInviteCancel(groupID, logtime, actorName, actorImageURL, targetName, targetID) {
    let embed = new MessageBuilder()
        .setTitle(`User ${targetName.replace(/(~|_|\*|#)/g, `\$1`)} has been uninvited to the group by ${actorName.replace(/(~|_|\*|#)/g, `\$1`)}.`).setThumbnail(actorImageURL)
        .setDescription(`[View Invited user on vrchat.com](https://vrchat.com/home/user/${targetID})`)
        .setColor(hex.Cyan).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupInviteCancel = groupInviteCancel;


function groupPostCreate(groupID, logtime, actorDisplayName, logtitle, logdata, postImageURL) {
    let embed = new MessageBuilder()
        .setTitle(logtitle)
        .setDescription(logdata)
        .setImage(postImageURL)
        .setColor(hex.Yellow).setFooter(`${actorDisplayName} - VRC Audit Log`, 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupPostCreate = groupPostCreate;


function groupPostUpdate(groupID, logtime, actorDisplayName, logtitle, logdata) {
    let embed = new MessageBuilder()
        .setAuthor(`todo: get original image and author from post`)
        .setTitle(logtitle)
        .setDescription(logdata)
        .setColor(hex.Yellow).setFooter(`VRC Audit Log`, 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupPostUpdate = groupPostUpdate;


function groupPostDelete(groupID, logtime, actorImageURL, logdes, postAuthorName, logtitle, logdata, postImageURL) {
    let embed = new MessageBuilder()
        .setAuthor(logdes).setThumbnail(actorImageURL)
        .setTitle(`~~${logtitle}~~`)
        .setDescription(`~~${logdata}~~`)
        .setImage(postImageURL)
        .setColor(hex.Yellow).setFooter(`${postAuthorName} - VRC Audit Log`, 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupPostDelete = groupPostDelete;


function groupMemberUserUpdate(groupID, logtime, logdes, logdata) {
    let embed = new MessageBuilder()
        .setAuthor(`I'll set this up better later`)
        .setTitle(logdes)
        .setDescription(logdata)
        .setColor(hex.Pink).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupMemberUserUpdate = groupMemberUserUpdate;


function groupMemberRoleAssign(groupID, logtime, logdes, actorImageURL) {
    let embed = new MessageBuilder()
        .setTitle(logdes).setThumbnail(actorImageURL)
        .setColor(hex.Blue).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupMemberRoleAssign = groupMemberRoleAssign;

function groupMemberRoleUnassign(groupID, logtime, logdes, actorImageURL) {
    let embed = new MessageBuilder()
        .setTitle(logdes).setThumbnail(actorImageURL)
        .setColor(hex.Blue).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupMemberRoleUnassign = groupMemberRoleUnassign;


function groupRoleCreate(groupID, logtime, logdes, actorImageURL, roleOrder, selfAssign, addOnJoin, reqPurchase, reqTwoFactor, rolePermissions) {
    let embed = new MessageBuilder()
        .setTitle(logdes).setThumbnail(actorImageURL)
        .addField(`Order`, roleOrder, true)
        .addField(`Self Assignable`, selfAssign, true)
        .addField(`Added On Join`, addOnJoin, true)
        .addField(`Requires Purchase`, reqPurchase, true)
        .addField(`Requires TwoFactor`, reqTwoFactor, true)
        .addField(`Permissions`, rolePermissions, false)
        .setColor(hex.Blue).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupRoleCreate = groupRoleCreate;


function groupRoleDelete(groupID, logtime, logdes, actorImageURL, roleOrder, selfAssign, addOnJoin, reqPurchase, reqTwoFactor, managementRole, rolePermissions) {
    let embed = new MessageBuilder()
        .setTitle(logdes).setThumbnail(actorImageURL)
        .addField(`Order`, roleOrder, true)
        .addField(`Self Assignable`, selfAssign, true)
        .addField(`Added On Join`, addOnJoin, true)
        .addField(`Requires Purchase`, reqPurchase, true)
        .addField(`Requires TwoFactor`, reqTwoFactor, true)
        .addField(`Was Management Role`, managementRole, true)
        .addField(`Permissions`, rolePermissions, false)
        .setColor(hex.Blue).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupRoleDelete = groupRoleDelete;


function groupRoleUpdate(groupID, logtime, logdes) {
    let embed = new MessageBuilder()
        .setAuthor(`I'll set this up better later`)
        .setTitle(logdes)
        .setColor(hex.Blue).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupRoleUpdate = groupRoleUpdate;


function groupRequestCreate(groupID, logtime, actorDisplayName, actorImageURL, actorId, userPlatform, userTrustRank, ageVerifyStat, userJoinDate) {
    var displayPlatform = '???'
    if (userPlatform == 'standalonewindows') { displayPlatform = '<:platformPConly:1395167189845147800> **PC**' }
    else if (userPlatform == 'android') { displayPlatform = '<:platformAndroidonly:1395167186645028945> **Android**' }
    else if (userPlatform == 'ios') { displayPlatform = '<:platformiOSonly:1395167188414890015> **IOS**' }
    let embed = new MessageBuilder()
        .setTitle(`User ${actorDisplayName} requested to join the group.`).setThumbnail(actorImageURL)
        .setDescription(`[View user on vrchat.com](https://vrchat.com/home/user/${actorId})`)
        .addField('Platform', displayPlatform, true)
        .addField(`Rank`, `${userTrustRank}`, true)
        .addField('Age Verification', `${ageVerifyStat}`, true)
        .addField(`Account Creation Date`, `${userJoinDate}`, true)
        .setColor(hex.Orange).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupRequestCreate = groupRequestCreate;


function groupRequestReject(groupID, logtime, actorDisplayName, actorImageURL, targetDisplayName, targetUserID) {
    let embed = new MessageBuilder()
        .setTitle(`Member ${actorDisplayName} has rejected ${targetDisplayName}'s join request.`).setThumbnail(actorImageURL)
        .setDescription(`[View user on vrchat.com](https://vrchat.com/home/user/${targetUserID})`)
        .setColor(hex.Orange).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupRequestReject = groupRequestReject;


function groupRequestBlock(groupID, logtime, logdes) {
    let embed = new MessageBuilder()
        .setAuthor(`I'll set this up better later`)
        .setTitle(logdes)
        .setColor(hex.Orange).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupRequestBlock = groupRequestBlock;


function groupTransferAccept(groupID, logtime, logdes) {
    let embed = new MessageBuilder()
        .setAuthor(`I'll set this up better later`)
        .setTitle(logdes)
        .setColor(hex.Purple).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupTransferAccept = groupTransferAccept;

function groupTransferStart(groupID, logtime, logdes) {
    let embed = new MessageBuilder()
        .setAuthor(`I'll set this up better later`)
        .setTitle(logdes)
        .setColor(hex.Purple).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupTransferStart = groupTransferStart;

function groupUpdate(groupID, logtime, logdes) {
    let embed = new MessageBuilder()
        .setAuthor(`I'll set this up better later`)
        .setTitle(logdes)
        .setColor(hex.Purple).setFooter('VRC Audit Log', 'https://assets.vrchat.com/www/favicons/favicon-32x32.png').setTimestamp(logtime);
    hookSelector(groupID, embed)
}
exports.groupUpdate = groupUpdate;

// {
//     "data": {
//         "name": {
//             "new": "Nanachi 's hollow inn",
//             "old": "Nanachi's hollow inn"
//         }
//     },
//     "description": "Group Nanachi's hollow inn updated by SteelDoritos.",
// }

// {
//     "data": {
//         "shortCode": {
//             "new": "NANAIN",
//             "old": "NANINN"
//         }
//     },
//     "description": "Group Nanachi 's hollow inn updated by SteelDoritos.",
// }