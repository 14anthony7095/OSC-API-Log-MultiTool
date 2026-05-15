/*
-------------------------------------

	VRChat Log Reader

-------------------------------------
*/
// Libraries
var { loglv, printAllLogs, ChatVideoURL, ChatVideoTitle, ttvAlwaysRun, ttvFetchFrom, ChatImageStringURL, ChatDownSpeed, logStickers, downloadStickers } = require('./config.js')
var { oscSend, OSCDataBurst, oscEmitter, oscChatBoxV2, getOSCDataBurstState } = require('./Interface_osc_v1.js')
var { switchChannel, joinChannel, leaveChannel } = require('./Interface_twitch.js');
var fs = require('fs')
const fsp = require('fs').promises
var ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const say = require('say');
const { EventEmitter, once } = require('events');
const apiEmitter = new EventEmitter
exports.apiEmitter = apiEmitter;
const logEmitter = new EventEmitter
exports.logEmitter = logEmitter;
const { cmdEmitter } = require('./input.js');
const { PiShock, PiShockAll } = require('./Interface_PS.js');
const { config } = require('process');
require('dotenv').config({ 'quiet': true })
const { undiscoveredEvent, groupMemberJoinAdded, groupMemberJoin, groupMemberLeave, groupMemberRemove, groupMemberUserUpdate, groupMemberRoleAssign, groupMemberRoleUnassign, groupPostCreate, groupPostUpdate, groupPostDelete, groupRoleCreate, groupRoleDelete, groupRequestCreate, groupRequestReject, groupInstanceCreate, groupInstanceClose, groupInstanceWarn, groupInstanceKick, groupInviteCreate, groupInviteCancel, groupUserBan, groupUserUnban, groupUpdate } = require('./interace_WebHook.js')
const { VRChat } = require("vrchat");
const { KeyvFile } = require("keyv-file");
const { WebSocket } = require("ws");
const { table } = require('table');
const { default: open } = require('open');
// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database('datasets/vrchat-X-discord.db');

// Global Scope
let selflogL = `\x1b[0m[\x1b[32mVRC_Log\x1b[0m]`
let selflogA = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
let selflogWS = `\x1b[0m[\x1b[33mVRC_WebSocket\x1b[0m]`
var path = 'C:/Users/14anthony7095/AppData/LocalLow/VRChat/VRChat/'
var verboseAvatarStatLogging = true
var tarFile = 'nothing'
var tarFileSize = 0
var tarFilePath = 'nothing'
var playersInInstance = []
var membersInInstance = []
var playersInstanceObject = []
var playerHardLimit = 99
var playerRatio = 0.5
var memberRatio = 0.5
var G_autoNextWorldHop = false
var worldHoppers = []
var vrchatDiscord; fs.readFile('datasets/vrc-X-dis.json', 'utf8', (err, data) => { vrchatDiscord = JSON.parse(data) })
var worstAvatarStats; fs.readFile('datasets/worstAvatarStats.json', 'utf8', (err, data) => { worstAvatarStats = JSON.parse(data) })
var lastFetchGroupLogs;
var currentUser;
var statWarnings = false
var userAutoAcceptWhiteList = []
var worldQueueTxt = './datasets/worldQueue.txt'
var explorePrivacyLevel = 0
var authToken = null
var isApiErrorSkip = false
var socket_VRC_API
var cacheWS = {}
var lastVideoURL = ``
var seenVideoURLs = [] // For current instance only
var worldHopTimeout;
var worldHopTimeoutHour;
var tonRoundType = ''
var tonAvgStartWait = []
var tonRoundReadyTime = 0
var InstanceHistory = [
	{
		'location': 'offline',
		'join_timestamp': 0,
		"leave_timestamp": 0,
		'timeSpent': 0,
		'worldID': '',
		'groupID': '',
		'instanceType': '',
		'current': false
	},
	{
		'location': 'offline',
		'join_timestamp': 0,
		"leave_timestamp": 0,
		'timeSpent': 0,
		'worldID': '',
		'groupID': '',
		'instanceType': '',
		'current': false
	}
]
var G_InstanceClosed = false
var G_groupMembersVisible = false
var G_instanceJoinQueue = []
var lastSetUserStatus = ''
var cooldownPortalVanish = false
var vrchatRunning = false
var loadingAvatarTimer;
var worstAvatarStatsSaveTimer;
var worstAvatarStatSaveTrigger = false
var watcher;
var lastChecked = 0
var previousLength = 0
var currentLength = 0
var cooldownLogRead = false
var urlType = 'none'
var logCooldown = 0.001 // secs

// Restore saved into Scope
fs.readFile('./lastFetchGroupLogs.txt', 'utf8', (err, data) => {
	if (err) { console.log(err); return }
	console.log(`${loglv.debug}${selflogA} set last log fetch to ${data}`)
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

//	--	On Load	--
console.log(`${loglv.info}${selflogL} Loaded -> ${loglv.bool(printAllLogs)}printAllLogs${loglv.reset} , ${loglv.bool(ChatVideoURL)}ChatVideoURL${loglv.reset} , ${loglv.bool(ChatVideoTitle)}ChatVideoTitle${loglv.reset}`)

var vrchat = new VRChat({
	// baseUrl: "https://api.vrchat.cloud/api/1",
	// meta: {},
	application: {
		name: "OSC_Multi-Interface",
		version: "2.5",
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

const { ratelimitHandler } = require("./ratelimitHandler.cjs");
const limiter = new ratelimitHandler();

cmdEmitter.on('cmd', (cmd, args, raw) => {
	if (cmd == 'help') {
		console.log(`
-   api requestall
-   years [open/close]
-   forceaudit
-   avatars
-   collectavatars
-   collectavatars2
-   allavatars
-   listavatars [file_UUID...]
-   wearers
-   statwarn [True/False]
-   preload [wrld_UUID...]
-   addworlds [<string>]
-   explore
        > prefill
        > autonext [True/False]
-   hoppers
-   log
        > vidurl [True/False]
        > vidtitle [True/False]
        > printall [True/False]
        > queue [True/False]
        > speed [True/False]
-   twitch
        > alwaysrun [True/False]
        > join [channel:<string>]
        > leave [channel:<string>]
        > switch [channel:<string>]
        > from [0-3]`)
	}
	if (cmd == 'api' && args[0] == 'requestall') { requestAllOnlineFriends(currentUser) }
	if (cmd == 'years' && args[0] == 'close') { switchYearGroupsClosed() }
	if (cmd == 'years' && args[0] == 'open') { switchYearGroupsReOpen() }
	if (cmd == 'forceaudit') { scanGroupAuditLogs() }
	if (cmd == 'findjoinable') {
		findJoinableInstances().then(d => { G_instanceJoinQueue = d })
	}

	if (cmd == 'avatars') { requestAvatarStatTable(false, 0.05, false) }
	if (cmd == 'worstavatars') { requestWorstStatTable() }
	if (cmd == 'collectavatars') { collectActiveInstanceStats() }
	if (cmd == 'collectavatars2') { collectActiveInstanceStats(true) }
	if (cmd == 'allavatars') { scanAllAvatarStats() }
	if (cmd == 'listavatars') { scanListAvatarStats(raw.slice(12).split(',')) }
	if (cmd == 'wearers') { console.log(avatarStatSummary.seenAvatars) }
	if (cmd == 'statwarn') { statWarnings = JSON.parse(args[0]) }

	if (cmd == 'preload') { worldAutoPreloadQueue(args[0].split(',')) }
	if (cmd == 'addworlds') { addSearchToLocalQueue(raw.slice(10)) }
	if (cmd == 'explore' && args[0] == 'prefill') { addLabWorldsToLocalQueue() }
	if (cmd == 'explore' && args[0] == 'autonext') { G_autoNextWorldHop = JSON.parse(args[1]) }

	if (cmd == 'log' && args[0] == 'vidurl') { ChatVideoURL = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'vidtitle') { ChatVideoTitle = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'printall') { printAllLogs = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'queue') { ChatAvyQueue = JSON.parse(args[1]) }
	if (cmd == 'log' && args[0] == 'speed') { ChatDownSpeed = JSON.parse(args[1]) }

	if (cmd == 'twitch' && args[0] == 'alwaysrun') { ttvAlwaysRun = args[1] }
	if (cmd == 'twitch' && args[0] == 'join') { ttvFetchFrom = 2; setTimeout(() => { joinChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'leave') { ttvFetchFrom = 2; setTimeout(() => { leaveChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'switch') { ttvFetchFrom = 1; setTimeout(() => { switchChannel(args[1].toString()) }, 100) }
	if (cmd == 'twitch' && args[0] == 'from') { ttvFetchFrom = args[1] }

	if (cmd == 'hoppers') {
		var string = ''
		worldHoppers.sort((a, b) => { return b.playtime - a.playtime }).forEach((a) => {
			var discordInfo = vrchatDiscord.filter(e => e.vrcUUID == a.id)
			if (discordInfo.length != 0) {
				string += `${string.length == 0 ? '' : '\n'}\`${new Date(a.playtime).toISOString().substring(11, 19)}\` ${a.groupMember == true ? `💜` : `👻`} ${a.name} <@${discordInfo[0].discordid}> - [${discordInfo[0].discordid}]`
			} else {
				string += `${string.length == 0 ? '' : '\n'}\`${new Date(a.playtime).toISOString().substring(11, 19)}\` ${a.groupMember == true ? `💜` : `👻`} ${a.name} [profile](<https://vrchat.com/home/user/${a.id}>)`
			}
		})
		console.log(string)
	}
	if (cmd == 'clearhoppers') {
		worldHoppers = []
	}
})

async function main() {
	console.log(`${loglv.debug}${selflogA} Started main function`)
	try {
		const currentUser = await limiter.req(vrchat.getCurrentUser({ throwOnError: true }))
		console.log(`${loglv.info}${selflogA} Logged in as: ${currentUser.data.displayName}`);
		const { data: auth } = await limiter.req(vrchat.verifyAuthToken())
		if (auth.ok == true) {
			authToken = auth.token
			socket_VRC_API_Connect()
		}

		lastSetUserStatus = currentUser.data.statusDescription

		if (currentUser.data.presence.world != 'offline') {
			var instanceType = 'public'
			var groupID = ''

			if (currentUser.data.presence.instance.includes(`~group(grp_`)) {
				groupID = /grp_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(currentUser.data.presence.instance)[0]
				console.log(`${loglv.info}${selflogL} Group ID ${groupID}`)
			}
			if (currentUser.data.presence.instance.includes(`~groupAccessType(plus)`)) {
				instanceType = `groupPlus`
			} else if (currentUser.data.presence.instance.includes(`~groupAccessType(public)`)) {
				instanceType = `groupPublic`
			} else if (currentUser.data.presence.instance.includes(`~groupAccessType(members)`)) {
				instanceType = `group`
			} else if (currentUser.data.presence.instance.includes(`~private(`)) {
				instanceType = `invite`
			} else if (currentUser.data.presence.instance.includes(`~canRequestInvite`)) {
				instanceType = `invitePlus`
			} else if (currentUser.data.presence.instance.includes(`~friends(`)) {
				instanceType = `friends`
			} else if (currentUser.data.presence.instance.includes(`~hidden(`)) {
				instanceType = `friendsPlus`
			}
			InstanceHistory[0] = {
				'current': true,
				'groupID': groupID,
				'instanceType': instanceType,
				'join_timestamp': Date.now(),
				'leave_timestamp': 0,
				'location': currentUser.data.presence.world + ':' + currentUser.data.presence.instance,
				'worldID': currentUser.data.presence.world,
				'timeSpent': 0
			}
		}

	} catch (error) {
		console.log(`${loglv.warn}${selflogA} API is down.. Cry`)
		isApiErrorSkip = true
	}
}

async function manualCall(vrcapiEndpoint, methodType = 'GET', bodyJson) {
	return new Promise(async (resolve, reject) => {
		const vrcapihttp = `https://api.vrchat.cloud/api/1/`

		var apiRequest = {
			method: methodType,
			headers: { 'User-Agent': `${process.env['VRC_USER_AGENT']} (${process.env['CONTACT_EMAIL']})`, 'Cookie': 'auth=' + authToken },
		}
		if (bodyJson != undefined) {
			apiRequest['body'] = JSON.stringify(bodyJson)
			apiRequest['headers']['Content-Type'] = 'application/json'
		}

		var request = await fetch(vrcapihttp + '' + vrcapiEndpoint, apiRequest)
		// console.log(request)
		var jsonResponse = await request.json()
		if (jsonResponse.error) {
			reject(jsonResponse.error)
		} else {
			resolve(jsonResponse)
		}
	})
}


function socket_VRC_API_Connect() {
	if (authToken == null) { console.log('No AuthToken stored'); return }
	socket_VRC_API = new WebSocket(`wss://pipeline.vrchat.cloud/?authToken=` + authToken, { headers: { "cookie": `auth=${authToken}`, "user-agent": `${process.env['VRC_USER_AGENT']} (${process.env['CONTACT_EMAIL']})` } })
	socket_VRC_API.on('error', (data) => {
		console.log(`${loglv.warn}${selflogWS}`)
		console.log(data)
	})
	socket_VRC_API.on('close', (code, reason) => {
		console.log(`${loglv.warn}${selflogWS} ${code} ${Buffer.from(reason, 'utf8')}`)
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
					console.log(`${loglv.info}${selflogWS} [InviteRequest] ${wsContent.senderUsername} has Requested an Invite.${userAutoAcceptWhiteList.includes(wsContent.senderUsername) == true ? ' (✅ Whitelisted )' : ''}`);

					if (userAutoAcceptWhiteList.includes(wsContent.senderUsername)) {
						// Requester is Whitelisted
						if (InstanceHistory[0].location == 'offline' && InstanceHistory[1].location == 'offline') {
							let res = await limiter.req(vrchat.getCurrentUser())
							if (res.data.presence.world != 'offline') {
								let resIU = await limiter.req(vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': res.data.presence.world + ":" + res.data.presence.instance, 'messageSlot': 0 } }))
								resIU.data == undefined ? console.log(resIU.error) : console.log(resIU.data)
							} else {
								await limiter.req(vrchat.respondInvite({ 'body': { 'responseSlot': 0 }, 'path': { 'notificationId': wsContent.id } }))
							}
						} else {
							let resIU = await limiter.req(vrchat.inviteUser({ 'path': { 'userId': wsContent.senderUserId }, 'body': { 'instanceId': InstanceHistory[0].location, 'messageSlot': 0 } }))
							resIU.data == undefined ? console.log(resIU.error) : console.log(resIU.data)
						}
					}
				} else {
					console.log(`${loglv.info}${selflogWS} [InviteRequest]`);
					console.log(wsContent);

					console.log(`${loglv.debug}${selflogA} Checking if Invite location is an Unlisted world.`)
					isWorldUnlisted(wsContent.details.worldId,'Invited')

				}
				break;

			// case 'response-notification': break;
			// case 'see-notification': break;
			// case 'hide-notification': break;
			// case 'clear-notification': break;
			case 'notification-v2':
				if (wsContent.type == 'group.invite') {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.message} - ${wsContent.link.slice(6)}`)

					// Auto Block if not long enough
					if (wsContent.link.slice(6) == InstanceHistory[0].groupID && Date.now() < (InstanceHistory[0].join_timestamp + 120_000)) {

						if (currentAccountInUse['Agroup'] == true) {
							oscChatBoxV2(`Group performed an undesirable action.\vTaking countermeasures`, 10_000, true, true, false, false)
						}

						// Block Group Owner
						var resG = await limiter.reqCached('group', wsContent.link.slice(6)).catch(async () => {
							return await limiter.req(vrchat.getGroup({ 'path': { 'groupId': wsContent.link.slice(6) } }), 'group')
						})
						if (resG.data != undefined) {
							var resMu1 = await limiter.req(vrchat.moderateUser({ 'body': { 'type': 'block', 'moderated': resG.data.ownerId } }))
							console.log(`You've blocked Group Owner: ${resMu1.data.targetDisplayName}`)
						} else { console.log(resG) }

						// Block Inviter
						var resS = await limiter.req(vrchat.searchUsers({ 'query': { 'search': wsContent.data.managerUserDisplayName } }))
						if (resS.data != undefined && resS.data.length >= 1) {
							// var resMu2 = await limiter.req(vrchat.moderateUser({'body':{'type':'block','moderated':resS.data[0].id}}))

							// Skip auto-block incase search miss-lands
							console.log(`User that invited you`, resS.data[0].displayName, resS.data[0].id)
							open(`vrcx://user/${resS.data[0].id}`)
						}

						// Block Group
						var resBG = await limiter.req(vrchat.blockGroup({ 'path': { 'groupId': wsContent.link.slice(6) } }))
						if (resBG.data != undefined) {
							console.log(resBG.data.success.message)
						} else {
							console.log(resBG)
						}
					}

				} else if (wsContent.type == 'boop') {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.message} ${JSON.stringify(wsContent.details)}`)

				} else {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}]`); console.log(wsContent);
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
				console.log(`${loglv.info}${selflogWS} [GPS] ${wsContent.user.displayName} - Now Online`);
				// console.log(wsContent)

				if (wsContent.location != 'private' || wsContent.travelingToLocation != 'private' || wsContent.travelingToLocation != 'private') {
					var notif_user_location = wsContent.location.includes('wrld_') ? wsContent.location.split(':')[0] : wsContent.travelingToLocation.includes('wrld_') ? wsContent.travelingToLocation.split(':')[0] : wsContent.worldId.includes('wrld_') ? wsContent.worldId : 'private'
					if (notif_user_location != 'private') {
						console.log(`${loglv.debug}${selflogA} Checking if Friend location is an Unlisted world.`)
						isWorldUnlisted(notif_user_location,wsContent.user.displayName)		
					}
				}

				break;

			case 'friend-offline':
				let notif_user_displayName = 'unknown'
				if ((cacheWS[wsContent.userId] || "").displayName) {
					notif_user_displayName = cacheWS[wsContent.userId].displayName
					console.log(`${loglv.info}${selflogWS} [GPS] ${notif_user_displayName} - Offline`);
				} else {
					notif_user_displayName = await limiter.reqCached('user', wsContent.userId).catch(async () => {
						return await limiter.req(vrchat.getUser({ 'path': { 'userId': wsContent.userId } }), 'user')
					})
					console.log(`${loglv.info}${selflogWS} [GPS] ${(notif_user_displayName.data || "").displayName} - Offline`);
				}
				break;

			case 'friend-active':
				console.log(`${loglv.info}${selflogWS} [GPS] ${wsContent.user.displayName} - Active on Web`);
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

								notif_user_changes += `\n${loglv.info}    ${key}: ${notif_user_status_old} -> ${notif_user_status}`
							} else {
								let notif_user_status_old = ''
								if (cacheWS[wsContent.userId].status == 'join me') { notif_user_status_old = '🔵' }
								if (cacheWS[wsContent.userId].status == 'active') { notif_user_status_old = '🟢' }
								if (cacheWS[wsContent.userId].status == 'ask me') { notif_user_status_old = '🟠' }
								if (cacheWS[wsContent.userId].status == 'busy') { notif_user_status_old = '🔴' }

								notif_user_changes += `\n${loglv.info}    ${key}: "${cacheWS[wsContent.userId][key]}" -> "${wsContent.user[key]}"`
							}
						}
					})
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.user.displayName} ${notif_user_status} ${notif_user_changes != '' ? notif_user_changes : ''}`);
				} else {
					console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.user.displayName} ${notif_user_status} ${wsContent.user.statusDescription}`);
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
				// break;
				var notif_user_location = wsContent.location != '' ? wsContent.location : wsContent.travelingTolocation != '' ? wsContent.travelingTolocation : 'private'
				if (notif_user_location != 'private' && notif_user_location != 'traveling') {
					isWorldUnlisted(notif_user_location.split(':')[0],wsContent.user.displayName)					
				}
				// console.log(`${loglv.info}${selflogWS} [GPS] ${wsContent.user.displayName} - ${notif_user_location}`);
				break;

			case 'user-update': break;
			case 'user-location': break;
			case 'user-badge-assigned':
				console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${wsContent.badge.badgeName}`);
				break;
			case 'user-badge-unassigned':
				console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}] ${JSON.stringify(wsContent)}`);
				break;

			default:
				console.log(`${loglv.info}${selflogWS} [${JSON.parse(line).type}]`);
				console.log(wsContent);
				break;
		}
	});
}


async function isWorldUnlisted(I_worldID = '', I_userDisplayName = '') {
	var gotWorld = await limiter.req(vrchat.getWorld({ 'path': { 'worldId': I_worldID } }), 'world', I_worldID)
	if (gotWorld.data != undefined && gotWorld.data?.releaseStatus == 'private') {
		var fileHandler;
		try {
			fileHandler = await fsp.open('./datasets/private-worlds.txt')
			var fileRead = await fileHandler.readFile('utf8')
			if (!fileRead.includes(gotWorld.data.id)) {
				console.log(`${loglv.hey}${selflogA} Saving Unlisted world.\nSource: ${I_userDisplayName}\n${gotWorld.data.id} ${gotWorld.data.name} by ${gotWorld.data.authorName}`)
				// console.log(`${loglv.debug}${selflogA} World not saved, Saving..`)
				var appendText = `\r\n${gotWorld.data.id}|${gotWorld.data.name}|${gotWorld.data.authorName}|${gotWorld.data.authorId}`
				fs.appendFile('./datasets/private-worlds.txt', appendText, (err) => { if (err) { console.error(err) } })
				// open(`vrcx://world/${gotWorld.data.id}`)
			} else {
				// console.log(`${loglv.debug}${selflogA} World already saved.`)
			}
		} catch (error) {
			console.log(`${loglv.warn}${selflogL}`, error)
		} finally { if (fileHandler) { await fileHandler.close() } }
	}
}

function sleep(time) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve(true)
		}, time)
	})
}
function formatBytes(bytes, decimals = 1) {
	return new Promise((resolve, reject) => {
		if (bytes === 0) { resolve('0 Bytes') };
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

function fetchLogFile() {
	console.log(`${loglv.info}${selflogL} Finding latest log file`)
	fs.readdir(path, function (err, files) {
		files = files.map(function (fileName) {
			return {
				name: fileName,
				time: fs.statSync(path + '/' + fileName).mtime.getTime()
			}
		})
			.sort(function (a, b) {
				return a.time - b.time
			})
			.map(function (v) {
				return v.name
			})
			.filter(function (a) {
				return a.includes('output_log_')
			})
		tarFile = files[files.length - 1]
		tarFilePath = path + '' + files[files.length - 1]
		try {
			tarFileSize = fs.statSync(tarFilePath).size || 0
			console.log(`${loglv.info}${selflogL} Found newest log file: ${files[files.length - 1]}`)
		} catch (err) {
			console.log(`${loglv.error}${selflogL} tarFileSize Failed: ${err}`)
		} finally {
			startWatching()
		}
	})
}
exports.fetchLogFile = fetchLogFile;
fetchLogFile()



const readline = require('readline')
function startWatching() {
	console.log(`${loglv.info}${selflogL} Started Watcher`)
	if (tarFilePath.includes('undefined')) {
		setTimeout(() => { updateWatcher() }, 5000)
		return
	} else {
		watcher = fs.watch(tarFilePath, 'utf8', (eventType, filename) => {
			//console.log( `${loglv.debug}${selflog}`, eventType, filename)
			if (eventType == 'change' && filename == tarFile) {
				// readLogFile()

				const newSize = fs.statSync(tarFilePath).size
				if (newSize > tarFileSize) {
					const stream = fs.createReadStream(tarFilePath, { 'start': tarFileSize, 'end': newSize })
					const rl = readline.createInterface({ 'input': stream })
					rl.on('line', (line) => { processLogLine(line) })
					tarFileSize = newSize
				}

			}
			if (eventType == 'rename' && filename.includes('output_log_')) {
				console.log(`${loglv.hey}${selflogL} A newer log file might of just been created`)
				updateWatcher()
			}
		})
	}
}
function updateWatcher() {
	console.log(`${loglv.info}${selflogL} Updating Watcher`)
	watcher?.close()
	fetchLogFile()
}


oscSend('/avatar/parameters/log/instance_closed', false)

function getVrchatRunning() { return vrchatRunning }
exports.getVrchatRunning = getVrchatRunning;

function average(array) {
	if (array.length == 0) { return 0 }
	return Math.floor(array.reduce((a, b) => a + b) / array.length)
}


function processLogLine(line) {

	if (vrchatRunning == false) { vrchatRunning = true }

	logEmitter.emit('log', line)

	if (line.includes('[Behaviour] Destination set: wrld_')) { eventHeadingToWorld(line) }
	if (line.includes('[Behaviour] Joining wrld_')) { eventJoinWorld() }
	if (line.includes('Instance closed: ')) { eventInstanceClosed() }
	if (line.includes(`Shocked: `) && line.includes(process.env["VRC_ACC_NAME_1"])) { PiShockAll(30, 1) }
	if (line.includes('[Behaviour] Hard max is ')) {
		playerHardLimit = parseInt(line.split('[Behaviour] Hard max is ')[1])
		oscSend('/avatar/parameters/log/player_max', playerHardLimit > 80 ? 80 : playerHardLimit)
	}
	if (line.includes('[Behaviour] Initialized player')) { eventPlayerInitialized(line) }
	if (line.includes('[Behaviour] OnPlayerJoined')) { eventPlayerJoin(line) }
	if (line.includes('[Behaviour] OnPlayerLeft')) { eventPlayerLeft(line) }

	if (line.includes('[Behaviour] Switching ') && line.includes(' to avatar ')) { eventPlayerAvatarSwitch(line) }

	if (line.includes(`Received Notification: <`)) { eventReceivedNotification(line) }

	if (line.includes(`VRCApplication: HandleApplicationQuit`)) { eventGameClose() }

	if (line.includes(`[VRCItems] Item prop_`)) { eventPropSpawned(line.split('prop_')[1].split(' ')[0]) }

	if (line.includes(`[VRCX] VideoPlay(PopcornPalace) `)) { eventPopcornPalace(line.split('[VRCX] VideoPlay(PopcornPalace) ')[1]) }

	// [Behaviour] Could not enter room because: If the instance exists‚ you're not allowed to access it․ (You are not allowed to travel to that location. If the instance exists‚ you're not allowed to access it․ (Code: 403))
	if (line.includes(`[Behaviour] Could not enter room because: ` && line.includes('You are not allowed to travel to that location'))) {
		logEmitter.emit('notAllowedToTravel')
	}

	if (line.includes(`[API] Requesting Get analysis/`)) {
		const fileAPIreq = line.split(`[API] Requesting Get analysis/`)[1].split('/')
		avatarFileAnalysis(fileAPIreq[0], parseInt(fileAPIreq[1]))
		clearTimeout(loadingAvatarTimer)
		loadingAvatarTimer = setTimeout(() => {
			logEmitter.emit('avatarQueueFinish', true)
		}, 10000);
	}

	// Terrors of Nowhere
	if (InstanceHistory[0].worldID == 'wrld_a61cdabe-1218-4287-9ffc-2a4d1414e5bd') {
		// if (line.includes(`[DEATH][14anthony7095]`)) { PiShockAll(30, 1) }
		if (line.includes(`Round type is`)) {
			tonRoundType = line.split('Round type is ')[1]
			console.log(`${loglv.info}${selflogL} [TON] Round type is ${tonRoundType}`)
		}
		if (line.includes(`Sus player =`)) {
			tonSusPlayer = line.split('Sus player = ')[1]
			say.speak('Impostor is ' + tonSusPlayer, 'Microsoft Zira Desktop', 1.0)
			console.log(`${loglv.info}${selflogL} [TON] Impostor is ${tonSusPlayer}`)
		}
		if (line.includes(`Verified Round End`)) {
			tonRoundReadyTime = Date.now()
			let avgStartDisplay = new Date(average(tonAvgStartWait)).toISOString()
			console.log(`${loglv.info}${selflogL} [TON] Intermission.. Ready to start next round. ${tonAvgStartWait.length > 1 ? 'Avg. wait time: ' + avgStartDisplay.substring(11, 19) : ''}`)

			if (currentAccountInUse['Agroup'] == true) {
				tonAvgStartWait.length > 1 ? oscChatBoxV2(`~Round ready to start\vAvg. wait time: ${avgStartDisplay.substring(11, 19)}`, 5000, false, true) : oscChatBoxV2(`~Round ready to start`, 5000, false, true)
			}
		}
		if (line.includes(`Everything recieved, looks good`)) {
			console.log(`${loglv.info}${selflogL} [TON] Round Starting.`)
			if (tonRoundReadyTime != 0) {
				tonAvgStartWait.push(Date.now() - (tonRoundReadyTime + 12000))
			}
		}
	}

	// Fish! [RELEASE]
	if (InstanceHistory[0].worldID == 'wrld_ae001ea3-ed05-42f0-adf2-3d47efd10a77') {
		if (line.includes(`[PlayerStats] `)) {
			var plystats = line.split(`[PlayerStats] `)[1].split(' ')
			console.log(`${loglv.info}${selflogL} [FISH] You're Level ${plystats[2].slice(2)} with ${plystats[3].slice(3)} XP and ${plystats[4].slice(6)} Gold.`)
			console.log(`${loglv.info}${selflogL} [FISH] You've caught ${plystats[5].slice(5)} fish (${plystats[6].slice(5)} rare). Sold ${plystats[7].slice(5)}. Turned in ${plystats[8].slice(9)} Bounties`)
			console.log(`${loglv.info}${selflogL} [FISH] With a Playtime of ${plystats[9].slice(11, -1) >= 86400 ? "" + Math.floor(plystats[9].slice(11, -1) / 86400) + ":" : ""}${new Date(plystats[9].slice(11, -1) * 1000).toISOString().substring(11, 19)}`)
		}

		if (line.includes(`[VersionChecker] Lobby version stamped: `)) {
			var lobbyver = line.split('[VersionChecker] Lobby version stamped: ')[1]
			console.log(`${loglv.info}${selflogL} [FISH] Lobby Version ${lobbyver}.`)
		}

	}


	// Portal Manager
	if (line.includes(`[PortalManager]`)) {
		var PortalLog = line.split(`[PortalManager] `)[1]
		if (PortalLog == 'Received portal destroy event.') {
			if (cooldownPortalVanish == false && currentAccountInUse['Agroup'] == true) {
				// oscChatBoxV2('~Portal has vanished', 5000, true, true, false, false, false)
				setTimeout(() => { cooldownPortalVanish = true }, 120_000)
			}
		}
		console.log(`${loglv.info}${selflogL} [PortalManager]: ${PortalLog}`)
	}

	// Local Moderation Manager
	if (line.includes(`[ModerationManager]`)) {
		var moderationlog = line.split(`[ModerationManager] `)[1]
		console.log(`${loglv.info}${selflogL} [ModerationManager]: ${moderationlog}`)
	}

	// Asset Bundle Download Manager
	if (line.includes(`[AssetBundleDownloadManager]`)) { eventAssetDownload(line) }

	// Image Downloading
	if (line.includes('[Image Download] Attempting to load image from URL')) {
		var imageurl = line.split('[Image Download] Attempting to load image from URL ')[1].trim()
		// console.log(`${loglv.info}${selflog} Downloading Image from ${imageurl}`)
		if (ChatImageStringURL == true && currentAccountInUse['Agroup'] == true) {
			oscChatBoxV2(`~ImageURL: ${imageurl}`, 5000, true, true, false, false, false)
		}
	}

	// String Downloading
	// I assume this is the same as Image downloading.. may need to change later
	if (line.includes('[String Download] Attempting to load String from URL')) {
		var stringurl = line.split('[String Download] Attempting to load String from URL ')[1].trim()
		if (/https?\:\/\/vr-m\.net\/[0-9]\/keepalive/.test(stringurl)) { return } // Surpress Moves&Chill heartbeat
		// if( stringurl == `'https://vr-m.net/1/keepalive'` ){ return	} // Surpress Moves&Chill heartbeat
		// console.log(`${loglv.info}${selflog} Downloading String from ${stringurl}`)
		if (ChatImageStringURL == true && currentAccountInUse['Agroup'] == true) {
			oscChatBoxV2(`~StringURL: ${stringurl}`, 5000, true, true, false, false, false)
		}
	}

	// World download progress ETA
	if (line.includes('[Behaviour] Preparation has taken')) {
		// Seconds download has been running (in Sec) , Current download percent
		var timeSecs = parseInt(line.split('[Behaviour] Preparation has taken ')[1].split(' ')[0].trim())
		var progressPercent = parseFloat(line.split('progress is ')[1].split('%,')[0].trim()) * 100
		worldDownloadProgress(timeSecs, progressPercent)
	}

	// StickerManager
	if (line.includes(`[StickersManager]`) && logStickers == true) {
		var stickerlog = line.split(`[StickersManager] `)[1]
		var stickerOwner = stickerlog.split('(')[1].split(')')[0]
		var stickerFile = stickerlog.split('spawned sticker ')[1]
		console.log(`${loglv.info}${selflogL} [StickersManager]: ${stickerOwner} placed ${stickerFile}`)
	}

	// Fetch Video Player URL
	if (line.includes('[Video Playback] Attempting to resolve URL ')) {
		videourl = line.split('URL \'')[1].split('\'')[0]
		videoUrlResolver(videourl)
	} else if (line.includes('[USharpVideo] Started video load for URL: ')) {
		videourl = line.split('[USharpVideo] Started video load for URL: ')[1].split(', requested by')[0]
		videoUrlResolver(videourl)
	} else if (line.includes('[USharpVideo] Started video: ')) {
		videourl = line.split('[USharpVideo] Started video: ')[1]
		videoUrlResolver(videourl)
	} else if (line.includes('[AVProHQ] loading URL: ')) {
		videourl = line.split('[AVProHQ] loading URL: ')[1]
		videoUrlResolver(videourl)
	} else if (line.includes('User ') && line.includes('added URL ')) {
		videourl = line.split('added URL ')[1]
		videoUrlResolver(videourl)
	}
}

// - Avatar Perf Allowance -
//  Stat / Value >= Threshold
const avatarStatWeights = {
	"lowerLimitWeight": 1,             // Display Evaluation Value
	"higherLimitWeight": 1,            // Warn Icon + True Stat
	"boundsLongest": 6,               //🔒locked in - from suggestion list
	"constraintCount": 350,           //🔒locked in - from suggestion list
	"constraintDepth": 100,            //🔒locked in - from suggestion list
	"totalTextureUsage": 157286400,       //🔒locked in - from suggestion list
	"totalPolygons": 70000,              //🔒locked in - from suggestion list
	"skinnedMeshCount": 16,            //🔒locked in - from suggestion list
	"meshCount": 24,                   //🔒locked in - from suggestion list
	"physBoneCollisionCheckCount": 512,  //🔒locked in - from suggestion list
	"physBoneColliderCount": 32,       //🔒locked in - from suggestion list
	"physBoneComponentCount": 32,      //🔒locked in - from suggestion list
	"physBoneTransformCount": 256,       //🔒locked in - from suggestion list
	"contactCount": 32,               //🔒locked in - from suggestion list
	"animatorCount": 32,
	"audioSourceCount": 8,
	"boneCount": 400,
	"cameraCount": 12,
	"clothCount": 4,
	"lineRendererCount": 8,
	"materialCount": 99999,
	"meshParticleMaxPolygons": 5000,
	"particleSystemCount": 16,
	"physicsColliders": 8,
	"physicsRigidbodies": 8,
	"totalClothVertices": 200,
	"totalMaxParticles": 2500,
	"trailRendererCount": 8,
	"materialSlotsUsed": 32,
	"raycastCount": 15,
	"lightCount": 1,
	"blendShapeCount": 99999
}

var avatarStatSummary = {
	"totalAvatars": 0,
	"checkedFileIDs": [],
	"seenAuthors": [{
		"id": "", "displayName": ""
	}],
	"seenAvatars": [{
		"name": "", "author": null, "wearers": [], "lastAccessed": 0
	}],
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
		"raycastCount": { "label": "Raycasts", "values": [] },
		"blendShapeCount": { "label": "BlendShapes", "values": [] },
		"cameraCount": { "label": "Cameras", "values": [] },
		"totalTextureUsage": { "label": "Texture Memory (VRAM)", "values": [] },
		"fileSize": { "label": "Download Size", "values": [] },
		"uncompressedSize": { "label": "Uncompressed Size (RAM)", "values": [] }
	}
}

function fitChars(I_line = '', lineCount = 1) {
	I_line = I_line || ''
	const charWidth = {
		" ": 0.018181, "a": 0.037037, "A": 0.041666, "b": 0.04, "B": 0.043478, "c": 0.03125, "C": 0.041666,
		"d": 0.04, "D": 0.047619, "e": 0.037037, "<": 0.037037, "g": 0.04, "G": 0.047619, "0": 0.037037, "1": 0.037037,
		"2": 0.037037, "3": 0.037037, "4": 0.037037, "5": 0.037037, "6": 0.037037, "7": 0.037037, "8": 0.037037, "9": 0.037037,
		"h": 0.04, "H": 0.05, ">": 0.037037, "K": 0.04, "?": 0.028571, "E": 0.037037, "M": 0.058823, "n": 0.04,
		"N": 0.05, "o": 0.04, "!": 0.017543, "@": 0.058823, "p": 0.04, "u": 0.04, "q": 0.04, "r": 0.026315,
		"s": 0.03125, "f": 0.022222, "F": 0.034482, "i": 0.016666, "I": 0.022222, "j": 0.016666, "J": 0.017857, "k": 0.034482,
		"l": 0.016666, "L": 0.034482, "m": 0.0625, "t": 0.023255, "v": 0.033333, "w": 0.052631, "x": 0.034482, "y": 0.033333,
		"z": 0.030303, "O": 0.052631, "P": 0.04, "Q": 0.052631, "R": 0.04, "S": 0.035714, "T": 0.037037, "U": 0.047619,
		"V": 0.04, "W": 0.0625, "X": 0.038461, "Y": 0.037037, "Z": 0.037037, "#": 0.041666, "$": 0.037037, "%": 0.055555,
		"^": 0.037037, "&": 0.047619, "*": 0.035714, "（": 0.066666, "）": 0.066666, "(": 0.019607, ")": 0.019607, "_": 0.028571,
		"-": 0.020833, "+": 0.037037, "=": 0.037037, "`": 0.018181, "~": 0.037037, "[": 0.021276, "]": 0.021276, "{": 0.025,
		"}": 0.025, "|": 0.035714, ";": 0.017241, "'": 0.014492, ":": 0.017241, "\"": 0.026315, ",": 0.017241, ".": 0.017241,
		"/": 0.024390
	}
	var trackingWidth = 0
	var limitLength = 0
	for (const item in I_line) {
		trackingWidth += charWidth[I_line[item]] != undefined ? charWidth[I_line[item]] : 0.0625
		if (trackingWidth >= lineCount) { limitLength = item; break; }
	}
	return I_line.slice(0, limitLength != 0 ? limitLength : I_line.length)
}

async function avatarFileAnalysis(fileid, fileversion) {
	// Has avatar already been seen while in this instance? - Escape
	if (avatarStatSummary.checkedFileIDs.includes(fileid + "-" + fileversion)) {
		// console.log(`${loglv.info}${selflogA} [AvatarAnalysis] Skipping: ${fileid} - ver ${fileversion}`)
		return
	}

	// Has avatar already been scanned before? - Check Cache folder
	var res = {}
	try {
		var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', 'utf8')
		// console.log(`${loglv.info}${selflogA} [AvatarAnalysis] Cached: ${fileid} - ver ${fileversion}`)
		res.data = JSON.parse(fsrdfile)
		if (avatarStatSummary.seenAuthors.filter(s => s.id == res.data.ownerId).length == 0) {
			avatarStatSummary.seenAuthors.push({ "id": res.data.ownerId, "displayName": res.data.displayName })
		}
		if (res.data.ownerDisplayName == null) {
			let getName = await limiter.req(vrchat.getFile({ 'path': { 'fileId': fileid } }))
			res.data["name"] = getName.data.name.slice(9).split(' - Asset bundle - ')[0]

			// Check Author
			res.data["ownerId"] = getName.data.ownerId
			try {
				res.data["ownerDisplayName"] = avatarStatSummary.seenAuthors.filter(s => s.id == getName.data.ownerId)[0].displayName
				if (res.data["ownerDisplayName"] == undefined) { throw new Error('no displayname') }
				// console.log(`${loglv.info}${selflogA} [AvatarAuthor] Cached: ${getName.data.ownerId} - ${res.data["ownerDisplayName"]}`)
			} catch (err) {
				// console.log(`${loglv.info}${selflogA} [AvatarAuthor] Fetching: ${getName.data.ownerId}`)

				let getOwner = await limiter.reqCached('user', getName.data.ownerId).catch(() => {
					return limiter.req(vrchat.getUser({ 'path': { 'userId': getName.data.ownerId } }), 'user')
				})
				res.data["ownerDisplayName"] = getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : getOwner.data.displayName
				if (avatarStatSummary.seenAuthors.filter(s => s.id == res.data.ownerId).length == 0) {
					avatarStatSummary.seenAuthors.push({ "id": getName.data.ownerId, "displayName": getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : getOwner.data.displayName })
				}
				if (avatarStatSummary.seenAuthors[0].id == "") { avatarStatSummary.seenAuthors.shift() }
			}

			if (JSON.stringify(res.data) != '') {
				fs.writeFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', JSON.stringify(res.data), 'utf8', (err) => { if (err) { console.log(err) } })
			}
		}
	} catch (error) {
		// console.log(`${loglv.info}${selflogA} [AvatarAnalysis] Fetching: ${fileid} - ver ${fileversion}`)
		res = await limiter.req(vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } }))

		if (res.data == undefined) {
			console.log(`${loglv.warn}${selflogA} [AvatarAnalysis] ErrorFile: ${fileid} - ver ${fileversion}`)
			setTimeout(async () => {
				res = await limiter.req(vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } }))
				console.log(res.data)
			}, 10_000);
			return
		} else if (res.data.avatarStats && res.data.performanceRating) {
			let getName = await limiter.req(vrchat.getFile({ 'path': { 'fileId': fileid } }))
			res.data["name"] = getName.data.name.slice(9).split(' - Asset bundle - ')[0]

			// Check Author
			res.data["ownerId"] = getName.data.ownerId
			try {
				res.data["ownerDisplayName"] = avatarStatSummary.seenAuthors.filter(s => s.id == getName.data.ownerId)[0].displayName
				if (res.data["ownerDisplayName"] == undefined) { throw new Error('no displayname') }
				// console.log(`${loglv.info}${selflogA} [AvatarAuthor] Cached: ${getName.data.ownerId} - ${res.data["ownerDisplayName"]}`)
			} catch (err) {
				// console.log(`${loglv.info}${selflogA} [AvatarAuthor] Fetching: ${getName.data.ownerId}`)
				let getOwner = await limiter.reqCached('user', getName.data.ownerId).catch(async () => {
					return await limiter.req(vrchat.getUser({ 'path': { 'userId': getName.data.ownerId } }), 'user')
				})
				res.data["ownerDisplayName"] = getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : (getOwner.data || "").displayName
				if (avatarStatSummary.seenAuthors.filter(s => s.id == res.data.ownerId).length == 0) {
					avatarStatSummary.seenAuthors.push({ "id": getName.data.ownerId, "displayName": getName.data.ownerId == "8JoV9XEdpo" ? "VRChat" : (getOwner.data || "").displayName })
				}
				if (avatarStatSummary.seenAuthors[0].id == "") { avatarStatSummary.seenAuthors.shift() }
			}
			if (JSON.stringify(res.data) != '') {
				fs.writeFile('./datasets/avatarStatCache/' + fileid + "-" + fileversion + '.json', JSON.stringify(res.data), 'utf8', (err) => { if (err) { console.log(err) } })
			}
		} else {
			// console.log(res)
			return
		}
	}
	// console.log(avatarStatSummary.seenAuthors)

	avatarStatSummary.checkedFileIDs.push(fileid + "-" + fileversion)

	let filesize = await formatBytes(res.data.fileSize)
	let uncompresssize = await formatBytes(res.data.uncompressedSize)
	let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
	if (verboseAvatarStatLogging == true) {
		console.log(`${loglv.info}${selflogA} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
             📦 ${filesize} , 🗃️ ${uncompresssize} , 🐏 ${vramTexsize} , 📐 ${res.data.avatarStats.totalPolygons} , 💡 ${res.data.avatarStats.lightCount} , 🥎 ${res.data.avatarStats.contactCount} , 🔊 ${res.data.avatarStats.audioSourceCount} , 🧲 ${res.data.avatarStats.blendShapeCount}`)
	} else {
		console.log(`${loglv.info}${selflogA} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}`)
	}



	// - Performance Marks-
	var warnbox = ''
	var boundsLongest = Math.round(Math.max(...res.data.avatarStats.bounds) / avatarStatWeights.boundsLongest)
	var animatorCount = Math.round(res.data.avatarStats.animatorCount / avatarStatWeights.animatorCount)
	var audioSourceCount = Math.round(res.data.avatarStats.audioSourceCount / avatarStatWeights.audioSourceCount)
	var boneCount = Math.round(res.data.avatarStats.boneCount / avatarStatWeights.boneCount)
	var cameraCount = Math.round(res.data.avatarStats.cameraCount / avatarStatWeights.cameraCount)
	var clothCount = Math.round(res.data.avatarStats.clothCount / avatarStatWeights.clothCount)
	var constraintCount = Math.round(res.data.avatarStats.constraintCount / avatarStatWeights.constraintCount)
	var constraintDepth = Math.round(res.data.avatarStats.constraintDepth / avatarStatWeights.constraintDepth)
	var lineRendererCount = Math.round(res.data.avatarStats.lineRendererCount / avatarStatWeights.lineRendererCount)
	var materialCount = Math.round(res.data.avatarStats.materialCount / avatarStatWeights.materialCount)
	var meshParticleMaxPolygons = Math.round(res.data.avatarStats.meshParticleMaxPolygons / avatarStatWeights.meshParticleMaxPolygons)
	var particleSystemCount = Math.round(res.data.avatarStats.particleSystemCount / avatarStatWeights.particleSystemCount)
	var physicsColliders = Math.round(res.data.avatarStats.physicsColliders / avatarStatWeights.physicsColliders)
	var physicsRigidbodies = Math.round(res.data.avatarStats.physicsRigidbodies / avatarStatWeights.physicsRigidbodies)
	var totalClothVertices = Math.round(res.data.avatarStats.totalClothVertices / avatarStatWeights.totalClothVertices)
	var totalMaxParticles = Math.round(res.data.avatarStats.totalMaxParticles / avatarStatWeights.totalMaxParticles)
	var trailRendererCount = Math.round(res.data.avatarStats.trailRendererCount / avatarStatWeights.trailRendererCount)
	var totalTextureUsage = res.data.avatarStats.totalTextureUsage / avatarStatWeights.totalTextureUsage
	var uncompressedSize = Math.round(res.data.uncompressedSize / avatarStatWeights.uncompressedSize)
	var totalPolygons = Math.round(res.data.avatarStats.totalPolygons / avatarStatWeights.totalPolygons)
	var skinnedMeshCount = Math.round(res.data.avatarStats.skinnedMeshCount / avatarStatWeights.skinnedMeshCount)
	var meshCount = Math.round(res.data.avatarStats.meshCount / avatarStatWeights.meshCount)
	var physBoneCollisionCheckCount = Math.round(res.data.avatarStats.physBoneCollisionCheckCount / avatarStatWeights.physBoneCollisionCheckCount)
	var physBoneColliderCount = Math.round(res.data.avatarStats.physBoneColliderCount / avatarStatWeights.physBoneColliderCount)
	var physBoneComponentCount = Math.round(res.data.avatarStats.physBoneComponentCount / avatarStatWeights.physBoneComponentCount)
	var physBoneTransformCount = Math.round(res.data.avatarStats.physBoneTransformCount / avatarStatWeights.physBoneTransformCount)
	var contactCount = Math.round(res.data.avatarStats.contactCount / avatarStatWeights.contactCount)
	var materialSlotsUsed = Math.round(res.data.avatarStats.materialSlotsUsed / avatarStatWeights.materialSlotsUsed)
	var lightCount = Math.round(res.data.avatarStats.lightCount / avatarStatWeights.lightCount)
	var blendShapeCount = Math.round(res.data.avatarStats.blendShapeCount / avatarStatWeights.blendShapeCount)
	var raycastCount = Math.round(res.data.avatarStats.raycastCount / avatarStatWeights.raycastCount)
	var statPunish = []

	if (totalTextureUsage > avatarStatWeights.totalTextureUsage) {
		// warnbox += `\v(x${totalTextureUsage}) Texture Memory ${vramTexsize}`;
		statPunish.push({
			"weight": 0,
			"multi": Math.ceil(totalTextureUsage),
			"log": `\v(x${Math.round(totalTextureUsage)}) Texture Mem ${vramTexsize}`,
			"print": `\n              Texture Memory:            ${Math.round(totalTextureUsage)} EV ${totalTextureUsage >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
		})
	}
	if (totalPolygons > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${totalPolygons}) Polygons ${res.data.avatarStats.totalPolygons}`;
		statPunish.push({
			"weight": 1,
			"multi": Math.round(totalPolygons),
			"log": `\v(x${totalPolygons}) Polygons ${res.data.avatarStats.totalPolygons}`,
			"print": `\n              Polygons:                  ${totalPolygons} EV ${totalPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️📐' : ''}`
		})
	}
	if (boundsLongest > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${boundsLongest}) Bounds ${Math.max(...res.data.avatarStats.bounds)}m`;
		statPunish.push({
			"weight": 2,
			"multi": Math.round(boundsLongest),
			"log": `\v(x${boundsLongest}) Bounds ${Math.max(...res.data.avatarStats.bounds)}m`,
			"print": `\n              Bounds:                    ${boundsLongest} EV ${boundsLongest >= avatarStatWeights.higherLimitWeight ? '⚠️🧊' : ''}`
		})
	}
	if (skinnedMeshCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${skinnedMeshCount}) SkinnedMeshes ${res.data.avatarStats.skinnedMeshCount}`;
		statPunish.push({
			"weight": 3,
			"multi": Math.round(skinnedMeshCount),
			"log": `\v(x${skinnedMeshCount}) SkinnedMeshes ${res.data.avatarStats.skinnedMeshCount}`,
			"print": `\n              Skinned Meshes:            ${skinnedMeshCount} EV ${skinnedMeshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.skinnedMeshCount : ''}`
		})
	}
	if (meshCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${meshCount}) Basic Meshes ${res.data.avatarStats.meshCount}`;
		statPunish.push({
			"weight": 4,
			"multi": Math.round(meshCount),
			"log": `\v(x${meshCount}) Basic Meshes ${res.data.avatarStats.meshCount}`,
			"print": `\n              Basic Meshes:              ${meshCount} EV ${meshCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshCount : ''}`
		})
	}
	if (materialSlotsUsed > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${materialSlotsUsed}) Material Slots ${res.data.avatarStats.materialSlotsUsed}`;
		statPunish.push({
			"weight": 5,
			"multi": Math.round(materialSlotsUsed),
			"log": `\v(x${materialSlotsUsed}) Material Slots ${res.data.avatarStats.materialSlotsUsed}`,
			"print": `\n              Material Slots:            ${materialSlotsUsed} EV ${materialSlotsUsed >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialSlotsUsed : ''}`
		})
	}
	if (materialCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${materialCount}) Material Count ${res.data.avatarStats.materialCount}`;
		statPunish.push({
			"weight": 6,
			"multi": Math.round(materialCount),
			"log": `\v(x${materialCount}) Material Count ${res.data.avatarStats.materialCount}`,
			"print": `\n              Material Count:            ${materialCount} EV ${materialCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.materialCount : ''}`
		})
	}
	if (physBoneComponentCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${physBoneComponentCount}) PhysBone Components ${res.data.avatarStats.physBoneComponentCount}`;
		statPunish.push({
			"weight": 7,
			"multi": Math.round(physBoneComponentCount),
			"log": `\v(x${physBoneComponentCount}) PhysBones ${res.data.avatarStats.physBoneComponentCount}`,
			"print": `\n              PhysBone Components:       ${physBoneComponentCount} EV ${physBoneComponentCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneComponentCount : ''}`
		})
	}
	if (physBoneTransformCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${physBoneTransformCount}) PhysBone Transforms ${res.data.avatarStats.physBoneTransformCount}`;
		statPunish.push({
			"weight": 8,
			"multi": Math.round(physBoneTransformCount),
			"log": `\v(x${physBoneTransformCount}) PhysBone Transforms ${res.data.avatarStats.physBoneTransformCount}`,
			"print": `\n              PhysBone Transforms:       ${physBoneTransformCount} EV ${physBoneTransformCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneTransformCount : ''}`
		})
	}
	if (physBoneColliderCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${physBoneColliderCount}) PhysBone Colliders ${res.data.avatarStats.physBoneColliderCount}`;
		statPunish.push({
			"weight": 9,
			"multi": Math.round(physBoneColliderCount),
			"log": `\v(x${physBoneColliderCount}) PhysBone Colliders ${res.data.avatarStats.physBoneColliderCount}`,
			"print": `\n              PhysBone Colliders:        ${physBoneColliderCount} EV ${physBoneColliderCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneColliderCount : ''}`
		})
	}
	if (physBoneCollisionCheckCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${physBoneCollisionCheckCount}) PhysBone Collision Checks ${res.data.avatarStats.physBoneCollisionCheckCount}`;
		statPunish.push({
			"weight": 10,
			"multi": Math.round(physBoneCollisionCheckCount),
			"log": `\v(x${physBoneCollisionCheckCount}) PhysBone Collisions ${res.data.avatarStats.physBoneCollisionCheckCount}`,
			"print": `\n              PhysBone Collision Checks: ${physBoneCollisionCheckCount} EV ${physBoneCollisionCheckCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physBoneCollisionCheckCount : ''}`
		})
	}
	if (contactCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${contactCount}) Contacts ${res.data.avatarStats.contactCount}`;
		statPunish.push({
			"weight": 11,
			"multi": Math.round(contactCount),
			"log": `\v(x${contactCount}) Contacts ${res.data.avatarStats.contactCount}`,
			"print": `\n              Contact Count:             ${contactCount} EV ${contactCount >= avatarStatWeights.higherLimitWeight ? '⚠️🥎' : ''}`
		})
	}
	if (constraintCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${constraintCount}) Constraints ${res.data.avatarStats.constraintCount}`;
		statPunish.push({
			"weight": 12,
			"multi": Math.round(constraintCount),
			"log": `\v(x${constraintCount}) Constraints ${res.data.avatarStats.constraintCount}`,
			"print": `\n              Constraint Count:           ${constraintCount} EV ${constraintCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintCount : ''}`
		})
	}
	if (constraintDepth > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${constraintDepth}) Constraint Depth ${res.data.avatarStats.constraintDepth}`;
		statPunish.push({
			"weight": 13,
			"multi": Math.round(constraintDepth),
			"log": `\v(x${constraintDepth}) Constraint Depth ${res.data.avatarStats.constraintDepth}`,
			"print": `\n              Constraint Depth:          ${constraintDepth} EV ${constraintDepth >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.constraintDepth : ''}`
		})
	}
	if (animatorCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${animatorCount}) Animators ${res.data.avatarStats.animatorCount}`;
		statPunish.push({
			"weight": 14,
			"multi": Math.round(animatorCount),
			"log": `\v(x${animatorCount}) Animators ${res.data.avatarStats.animatorCount}`,
			"print": `\n              Animator Count:            ${animatorCount} EV ${animatorCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.animatorCount : ''}`
		})
	}
	if (boneCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${boneCount}) Bones ${res.data.avatarStats.boneCount}`;
		statPunish.push({
			"weight": 15,
			"multi": Math.round(boneCount),
			"log": `\v(x${boneCount}) Bones ${res.data.avatarStats.boneCount}`,
			"print": `\n              Bones:                     ${boneCount} EV ${boneCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.boneCount : ''}`
		})
	}
	if (lightCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${lightCount}) Light Count ${res.data.avatarStats.lightCount}`;
		statPunish.push({
			"weight": 16,
			"multi": Math.round(lightCount),
			"log": `\v(x${lightCount}) Light Count ${res.data.avatarStats.lightCount}`,
			"print": `\n              Light Count:               ${lightCount} EV ${lightCount >= avatarStatWeights.higherLimitWeight ? '⚠️💡' : ''}`
		})
	}
	if (particleSystemCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${particleSystemCount}) Particle Systems ${res.data.avatarStats.particleSystemCount}`;
		statPunish.push({
			"weight": 17,
			"multi": Math.round(particleSystemCount),
			"log": `\v(x${particleSystemCount}) Particle Systems ${res.data.avatarStats.particleSystemCount}`,
			"print": `\n              Particle System Count:     ${particleSystemCount} EV ${particleSystemCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.particleSystemCount : ''}`
		})
	}
	if (totalMaxParticles > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${totalMaxParticles}) Max Particles ${res.data.avatarStats.totalMaxParticles}`;
		statPunish.push({
			"weight": 18,
			"multi": Math.round(totalMaxParticles),
			"log": `\v(x${totalMaxParticles}) Max Particles ${res.data.avatarStats.totalMaxParticles}`,
			"print": `\n              Max Particles:             ${totalMaxParticles} EV ${totalMaxParticles >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalMaxParticles : ''}`
		})
	}
	if (meshParticleMaxPolygons > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${meshParticleMaxPolygons}) Particle Polygons ${res.data.avatarStats.meshParticleMaxPolygons}`;
		statPunish.push({
			"weight": 19,
			"multi": Math.round(meshParticleMaxPolygons),
			"log": `\v(x${meshParticleMaxPolygons}) Particle Polys ${res.data.avatarStats.meshParticleMaxPolygons}`,
			"print": `\n              Mesh Particle Max Polygons:${meshParticleMaxPolygons} EV ${meshParticleMaxPolygons >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.meshParticleMaxPolygons : ''}`
		})
	}
	if (trailRendererCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${trailRendererCount}) Trail Renderers ${res.data.avatarStats.trailRendererCount}`;
		statPunish.push({
			"weight": 20,
			"multi": Math.round(trailRendererCount),
			"log": `\v(x${trailRendererCount}) Trail Renderers ${res.data.avatarStats.trailRendererCount}`,
			"print": `\n              Trail Renderer Count:      ${trailRendererCount} EV ${trailRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.trailRendererCount : ''}`
		})
	}
	if (lineRendererCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${lineRendererCount}) Line Renderers ${res.data.avatarStats.lineRendererCount}`;
		statPunish.push({
			"weight": 21,
			"multi": Math.round(lineRendererCount),
			"log": `\v(x${lineRendererCount}) Line Renderers ${res.data.avatarStats.lineRendererCount}`,
			"print": `\n              Line Renderer Count:       ${lineRendererCount} EV ${lineRendererCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.lineRendererCount : ''}`
		})
	}
	if (clothCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${clothCount}) Cloth Meshes ${res.data.avatarStats.clothCount}`;
		statPunish.push({
			"weight": 22,
			"multi": Math.round(clothCount),
			"log": `\v(x${clothCount}) Cloth Meshes ${res.data.avatarStats.clothCount}`,
			"print": `\n              Cloth Meshes:               ${clothCount} EV ${clothCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.clothCount : ''}`
		})
	}
	if (totalClothVertices > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${totalClothVertices}) Cloth Vertices ${res.data.avatarStats.totalClothVertices}`;
		statPunish.push({
			"weight": 23,
			"multi": Math.round(totalClothVertices),
			"log": `\v(x${totalClothVertices}) Cloth Vertices ${res.data.avatarStats.totalClothVertices}`,
			"print": `\n              Cloth Vertices:            ${totalClothVertices} EV ${totalClothVertices >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.totalClothVertices : ''}`
		})
	}
	if (physicsColliders > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${physicsColliders}) Unity Colliders ${res.data.avatarStats.physicsColliders}`;
		statPunish.push({
			"weight": 24,
			"multi": Math.round(physicsColliders),
			"log": `\v(x${physicsColliders}) Unity Colliders ${res.data.avatarStats.physicsColliders}`,
			"print": `\n              Physics Colliders:         ${physicsColliders} EV ${physicsColliders >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsColliders : ''}`
		})
	}
	if (physicsRigidbodies > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${physicsRigidbodies}) Rigidbodies ${res.data.avatarStats.physicsRigidbodies}`;
		statPunish.push({
			"weight": 25,
			"multi": Math.round(physicsRigidbodies),
			"log": `\v(x${physicsRigidbodies}) Rigidbodies ${res.data.avatarStats.physicsRigidbodies}`,
			"print": `\n              Physics Rigidbodies:       ${physicsRigidbodies} EV ${physicsRigidbodies >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.physicsRigidbodies : ''}`
		})
	}
	if (audioSourceCount > avatarStatWeights.lowerLimitWeight) {
		// warnbox += `\v(x${audioSourceCount}) AudioSources ${res.data.avatarStats.audioSourceCount}`;
		statPunish.push({
			"weight": 26,
			"multi": Math.round(audioSourceCount),
			"log": `\v(x${audioSourceCount}) AudioSources ${res.data.avatarStats.audioSourceCount}`,
			"print": `\n              AudioSource Count:         ${audioSourceCount} EV ${audioSourceCount >= avatarStatWeights.higherLimitWeight ? '⚠️🔊' : ''}`
		})
	}
	if (raycastCount > avatarStatWeights.lowerLimitWeight) {
		statPunish.push({
			"weight": 27,
			"multi": Math.round(raycastCount),
			"log": `\v(x${raycastCount}) Raycasts ${res.data.avatarStats.raycastCount}`,
			"print": `\n              Raycasts:                  ${raycastCount} EV ${raycastCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.raycastCount : ''}`
		})
	}
	if (blendShapeCount > avatarStatWeights.lowerLimitWeight) {
		statPunish.push({
			"weight": 28,
			"multi": Math.round(blendShapeCount),
			"log": `skip`,
			"print": `\n              BlendShapes:               ${blendShapeCount} EV ${blendShapeCount >= avatarStatWeights.higherLimitWeight ? '⚠️🧲' : ''}`
		})
	}
	if (cameraCount > avatarStatWeights.lowerLimitWeight) {
		statPunish.push({
			"weight": 29,
			"multi": Math.round(cameraCount),
			"log": `skip`,
			"print": `\n              Camera Count:              ${cameraCount} EV ${cameraCount >= avatarStatWeights.higherLimitWeight ? '⚠️' + res.data.avatarStats.cameraCount : ''}`
		})
	}
	if (uncompressedSize > avatarStatWeights.lowerLimitWeight) {
		statPunish.push({
			"weight": 30,
			"multi": Math.round(uncompressedSize),
			"log": `skip`,
			"print": `\n              Uncompressed Size:         ${uncompressedSize} EV ${uncompressedSize >= avatarStatWeights.higherLimitWeight ? '⚠️🐏' : ''}`
		})
	}

	Object.keys(res.data).forEach(async (key, index, arr) => {
		if (key == 'uncompressedSize' || key == 'totalTextureUsage' || key == 'fileSize') {
			if (worstAvatarStats[key].value < res.data[key]) {
				let formatSize = await formatBytes(res.data[key], 2)
				console.log(`${loglv.hey}${selflogA} New worst detected: ${formatSize} [${key}]`)
				worstAvatarStatSaveTrigger = true
				worstAvatarStats[key] = {
					'value': res.data[key],
					'source': `${res.data.ownerDisplayName}'s avatar ${res.data.name}`
				}
			}
		}
	})
	Object.keys(res.data.avatarStats).forEach((key, index, arr) => {
		if (key == 'bounds') {
			if (worstAvatarStats['boundsLongest'].value < Math.max(...res.data.avatarStats.bounds)) {
				console.log(`${loglv.hey}${selflogA} New worst detected: ${Math.max(...res.data.avatarStats.bounds)} [boundsLongest]`)
				worstAvatarStatSaveTrigger = true
				worstAvatarStats['boundsLongest'] = {
					'value': Math.max(...res.data.avatarStats.bounds),
					'source': `${res.data.ownerDisplayName}'s avatar ${res.data.name}`
				}
			}
		} else {
			if (worstAvatarStats[key]?.value < res.data.avatarStats[key]) {
				console.log(`${loglv.hey}${selflogA} New worst detected: ${res.data.avatarStats[key]} [${key}]`)
				worstAvatarStatSaveTrigger = true
				worstAvatarStats[key] = {
					'value': res.data.avatarStats[key],
					'source': `${res.data.ownerDisplayName}'s avatar ${res.data.name}`
				}
			}
		}
	})

	clearTimeout(worstAvatarStatsSaveTimer)
	worstAvatarStatsSaveTimer = setTimeout(() => {
		if (worstAvatarStatSaveTrigger == true) {
			console.log(`${loglv.hey}${selflogA} [WorstStat] Updating Stats file`)
			fs.writeFile('./datasets/worstAvatarStats.json', JSON.stringify(worstAvatarStats), (err) => { if (err) { console.error(err) } })
			worstAvatarStatSaveTrigger = false
		} else {
			console.log(`${loglv.debug}${selflogA} [WorstStat] No Change needed`)
		}
	}, 10000)


	// Chatbox Stats
	var statPunished = statPunish.sort((a, b) => {
		const sortmulti = b.multi - a.multi; if (sortmulti !== 0) { return sortmulti }
		const sortweight = a.weight - b.weight; if (sortweight !== 0) { return sortweight }
	}).filter(r => r.multi >= 2 && r.log != 'skip')

	// Chatbox Stats - El Alba
	var statPunishedEA = statPunish.find(f => f.multi >= 2 && f.weight == 0) // filter only Texture Memory - weight 0

	// Console Stats
	var statTotalAvatarEV = statPunish.sort((a, b) => {
		const sortmulti = b.multi - a.multi; if (sortmulti !== 0) { return sortmulti }
		const sortweight = a.weight - b.weight; if (sortweight !== 0) { return sortweight }
	})


	if (statTotalAvatarEV.length > 0 && verboseAvatarStatLogging == true) {
		console.log(statTotalAvatarEV.map(e => { return e.print }).toString().replace(/\n/, ''))
	}
	if (statPunished.length > 0 && statWarnings == true) {
		console.log('currentAccountInUse', currentAccountInUse['Agroup'])
		if (currentAccountInUse['Agroup'] == true) {
			if (InstanceHistory[0].groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && statPunishedEA != undefined) {
				oscChatBoxV2(`${fitChars(res.data.name)}${fitChars(statPunishedEA.log)}`, 15000, false, true, false, false, true)
			} else {
				oscChatBoxV2(`${fitChars(res.data.name)}${fitChars(statPunished[0].log)}${fitChars(statPunished[1]?.log)}${fitChars(statPunished[2]?.log)}`, 15000, false, true, false, false, true)
			}
		}
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
			avatarStatSummary.stats[key].values.push(res.data.avatarStats[key] || 0)
		}
	})

}

async function scanAllAvatarStats() {
	console.time('Full-Avatar-Scan')

	var fsrddir = await fsp.readdir('./datasets/avatarStatCache/', 'utf8')
	for (const findex in fsrddir) {
		var res = {}
		// console.log('Opening: ', findex)
		var fd;
		try {
			fd = await fsp.open('./datasets/avatarStatCache/' + fsrddir[findex], 'r')
			var fsrdfile = await fd.readFile('utf8')
			// var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + file, 'utf8')
			console.log(`${loglv.info}${selflogA} [AvatarAnalysis] Cached: ${fsrddir[findex]}`)
			if (fsrdfile == '') {
				await fsp.unlink('./datasets/avatarStatCache/' + fsrddir[findex])
			}
			res.data = JSON.parse(fsrdfile)
		} catch (error) {
			console.log(`${loglv.warn}${selflogA} [AvatarAnalysis] `, error)
			continue
		} finally {
			if (fd) {
				await fd.close()
				// console.log('Closed: ', findex)
			}
		}


		let filesize = await formatBytes(res.data?.fileSize)
		let uncompresssize = await formatBytes(res.data?.uncompressedSize)
		let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
		console.log(`${loglv.info}${selflogA} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
             📦 ${filesize} , 🗃️ ${uncompresssize} , 🐏 ${vramTexsize} , 📐 ${res.data.avatarStats.totalPolygons} , 💡 ${res.data.avatarStats.lightCount} , 🥎 ${res.data.avatarStats.contactCount} , 🔊 ${res.data.avatarStats.audioSourceCount} , 🧲 ${res.data.avatarStats.blendShapeCount} , 🧊 ${res.data.avatarStats.bounds.map(Math.ceil)}`)


		Object.keys(res.data).forEach(async (key, index, arr) => {
			if (key == 'uncompressedSize' || key == 'totalTextureUsage' || key == 'fileSize') {
				if (worstAvatarStats[key].value < res.data[key]) {
					let formatSize = await formatBytes(res.data[key], 2)
					console.log(`${loglv.hey}${selflogA} New worst detected: ${formatSize} [${key}]`)
					worstAvatarStatSaveTrigger = true
					try {
						worstAvatarStats[key] = {
							'value': res.data[key],
							'source': `${res.data.ownerDisplayName}'s avatar ${res.data.name}`
						}
					} catch (err) { console.log(err) }
				}
			}
		})
		Object.keys(res.data.avatarStats).forEach((key, index, arr) => {
			if (key == 'bounds') {
				if (worstAvatarStats['boundsLongest'].value < Math.max(...res.data.avatarStats.bounds)) {
					console.log(`${loglv.hey}${selflogA} New worst detected: ${Math.max(...res.data.avatarStats.bounds)} [boundsLongest]`)
					worstAvatarStatSaveTrigger = true
					worstAvatarStats['boundsLongest'] = {
						'value': Math.max(...res.data.avatarStats.bounds),
						'source': `${res.data.ownerDisplayName}'s avatar ${res.data.name}`
					}
				}
			} else {
				if (worstAvatarStats[key]?.value < res.data.avatarStats[key]) {
					console.log(`${loglv.hey}${selflogA} New worst detected: ${res.data.avatarStats[key]} [${key}]`)
					worstAvatarStatSaveTrigger = true
					worstAvatarStats[key] = {
						'value': res.data.avatarStats[key],
						'source': `${res.data.ownerDisplayName}'s avatar ${res.data.name}`
					}
				}
			}
		})

		clearTimeout(worstAvatarStatsSaveTimer)
		worstAvatarStatsSaveTimer = setTimeout(() => {
			if (worstAvatarStatSaveTrigger == true) {
				console.log(`${loglv.hey}${selflogA} [WorstStat] Updating Stats file`)
				fs.writeFile('./datasets/worstAvatarStats.json', JSON.stringify(worstAvatarStats), (err) => { if (err) { console.error(err) } })
				worstAvatarStatSaveTrigger = false
			} else {
				console.log(`${loglv.debug}${selflogA} [WorstStat] No Change needed`)
			}
		}, 10000)


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

		// console.log('progress: ', findex, fsrddir.length-1)
		if (findex == fsrddir.length - 1) {
			console.timeEnd('Full-Avatar-Scan')
			setTimeout(() => {
				requestAvatarStatTable(false, 0.05, true, `All Avatar Stats in Cache`)
			}, 2000)
			setTimeout(() => {
				avatarStatSummary = {
					"totalAvatars": 0,
					"checkedFileIDs": [],
					"seenAuthors": [{
						"id": "", "displayName": ""
					}],
					"seenAvatars": [{
						"name": "", "author": null, "wearers": [], "lastAccessed": 0
					}],
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
						"raycastCount": { "label": "Raycasts", "values": [] },
						"blendShapeCount": { "label": "BlendShapes", "values": [] },
						"cameraCount": { "label": "Cameras", "values": [] },
						"totalTextureUsage": { "label": "Texture Memory (VRAM)", "values": [] },
						"fileSize": { "label": "Download Size", "values": [] },
						"uncompressedSize": { "label": "Uncompressed Size (RAM)", "values": [] }
					}
				}
			}, 10_000)
		}

	}
}

async function scanListAvatarStats(I_list = []) {

	var fsrddir = I_list
	fsrddir.forEach(async (file, index, arr) => {
		var res = {}
		var fsrdfile = await fsp.readFile('./datasets/avatarStatCache/' + file + '.json', 'utf8')
		console.log(`${loglv.info}${selflogA} [AvatarAnalysis] Cached: ${file}`)
		res.data = JSON.parse(fsrdfile)


		let filesize = await formatBytes(res.data.fileSize)
		let uncompresssize = await formatBytes(res.data.uncompressedSize)
		let vramTexsize = await formatBytes(res.data.avatarStats.totalTextureUsage)
		console.log(`${loglv.info}${selflogA} [AvatarAnalysis] ${res.data.performanceRating == 'VeryPoor' ? '❌ VeryPoor' : res.data.performanceRating == 'Poor' ? '🔴 Poor' : res.data.performanceRating == 'Medium' ? '🟡 Medium' : res.data.performanceRating == 'Good' ? '🟢 Good' : res.data.performanceRating == 'Excellent' ? '✅ Excellent' : ''} - ${res.data.name}
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
				requestAvatarStatTable(false, 0.05, true, `Specific List of Avatar Stats from Cache`)
			}, 2000)
			setTimeout(() => {
				avatarStatSummary = {
					"totalAvatars": 0,
					"checkedFileIDs": [],
					"seenAuthors": [{
						"id": "", "displayName": ""
					}],
					"seenAvatars": [{
						"name": "", "author": null, "wearers": [], "lastAccessed": 0
					}],
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
						"raycastCount": { "label": "Raycasts", "values": [] },
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

async function collectActiveInstanceStats(skipLaunch = false) {
	// Active World List
	var activeworlds = await limiter.req(vrchat.getActiveWorlds({ 'query': { 'n': 100, 'order': 'ascending' } }))
	// Worlds Data
	for (const wrld in activeworlds.data) {
		console.log(`${loglv.info}${selflogA} [BulkStatCollection] World Target: ${activeworlds.data[wrld].name}`)
		var maxPlayers = activeworlds.data[wrld].capacity
		var gotworld = await limiter.req(vrchat.getWorld({ 'path': { 'worldId': activeworlds.data[wrld].id } }))

		// Instances Data
		for (const ints in gotworld.data.instances) {
			// Within Player count range
			if (gotworld.data.instances[ints][1] >= 5 && gotworld.data.instances[ints][1] < (maxPlayers - 2)) {
				var location = `${activeworlds.data[wrld].id}:${gotworld.data.instances[ints][0]}`
				// console.log(`${loglv.info}${selflog} [BulkStatCollection] ${wrld} ${ints}`)
				await gotoInstance(location)
			}
		}
	}
	console.log(`${loglv.info}${selflogA} [BulkStatCollection] Finished Collecting Stats.. Going Home.`)
	if (skipLaunch == false) {
		startvrc('wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5:91151~private(usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752)~canRequestInvite~region(use)', true)
	}

	async function gotoInstance(I_instanceLocation) {
		return new Promise(async (resolve, reject) => {
			var gotinstance = await limiter.req(vrchat.getInstance({ 'path': { 'worldId': I_instanceLocation.split(':')[0], 'instanceId': I_instanceLocation.split(':')[1] } }))
			// console.debug(gotinstance.data)
			if (gotinstance.data.full == false && gotinstance.data.n_users >= 5 && gotinstance.data.userCount >= 5 && gotinstance.data.closedAt == null) {
				console.log(`${loglv.info}${selflogA} [BulkStatCollection] Traveling to ${I_instanceLocation.split(':')[1].slice(0, 63)}`)
				if (skipLaunch == false) {
					startvrc(I_instanceLocation, true)
					logEmitter.once('joinedworld', async () => {
						// console.debug('JOINED WORLD');
						// logEmitter.once('notAllowedToTravel', () => { console.debug('NOT ALLOWED TO TRAVEL'); resolve(true) })
						await once(logEmitter, 'avatarQueueFinish')
						resolve(true)
					})
				} else {
					setTimeout(() => {
						resolve(true)
					}, 30_000);
				}

			} else if (gotinstance.data.closedAt != null) {
				console.log(`${loglv.info}${selflogA} [BulkStatCollection] Instance Closed: - ${I_instanceLocation.split(':')[1].slice(0, 57)}`)
				setTimeout(() => { resolve(true) }, 2_000)
			} else if (gotinstance.data.n_users < 5 || gotinstance.data.userCount < 5) {
				console.log(`${loglv.info}${selflogA} [BulkStatCollection] Not enough people: - ${I_instanceLocation.split(':')[1].slice(0, 55)}`)
				setTimeout(() => { resolve(true) }, 2_000)
			} else {
				console.log(`${loglv.info}${selflogA} [BulkStatCollection] Instance Full: - ${I_instanceLocation.split(':')[1].slice(0, 59)}`)
				setTimeout(() => { resolve(true) }, 2_000)
			}
		})
	}

}

async function worldAutoPreloadQueue(worldList = []) {
	console.log(`${loglv.info}${selflogA} [Auto World Preload] Starting, have ${worldList.length} worlds to go through`)
	setUserStatus('Preloading worlds')
	for (const wrd in worldList) {
		await joinWorld(worldList[wrd])
		if (wrd == worldList.length - 1) {
			console.log(`${loglv.hey}${selflogA} [Auto World Preload] Finished, can close VRC if want.`)
			oscChatBoxV2(`Automatic Preload has finished \v Can close VRC if want.`, 30_000)
			setUserStatus('')
		}
	}
	async function joinWorld(world) {
		return new Promise((resolve, reject) => {
			console.log(`${loglv.hey}${selflogA} [Auto World Preload] Creating Preload Instance for ${world}`)
			vrchat.createInstance({
				body: {
					'worldId': world,
					'type': 'hidden',
					'region': 'use',
					// 'displayName': 'Preloading Worlds',
					// 'minimumAvatarPerformance': 'Poor',
					'ownerId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752'
				}
			}).then(created_instance => {
				startvrc(created_instance.data.location, true)
			}).catch((err) => {
				console.log(`${loglv.warn}${selflogA}` + err)
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

function queueInstanceDataBurst() {
	// BUFFER COST 5
	if (getOSCDataBurstState() != 'overloaded' && vrchatRunning == true) {
		OSCDataBurst(7, parseFloat((playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[0] == 0 ? 10 : (playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[0]) / 10)
		OSCDataBurst(8, parseFloat((playersInInstance.length > 80 ? 80 : playersInInstance.length).toString().padStart(2, '0')[1]) / 10)
		OSCDataBurst(9, parseFloat((playerHardLimit > 80 ? 80 : playerHardLimit) < 10 ? (playerHardLimit > 80 ? 80 : playerHardLimit) : (playerHardLimit > 80 ? 80 : playerHardLimit).toString()[0]) / 10)
		OSCDataBurst(10, parseFloat((playerHardLimit > 80 ? 80 : playerHardLimit) < 10 ? 10 : (playerHardLimit > 80 ? 80 : playerHardLimit).toString()[1]) / 10)
		OSCDataBurst(11, parseFloat(playerRatio))
		OSCDataBurst(12, parseFloat(memberRatio))
	}
	// membersInInstance.length
	// memberRatio
}

oscEmitter.on('osc', (addr, value) => {
	if (addr == `/avatar/parameters/api/explore/start` && value == true) { inviteHubQueue() }
	if (addr == `/avatar/parameters/api/explore/next` && value == true) { inviteLocalQueue() }
	// if (address == `/avatar/parameters/api/explore/hub` && value == true) { }
	if (addr == `/avatar/parameters/api/explore/stop` && value == true) {
		apiEmitter.emit('switch', 0, 'world')
	}
	if (addr == `/avatar/parameters/api/explore/prefill` && value == true) { addLabWorldsToLocalQueue() }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 0) { explorePrivacyLevel = 0 }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 1) { explorePrivacyLevel = 1 }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 2) { explorePrivacyLevel = 2 }
	if (addr == `/avatar/parameters/api/explore/privacy` && value == 3) { explorePrivacyLevel = 3 }
	if (addr == `/avatar/parameters/api/requestall` && value == true) { requestAllOnlineFriends(currentUser) }
	if (addr == '/avatar/parameters/api/favWorld' && value != 0) {
		switch (value) {
			case 1:
				findJoinableInstances().then(d => {
					G_instanceJoinQueue = d
					oscChatBoxV2(`~Found ${d.length} joinable instances`, 5000, false, true, false, false)
					console.log(`${loglv.hey}${selflogA} Found ${d.length} joinable instances`)
				})
				break
			case 2:
				inviteJoinableInstanceQueue(); break;
			default: break;
		}
	}

})
oscEmitter.on('avatar', (avtrID) => {
	if (['avtr_305ddd5d-d1f9-4adb-a025-50c2f1a9d219',
		`avtr_5c866609-f49a-4867-ac74-5dab03d5d713`,
		`avtr_75c670ca-4614-4db2-a687-e27994acb0ac`,
		'avtr_6b25124e-e141-4df4-ad27-22766608e5dc',
	].includes(avtrID)) {
		queueInstanceDataBurst()
		oscSend('/avatar/parameters/log/instance_closed', G_InstanceClosed)
		applyGroupLogo(InstanceHistory[0].groupID)
	}
});

async function addLabWorldsToLocalQueue() {
	console.log(`${loglv.info}${selflogA} Adding 100 Community Labs worlds to queue`)
	console.log(`${loglv.info}${selflogA} Adding 100 New-and-Noteworthy worlds to queue`)
	let { data: worldData } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } }))
	let { data: newAndNote } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, sort: 'heat', order: 'descending', offset: 0, tag: 'system_approved,system_published_recently' } }))
	fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
		let localQueueList = data.split(`\r\n`)
		let lastInQueue = localQueueList[localQueueList.length - 2]
		// console.log(lastInQueue)

		let worldlist = ''
		let skipAdd = false
		worldData.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})
		newAndNote.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})

		if (worldlist.includes(lastInQueue) || skipAdd == true) {
			console.log(`${loglv.hey}${selflogA} Cancelled list appendage, Queue already contains part of latest batch`)
			oscChatBoxV2(`Cancelled queue append:\v Queue already contains latest labs batch`, 5000, true, true, false, false, false)

		} else {
			fs.appendFile(worldQueueTxt, `\r\n` + worldlist, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
		}
	})
}
async function addSearchToLocalQueue(i_searchString) {
	console.log(`${loglv.info}${selflogA} Adding searched worlds to queue`)
	let { data: worldData } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, search: i_searchString, sort: 'labsPublicationDate', order: 'descending', offset: 0, tag: 'system_labs' } }))
	let { data: worldData2 } = await limiter.req(vrchat.searchWorlds({ query: { n: 100, search: i_searchString, order: 'descending', offset: 0, notag: 'system_labs' } }))
	fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
		let localQueueList = data.split(`\r\n`)
		let lastInQueue = localQueueList[localQueueList.length - 2]
		// console.log(lastInQueue)

		let worldlist = ''
		let skipAdd = false
		worldData.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})
		worldData2.forEach((w, index, arr) => {
			console.log(`${loglv.info}${selflogA} (${index + 1}/${arr.length}) Added ${w.name} to queue`)
			// console.log(`${loglv.info}${selflog} (${index + 1}/${arr.length}) ${w.id}`)
			lastInQueue == w.id ? skipAdd = true : ''
			index == 0 ? worldlist = w.id : worldlist += `\r\n${w.id}`
		})
		fs.appendFile(worldQueueTxt, `\r\n` + worldlist, { 'encoding': 'utf8' }, (err) => { if (err) { console.log(err) } })
	})
}
function inviteHubQueue() {
	var instanceBody = {
		'worldId': 'wrld_112c5336-0329-4293-83ac-96f37f8a6405',
		'type': 'group',
		'region': 'use',
		// 'displayName': 'World Hop',
		'minimumAvatarPerformance': 'Poor',
		'ownerId': 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce',
		'groupAccessType': 'plus',
		'queueEnabled': true
	}

	console.log(`${loglv.hey}${selflogA} Creating group instance for wrld_112c5336-0329-4293-83ac-96f37f8a6405`)

	vrchat.createInstance({ body: instanceBody })
		.then(created_instance => { startvrc(created_instance.data.location, false) })
		.catch(err => { console.log(`${loglv.warn}${selflogA}` + err) })
}

function inviteLocalQueue(I_autoNext = false) {
	fs.readFile(worldQueueTxt, 'utf8', async (err, data) => {
		// err ? console.log(err); return : ''
		let localQueueList = data.split('\r\n===')[0].split(`\r\n`)
		if (localQueueList.length == 0) {
			console.log(`${loglv.hey}${selflogA} Explore queue is empty${data.includes('===') ? `: Remove bookmark` : ``}`);
			oscChatBoxV2(`~Explore Queue is empty${data.includes('===') ? `\vRemove bookmark.` : ``}`, 5000, true, true, false, false, false);
			return
		}

		if (playersInInstance.length >= 2 && InstanceHistory[0].worldHopNoticeSent != true && InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
			InstanceHistory[0].worldHopNoticeSent = true
			manualCall(`instances/${InstanceHistory[0].location}/announce`, 'POST', { "title": 'Explorer Notice', "message": 'Genarating portal to the next world.\nRespawn if you are lost.', "imageId": 'file_072c4481-1642-4226-91b8-01bbb61444d9', "imageVersion": 1 }).catch(c => { console.error(c) })
		}


		let randnum = Math.round(Math.random() * (localQueueList.length - 1))
		let world_id = localQueueList[randnum]

		let extimelow = Math.floor((localQueueList.length * 2) / 60)
		let extimehig = Math.floor((localQueueList.length * 10) / 60)
		console.log(`${loglv.info}${selflogA} ${localQueueList.length} worlds to explore. [${extimelow} to ${extimehig} Hours]`)
		apiEmitter.emit('switch', localQueueList.length, 'world')

		let gotWorld = await limiter.reqCached('world', world_id).catch(async () => {
			return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': world_id } }), 'world')
		})
		if (gotWorld.data == undefined) {
			console.log(`${loglv.hey}${selflogA} World failed to fetch. Try again..`);
			oscChatBoxV2(`World fetch failed.\vTry another.`, 5000, true, true, false, false, false)
			fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
				if (data.includes(world_id)) {
					fs.writeFile(worldQueueTxt, data.replace(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
				}
			})
			return
		}

		var filter_UserAndroid = playersInstanceObject.find(u => u.platform == 'android')
		var filter_PlatformAdnroid = gotWorld.data.unityPackages.find(p => p.platform == 'android')
		// if (gotWorld.data.capacity < playersInInstance.length && G_InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		if (gotWorld.data.capacity < playersInInstance.length) {
			console.log(`${loglv.hey}${selflogA} World can not fit everyone. Retry..`);
			oscChatBoxV2(`World can not fit everyone.\vTry another.`, 5000, true, true, false, false, false)
			return
			// } else if (filter_UserAndroid != undefined && filter_PlatformAdnroid == undefined && G_InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		} else if (filter_UserAndroid != undefined && filter_PlatformAdnroid == undefined) {
			console.log(`${loglv.hey}${selflogA} World is not Quest compatible. Retry..`);
			oscChatBoxV2(`World is not Quest compatible.\vTry another.`, 5000, true, true, false, false, false)
			return
		}

		var instanceBody = {
			'worldId': world_id,
			'region': 'use',
			// 'displayName': 'World Hop',
			'closedAt': new Date(new Date().getTime() + 600_000).toISOString()
		}
		switch (explorePrivacyLevel) {
			case 0:
				instanceBody['type'] = 'group'
				instanceBody['ownerId'] = 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce'
				instanceBody['groupAccessType'] = 'public'
				instanceBody['minimumAvatarPerformance'] = 'Poor'
				instanceBody['queueEnabled'] = true
				break;
			case 1:
				instanceBody['type'] = 'group'
				instanceBody['ownerId'] = 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce'
				instanceBody['groupAccessType'] = 'plus'
				instanceBody['minimumAvatarPerformance'] = 'Poor'
				instanceBody['queueEnabled'] = true
				break;
			case 2:
				instanceBody['type'] = 'private'
				instanceBody['ownerId'] = process.env["VRC_ACC_ID_1"]
				instanceBody['canRequestInvite'] = true
				break;
			default:
				instanceBody['type'] = 'hidden'
				instanceBody['ownerId'] = process.env["VRC_ACC_ID_1"]
				break;
		}

		console.log(`${loglv.hey}${selflogA} Creating group instance for ${world_id}`)
		var created_instance = await vrchat.createInstance({ 'body': instanceBody })
		if (created_instance.data != undefined) {
			startvrc(created_instance.data.location, I_autoNext)
			apiEmitter.emit('switch', localQueueList.length, 'world')
			console.log(`${loglv.info}${selflogA} Auto-Close set for ${created_instance.data.closedAt}.`)
		} else {
			oscChatBoxV2(`instance create failed.\v[${created_instance.error.response.status}] ${created_instance.error.response.statusText}\v${created_instance.error.message}`, 5000, true, true)
			console.log(`${loglv.warn}${selflogA} `, created_instance.error.cause)
			fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
				// err ? console.log(err); return : ''
				if (data.includes(world_id)) {
					fs.writeFile(worldQueueTxt, data.replace(`${world_id}\r\n`, ''), (err) => { if (err) { console.log(err) } })
				}
				if (I_autoNext == true) { setTimeout(() => { inviteLocalQueue(true) }, 5000) }
			})
		}
	})
}




var lastSetUserStatus = ''
function setUserStatus(I_statusText = '', I_status) {
	// console.log(`${loglv.hey}${selflog} Status Update Cancelled`);return
	if (I_statusText.slice(0, 32) !== lastSetUserStatus && currentAccountInUse['Agroup'] == true) {
		var bodyJson = { 'statusDescription': I_statusText.slice(0, 32) }
		if (I_status != undefined) { bodyJson['status'] = I_status }

		vrchat.updateUser({ 'path': { 'userId': process.env["VRC_ACC_ID_1"] }, 'body': bodyJson })

		console.log(`${loglv.hey}${selflogA} Status Updated: ${I_statusText.slice(0, 32)}`)
		lastSetUserStatus = I_statusText.slice(0, 32)
	}
}


var highestCount = 0
fs.readFile('./datasets/vrcMaxPop.txt', 'utf-8', (err, data) => { highestCount = data })
function getVisitsCount() {
	return new Promise(async (resolve, reject) => {
		if (isApiErrorSkip == true) { resolve(0) } else {
			let { data: visitsCount } = await limiter.req(vrchat.getCurrentOnlineUsers())
			resolve(visitsCount == undefined ? 0 : visitsCount)

			if (visitsCount > highestCount) {
				highestCount = visitsCount
				console.log(`${loglv.hey}\x1b[0m[\x1b[36mCounter\x1b[0m] New Highest Population reached: ${visitsCount}`)
				fs.writeFile('./datasets/vrcMaxPop.txt', visitsCount.toString(), 'utf-8', (err) => { if (err) { console.log(err) } })
			}
		}
	})
}
exports.getVisitsCount = getVisitsCount;

async function startvrc(vrclocation, autoGo = false, openToHome = false) {
	// vrcIsOpen = true
	if (openToHome == true) {
		require('child_process').execSync(`"C:\\Program Files (x86)\\Steam\\steamapps\\common\\VRChat\\start_protected_game.exe" --no-vr`)
	} else {
		await open(`vrchat://launch/?ref=vrchat.com&id=${vrclocation}&attach=1`)
		if (autoGo == true) {
			setTimeout(() => {
				require('child_process').execSync(`"C:\\Users\\14Anthony7095\\Documents\\14aOSC_Multi-Interface\\bin\\vrcPressGoOnWorldPage.exe"`)
			}, 2000);
		}
	}
}
exports.startvrc = startvrc;


var tenMinuteTick = 0
console.log(`${loglv.hey}${selflogA} First Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
setTimeout(() => {
	if (isApiErrorSkip == false) { scanGroupAuditLogs() }
}, 600_000)
setInterval(() => {
	queueInstanceDataBurst()
}, 10_000)

async function scanGroupAuditLogs() {
	console.log(`${loglv.info}${selflogA} Scanning through audit logs.`)

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


	// const { data: logOutput_NHI } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_NHI }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_14aHop } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aHop }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	// const { data: logOutput_14aClone } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_14aClone }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_WEFURS } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_WEFURS }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))

	const { data: logOutput_1year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_1year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_2year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_2year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_3year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_3year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_4year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_4year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_5year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_5year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_6year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_6year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_7year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_7year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_8year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_8year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_9year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_9year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))
	const { data: logOutput_10year } = await limiter.req(vrchat.getGroupAuditLogs({ path: { groupId: targetGroupLogID_10year }, query: { n: 100, offset: 0, startDate: lastFetchGroupLogs } }))

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


	console.log(`${loglv.hey}${selflogA} Next Audit scan at ${new Date(new Date().getTime() + 600_000).toTimeString()}`)
	limiter.sweepCache()

	setTimeout(() => {
		scanGroupAuditLogs()
		tenMinuteTick >= 6 ? tenMinuteTick = 0 : tenMinuteTick++
	}, 600_000)
}

async function requestAllOnlineFriends() {
	var { data: onlineFriends } = await limiter.req(vrchat.getFriends({ query: { offset: 0, n: 100, offline: false } }))
	var privateFriends = onlineFriends.filter(onlineFriends => onlineFriends.location == 'private')
	var privateFriendsNotHere = privateFriends.filter(privateFriends => playersInInstance.includes(privateFriends.displayName) == false)
	privateFriendsNotHere.forEach((friend, index, friendArr) => {
		setTimeout(() => {
			console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Checking ${friend.displayName}`)
			if (['active', 'join me', 'ask me'].includes(friend.status)) {
				console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is in Private`)

				// - No Not Request blacklist -
				if ([`usr_39a91182-0df7-476e-bc4a-e5d709cca692`, // ghost
					`usr_49590946-943b-4835-ba7e-2e370b596b4d`, // Samoi
					`usr_060e1976-dfda-44b0-8f71-fa911d8bf580`, // luna-the-bunny
					`usr_bba4ca7a-5447-4672-828d-0a09d85f854e`, // melting
					`usr_ee815921-8067-4486-a3e2-ded009457cf3` // turtlesnack
				].includes(friend.id)) {
					console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is on Do-Not-Request Blacklist`)
				} else if (friend.statusDescription.toLowerCase().includes('busy')) {
					console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} has "Busy" in status`)
				} else {
					vrchat.requestInvite({ path: { userId: friend.id }, body: { requestSlot: 1 } }).then((send_invite) => {
						console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) Request Sent to ${friend.displayName} - "${send_invite.data.message}"`)
					}).catch((err) => console.log(err))
				}
			} else if (friend.status == 'busy') {
				console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] (${index + 1}/${friendArr.length}) ${friend.displayName} is Busy`)
			}
			if (index + 1 == friendArr.length) {
				setTimeout(() => {
					console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] 10 minutes has past since sending Requests`)
				}, 600_000);
				console.log(`${loglv.info}${selflogA} [BulkFrendRequestInviter] Done Requesting`)
			}
		}, (2_000 * index) + Math.random())
	})
}

var movieShowNameLast = ''
function eventPopcornPalace(json) {
	// {
	//     "videoName": "Lilo and Stitch - 2025-05-17",
	//     "videoPos": 0,
	//     "videoLength": 6453.958,
	//     "thumbnailUrl": "https://web.vr-m.net/api/media/thumbnail/24f5e268-c778-4d46-981b-01e598acd925.png",
	//     "displayName": "14anthony7095",
	//     "isPaused": false,
	//     "is3D": false,
	//     "looping": false
	// }
	var movieShowName = JSON.parse(json).videoName

	// Reformat title for One Piece watch sessions
	if (movieShowName.includes('One Piece')) { movieShowName = movieShowName.replace('- S1E', 'ep.').split(' -')[0] }

	// Difference while on Main accounts
	if (movieShowName != movieShowNameLast && currentAccountInUse['Agroup'] == true) {

		oscChatBoxV2(`~MovieTitle:\v ${movieShowName}`, 5000, true, true, false, false, false)
		movieShowNameLast = movieShowName

		// Been in world long enough
		if (InstanceHistory[0].join_timestamp + 300_000 < Date.now() && InstanceHistory[0].join_timestamp != 0 && movieShowName != '') {
			setUserStatus(`Watching ${movieShowName}`)
		}

	}
}

async function findJoinableInstances() {
	return new Promise(async (resolve, reject) => {
		// Creating instance array to return later
		var joinableInstances = []
		console.log(`${loglv.debug}${selflogL} [InstanceHistory]`, InstanceHistory)

		// Fetching 100 online friends from api
		var gotOnlineFriends = await limiter.req(vrchat.getFriends({ 'query': { 'n': 100, 'offline': false, 'offset': 0 } }))
		if (gotOnlineFriends.data != undefined) {
			if (gotOnlineFriends.data.length == 100) {
				// Fetching 100 more online friends from api
				var gotMoreOnlineFriends = await limiter.req(vrchat.getFriends({ 'query': { 'n': 100, 'offline': false, 'offset': 100 } }))
				if (gotMoreOnlineFriends.data != undefined) {
					// Merging with first
					gotOnlineFriends.data = gotOnlineFriends.data.concat(gotMoreOnlineFriends.data)
				}
			}
			// Filtering Private and Offline instances out of friend data
			gotOnlineFriends.data
				.filter(f => f.location != 'private' && f.location != 'offline')
				.forEach((i) => {
					// Pushing instance locations into return array
					var srcInstHistory = InstanceHistory.find(f => f.location == i.location)
					if (srcInstHistory == undefined && !joinableInstances.includes(i.location)) {
						joinableInstances.push(i.location)
					}
				})
		}

		// Joinable Group Instances
		// Fetching active Group Instances from api
		var gotUserGroupInstances = await vrchat.getUserGroupInstances({ 'path': { 'userId': process.env['VRC_ACC_ID_1'] } })
		if (gotUserGroupInstances.data != undefined) {
			// Filtering out Full instances without queue enabled
			gotUserGroupInstances.data.instances
				.filter(f => f.closedAt == null || (f.closedAt != null && f.closedAt > Date.now()) || f.queueEnabled == true)
				.forEach((i) => {
					// Pushing instance locations into return array
					var srcInstHistory = InstanceHistory.find(f => f.location == i.location)
					if (srcInstHistory == undefined && !joinableInstances.includes(i.location)) {
						joinableInstances.push(i.location)
					}
				})

		}

		// Resolving function's Promise
		resolve(joinableInstances)
	})
}


function inviteJoinableInstanceQueue() {
	if (G_instanceJoinQueue.length == 0) {
		console.log(`${loglv.hey}${selflogA} Joinable queue is empty`);
		oscChatBoxV2(`~Joinable Queue is empty`, 5000, false, true, false, false, false);
		return
	}
	// let randnum = Math.round(Math.random() * (G_instanceJoinQueue.length - 1))
	// let instanceJoinID = G_instanceJoinQueue[randnum]
	startvrc(G_instanceJoinQueue[0])
	// G_instanceJoinQueue.splice(randnum, 1)
	G_instanceJoinQueue.shift()
}

function applyGroupLogo(gID) {
	/*
0111 - El Alba
0110 - VRDance

0101 - Furry Argentina VR
0100 - The Lunar Howl
0011 - Nanachis of VRChat

0010 - Nanachi's hollow inn
0001 - Community Events
0000 - CORE Default
	*/
	switch (gID) {
		case 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad':
			// El Alba
			// 0111 - 7
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case 'grp_d960be54-cfc2-44cb-863d-6d624d8975c1':
			// VR Dance
			// 0110 - 6
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case `grp_a8f9e8f8-6ccb-410e-b96e-8977bd3a094f`:
			// Furry Argentina VR
			// 0101 - 5
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case 'grp_f018a0ac-2ec6-4176-aa47-a0fd2b7ea817':
			// The Lunar Howl
			// 0100 - 4
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 1)
			break;
		case `grp_e483cc04-a610-471f-90eb-ec4eda8420be`:
			// Nanachis of VRChat
			// 0011 - 3
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
		case `grp_3473d54b-8e10-4752-9548-d77a092051a4`:
			// Nanachi's hollow inn
			// 0010 - 2
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
		case `grp_c24efb98-3234-4060-94f1-7729523e9689`:
			// Community Events
			// 0001 - 1
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 1)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
		default:
			// CORE Default
			// 0000 - 0
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX1`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX2`, 1 == 0)
			oscSend(`/avatar/parameters/14a/menuSync/groupLogoX4`, 1 == 0)
			break;
	}
}


function eventGameClose() {
	console.log(`${loglv.hey}${selflogL} VRChat has Closed.`)
	clearTimeout(worldHopTimeout)
	clearTimeout(worldHopTimeoutHour)
	clearTimeout(userTrustTableTimer)
	requestAvatarStatTable(true, 0.05, true)

	apiEmitter.emit('switch', 0, 'world')

	if (lastSetUserStatus == 'Instance is closed' || lastSetUserStatus == `Exploring World Queue`) {
		lastSetUserStatus = ''
		setUserStatus('')
	}

	console.log(`${loglv.info}${selflogL}${ttvFetchFrom == 1 && urlType == 'twitch' ? ` Resetting Twitch target channel${lastVideoURL != '' ? ` &` : ''}` : ''}${lastVideoURL != '' ? ` Clearing Video-URL history` : ''}`)
	switchChannel(process.env["VRC_ACC_NAME_1"])

	G_InstanceClosed = false
	vrchatRunning = false
	worldHopTimeout = null
	worldHopTimeoutHour = null
	userTrustTableTimer = null
	lastVideoURL = ''
	tarFile = 'nothing'
	tonAvgStartWait = []
	worldHoppers = []
	seenVideoURLs = []

	process.title = `14anthony7095 OSC Multi-Interface`

	setTimeout(() => {
		InstanceHistory = InstanceHistory.filter(ih => (ih.leave_timestamp + 3600_000 > Date.now() && ih.join_timestamp != 0) || ih.current == true)
	}, 3610_000)

}
exports.eventGameClose = eventGameClose;

var vrcpropcount = {
	'prop_id': {
		"Name": 'sample',
		"Count": 999
	}
}
fs.readFile('./datasets/propcounts.json', 'utf8', (err, data) => { vrcpropcount = JSON.parse(data) })
async function eventPropSpawned(propID) {
	// console.log(`${loglv.debug}${selflog} Item spawned: ${propID}`)
	if (!vrcpropcount[propID]) {
		console.log(`${loglv.hey}${selflogL} Unseen Item spawned: ${propID}`)
		// console.log(`${loglv.debug}${selflog} ${propID} for ${vrcpropcount}`)
		let res = await limiter.req(vrchat.getProp({ 'path': { 'propId': 'prop_' + propID } }))
		// console.log(`${loglv.debug}${selflog} ${res.data}`)
		if (res.data != undefined) {
			if (!vrcpropcount[propID]) {
				vrcpropcount[propID] = { "name": "", "count": 0 }
			}
			vrcpropcount[propID].name = res.data.name
			if (res.data.itemTemplate != undefined) {
				var gotInvTemplate = await limiter.req(vrchat.getInventoryTemplate({ 'path': { 'inventoryTemplateId': res.data.itemTemplate } }))
				if (gotInvTemplate.data != undefined) {
					vrcpropcount[propID].name = gotInvTemplate.data.name
				}
			}

			vrcpropcount[propID].count = 1
			console.log(`${loglv.hey}${selflogA} Added ${vrcpropcount[propID].name} to the Items list`)
			fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => { if (err) { console.log(err); return } })
		}

	} else {
		vrcpropcount[propID].count = vrcpropcount[propID].count + 1
		console.log(`${loglv.info}${selflogL} Item spawned: ${vrcpropcount[propID].name} - ${vrcpropcount[propID].count - 1} -> ${vrcpropcount[propID].count}`)
		fs.writeFile('./datasets/propcounts.json', JSON.stringify(vrcpropcount, null, 2), (err) => { if (err) { console.log(err); return } })
	}
}

function requestUserTrustTable() {

	var playersInstancePlatforms = playersInstanceObject.reduce((acc, ply) => {
		acc[ply.platform || loglv.false + 'Joining' + loglv.reset] = (acc[ply.platform] || 0) + 1;
		return acc
	}, {})
	playersInstancePlatforms = Object.fromEntries(Object.entries(playersInstancePlatforms).map(e => [e[0], [e[1], Math.round(e[1] / playersInstanceObject.length * 100) + '%']]))

	var playersInstanceTrustRanks = playersInstanceObject.reduce((acc, ply) => {
		acc[ply.trust || loglv.false + 'Joining' + loglv.reset] = (acc[ply.trust] || 0) + 1;
		return acc
	}, {})
	playersInstanceTrustRanks = Object.fromEntries(Object.entries(playersInstanceTrustRanks).map(e => [e[0], [e[1], Math.round(e[1] / playersInstanceObject.length * 100) + '%']]))

	var playersInstanceStatus = playersInstanceObject.reduce((acc, ply) => {
		acc[ply.status || loglv.false + 'Joining' + loglv.reset] = (acc[ply.status] || 0) + 1;
		return acc
	}, {})
	playersInstanceStatus = Object.fromEntries(Object.entries(playersInstanceStatus).map(e => [e[0], [e[1], Math.round(e[1] / playersInstanceObject.length * 100) + '%']]))

	// console.debug(loglv.debug, Object.entries(playersInstanceTrustRanks))

	var a = table(Object.entries(playersInstanceTrustRanks).sort((a, b) => b[1][0] - a[1][0]).map(([k, v]) => [k, ...v]))
	var b = table(Object.entries(playersInstancePlatforms).sort((a, b) => b[1][0] - a[1][0]).map(([k, v]) => [k, ...v]))
	var c = table(Object.entries(playersInstanceStatus).sort((a, b) => b[1][0] - a[1][0]).map(([k, v]) => [k, ...v]))
	var stringDebugTables = table([['Trust Ranks', 'Platform', 'Status'], [a, b, c]])
	console.log(`${loglv.debug}\n${stringDebugTables}`)
}

async function requestAvatarStatTable(writeToFile = false, trAvgPercent = 0.05, resetData = false, sourceLocation) {
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

				/* if (key == 'boundsLongest') {
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
				} else { */
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
				// }
			}
		})
		setTimeout(() => {
			var tableOptions = { 'drawHorizontalLine': (lineIndex, rowCount) => { return lineIndex === 0 || lineIndex === 1 || lineIndex === 30 || lineIndex === rowCount } }
			if (avatarStatSummary.totalAvatars >= 4) {
				console.log('=== Avatar Performance Stat Summary ===\nCreation Date-Time\n   ' + new Date().toLocaleString() + '\nInstance Location\n    ' + sourceLocation + '\n' + table(avatarStatSummaryTable, tableOptions) + `    Excellent ✅: ${avatarStatSummary.Excellent}\n         Good 🟢: ${avatarStatSummary.Good}\n       Medium 🟡: ${avatarStatSummary.Medium}\n         Poor 🔴: ${avatarStatSummary.Poor}\n     VeryPoor ❌: ${avatarStatSummary.VeryPoor}`)
				if (writeToFile == true) {
					fs.writeFile('./datasets/avatarStatSummarys/' + Date.now() + ' ' + sourceLocation + '.txt', '=== Avatar Performance Stat Summary ===\nCreation Date-Time\n   ' + new Date().toLocaleString() + '\nInstance Location\n    ' + sourceLocation + '\n' + table(avatarStatSummaryTable, tableOptions) + `    Excellent ✅: ${avatarStatSummary.Excellent}\n         Good 🟢: ${avatarStatSummary.Good}\n       Medium 🟡: ${avatarStatSummary.Medium}\n         Poor 🔴: ${avatarStatSummary.Poor}\n     VeryPoor ❌: ${avatarStatSummary.VeryPoor}\n` + '\n--Avatar Security Checks used--' + avatarStatSummary.checkedFileIDs.map((v) => { return '\n' + v }), 'utf8', (err) => {
						if (err) { console.error(err) }
					})
				}
			}
			if (resetData == true) {
				avatarStatSummary = {
					"totalAvatars": 0,
					"checkedFileIDs": [],
					"seenAuthors": [{
						"id": "", "displayName": ""
					}],
					"seenAvatars": [{
						"name": "", "author": null, "wearers": [], "lastAccessed": 0
					}],
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
						"raycastCount": { "label": "Raycasts", "values": [] },
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

async function requestWorstStatTable() {
	return new Promise((resolve, reject) => {
		var worstStatSummaryTable = [['Component', 'Value', 'Blame Source']]
		Object.keys(worstAvatarStats).forEach(async (key, index, arr) => {
			if (key == 'fileSize' || key == 'uncompressedSize' || key == 'totalTextureUsage') {
				var vValue = await formatBytes(worstAvatarStats[key].value)
				worstStatSummaryTable.push([avatarStatSummary.stats[key].label, vValue, worstAvatarStats[key].source])
			} else {
				worstStatSummaryTable.push([avatarStatSummary.stats[key].label, worstAvatarStats[key].value, worstAvatarStats[key].source])
			}
		})
		setTimeout(() => {
			var logString = ''
			worstStatSummaryTable.map(([l, v, b]) => { return `${l}	${v}		${b}` }).forEach(line => {
				logString += `${logString.length == 0 ? '' : '\n'}${line}`
			})
			fs.writeFile('./output.txt', logString, (err) => { if (err) { console.error(err) } })
			console.log(logString, '\n\nWrote to output.txt file')
			open('./output.txt')
		}, 2000)
	})
}

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
			console.log(`${loglv.hey}${selflogA} Closing Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
			await limiter.req(vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'request' } }))
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
			console.log(`${loglv.hey}${selflogA} Opening Access to "${item + 1} Year${(item + 1) > 1 ? 's' : ''} of VRC Collector" group`)
			await limiter.req(vrchat.updateGroup({ 'path': { 'groupId': FC_yearGroups[item] }, 'body': { 'joinState': 'open' } }))
			await sleep(10000)
		}

		resolve(true)

	})
}

async function updateBioWorldQueue() {
	return new Promise((resolve) => {
		fs.readFile(worldQueueTxt, 'utf8', async (err, dataw) => {
			let localQueueList = dataw.split('===')[0].split(`\r\n`)
			console.log(`${loglv.hey}${selflogA} Preping Bio for world queue update`)
			if (localQueueList.length != 0) {
				console.log(`${loglv.info}${selflogA} Fetching current Bio`)
				let { data: mybio } = await limiter.req(vrchat.getUser({ 'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' } }))

				if (mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/) != null) {
					if (parseInt(mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]) != localQueueList.length) {
						console.log(`${loglv.info}${selflogA} Updating Bio queue count: ${mybio.bio.match(/Worlds in queue[:˸] (\d{1,4})/)[1]} -> ${localQueueList.length}`)
						// console.log(`${loglv.debug}${selflog} ${mybio.bio}`)
						let mybioUpdated = mybio.bio.replace(/Worlds in queue[:˸] \d{1,4}/, 'Worlds in queue: ' + localQueueList.length)
						await limiter.req(vrchat.updateUser({ 'path': { 'userId': 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752' }, 'body': { 'bio': mybioUpdated } }))

						// console.log(`${loglv.debug}${selflog} ${mybioUpdated}`)
						setTimeout(() => { resolve(true) }, 2000)
					} else {
						console.log(`${loglv.info}${selflogA} Bio already contains current queue count`)
						setTimeout(() => { resolve(true) }, 2000)
					}
				}
			} else {
				console.log(`${loglv.info}${selflogA} world queue empty, Skiping`)
				setTimeout(() => { resolve(true) }, 2000)
			}
		})
	})
}

function scanaudit(logoutput, groupID) {
	// console.log(`${loglv.info}${selflog} Scanning through audit log for group ${groupID}`)
	return new Promise((resolve, reject) => {
		if (logoutput == undefined) {
			resolve(false)
		} else if (logoutput.results.length == 0) {
			setTimeout(() => {
				resolve(true)
				// console.log(`${loglv.info}${selflog} Audit Log was Empty for ${groupID}`)
			}, 2_000)
		}
		for (const item in logoutput.results) {
			// fs.appendFile('./output.txt', JSON.stringify(logoutput.results[item]), (err) => { if (err) { console.error(err) } })

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
					let { data: userData } = await limiter.reqCached('user', l.actorId).catch(async () => {
						return await limiter.req(vrchat.getUser({ path: { userId: l.actorId } }), 'user')
					})
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

					findHighestBadage = userData.badges
						.filter(e => e.badgeDescription.includes('Joined VRChat'))
						.sort((a, b) => parseInt(b.badgeName.substring(0, 2).trim()) - parseInt(a.badgeName.substring(0, 2).trim()))
					userBadgeYearNum = findHighestBadage.length > 0 ? parseInt(findHighestBadage[0].badgeName.substring(0, 2).trim()) : 0
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
					let { data: userData } = await limiter.reqCached('user', l.targetId).catch(async () => {
						return await limiter.req(vrchat.getUser({ path: { userId: l.targetId } }), 'user')
					})

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
					let { data: userData } = await limiter.reqCached('user', l.actorId).catch(async () => {
						return await limiter.req(vrchat.getUser({ path: { userId: l.actorId } }))
					})
					postAuthorName = userData.displayName
				}
				if (l.data.imageId != null) {
					let { data: filedata } = await limiter.reqCached('file', l.data.imageId).catch(async () => {
						return await limiter.req(vrchat.getFile({ path: { fileId: l.data.imageId } }), 'file')
					})
					postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
				}
				if (l.data.bannerId != null) {
					let { data: filedata } = await limiter.reqCached('file', l.data.bannerId.new).catch(async () => {
						return await limiter.req(vrchat.getFile({ path: { fileId: l.data.bannerId.new } }), 'file')
					})
					postImage = filedata != undefined ? filedata.versions[1].file.url : 'https://cdn.discordapp.com/emojis/1020097172538138706.webp?size=96'
				}
				if (l.targetId.includes('wrld_')) {
					let regex = /(wrld_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}):([0-9]{5})~group\(grp_[0-z]{8}-(?:[0-z]{4}-){3}[0-z]{12}\)~groupAccessType\((members|plus|public)\)(?:~canRequestInvite)?~region\((us|use|eu|jp)\)/
					if (regex.test(l.targetId)) {
						locationWorldID = regex.exec(l.targetId)[1]
						locationID = regex.exec(l.targetId)[2]
						locationType = regex.exec(l.targetId)[3]
						locationRegion = regex.exec(l.targetId)[4].toUpperCase()
						let { data: worldData } = await limiter.reqCached('world', locationWorldID).catch(async () => {
							return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': locationWorldID } }), 'world')
						})
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
						let { data: worldData } = await limiter.reqCached('world', locationWorldID).catch(async () => {
							return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': locationWorldID } }), 'world')
						})
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
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								break;
							case `grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233`:
								// 2 Year of VRC Collector
								if (userBadgeYearNum < 2) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 2) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_ba9a83ef-972a-495a-b2ba-3ad28dc1c233' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_378c0550-07a1-4cab-aa45-65ad4a817117`:
								// 3 Year of VRC Collector
								if (userBadgeYearNum < 3) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 3) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_378c0550-07a1-4cab-aa45-65ad4a817117' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8`:
								// 4 Year of VRC Collector
								if (userBadgeYearNum < 4) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 4) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a201a74e-3492-4caf-a4cd-6675cc9f7ef8' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4`:
								// 5 Year of VRC Collector
								if (userBadgeYearNum < 5) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 5) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_a7b635cc-40fa-4951-ac77-da13b15e6bb4' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675`:
								// 6 Year of VRC Collector
								if (userBadgeYearNum < 6) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 6) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_93fe1df8-b9f2-4df6-81e9-4e16536f4675' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_5eb28410-68df-4609-b0c5-bc98cf754264`:
								// 7 Year of VRC Collector
								if (userBadgeYearNum < 7) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 7) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_5eb28410-68df-4609-b0c5-bc98cf754264' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_18aa4b68-9118-4716-9a39-42413e54db8c`:
								// 8 Year of VRC Collector
								if (userBadgeYearNum < 8) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 8) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_18aa4b68-9118-4716-9a39-42413e54db8c' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_768a2c3d-b22c-48d2-aae1-650483c347ea`:
								// 9 Year of VRC Collector
								if (userBadgeYearNum < 9) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 9) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_768a2c3d-b22c-48d2-aae1-650483c347ea' }, 'body': { 'userId': l.actorId } }))
								}
								break;
							case `grp_243d9742-ce05-4fc3-b399-cd436528c432`:
								// 10 Year of VRC Collector
								if (userBadgeYearNum < 10) {
									await limiter.req(vrchat.kickGroupMember({ 'path': { 'groupId': groupID, 'userId': l.actorId } }))
								}
								if (userBadgeYearNum + 1 < 10) {
									await limiter.req(vrchat.banGroupMember({ 'path': { 'groupId': 'grp_243d9742-ce05-4fc3-b399-cd436528c432' }, 'body': { 'userId': l.actorId } }))
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
						console.log(`${loglv.warn} - ${l.eventType} does not exist yet`)
					}
				}
			}, 10_000 * (arr.length - 1 - index))
			if (index == arr.length - 1) {
				setTimeout(() => {
					resolve(true); console.log(`${loglv.info}${selflogA} Audit Log scan finished for ${groupID}`)
				}, 20_000)
			}
		})
		// const invertedIndex = arr.length - 1 - index;

	})
}


async function eventHeadingToWorld(logOutputLine) {
	clearTimeout(worldHopTimeout)
	worldHopTimeout = null
	clearTimeout(worldHopTimeoutHour)
	worldHopTimeoutHour = null

	var worldID = /wrld_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
	var groupID = ''
	var instanceType = ''
	console.log(`${loglv.info}${selflogL} World ID ${worldID}`)
	G_groupMembersVisible = false

	// 2026.01.27 14:20:50 Debug      -  [Behaviour] Destination set: wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5:65895~hidden(usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752)~region(use)

	if (logOutputLine.includes(`~group(grp_`)) {
		groupID = /grp_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}/.exec(logOutputLine)[0]
		console.log(`${loglv.info}${selflogL} Group ID ${groupID}`)
		if (logOutputLine.includes(`~groupAccessType(plus)`)) {
			instanceType = `groupPlus`
		} else if (logOutputLine.includes(`~groupAccessType(public)`)) {
			instanceType = `groupPublic`
		} else {
			instanceType = `group`
		}

		// Group Member visibility
		var gotGroup = await limiter.reqCached('group', groupID).catch(async () => {
			return await limiter.req(vrchat.getGroup({ 'path': { 'groupId': groupID } }), 'group')
		})
		if (gotGroup.data.membershipStatus == 'member' || gotGroup.data.privacy == 'default') {
			G_groupMembersVisible = true
		} else {
			console.log(`${loglv.hey}${selflogA} Group is Private and/or you're not a member. [ ${gotGroup.data.privacy} - ${gotGroup.data.membershipStatus}] `)
		}

	} else {
		if (logOutputLine.includes(`~private(`)) {
			instanceType = `invite`
		} else if (logOutputLine.includes(`~canRequestInvite`)) {
			instanceType = `invitePlus`
		} else if (logOutputLine.includes(`~friends(`)) {
			instanceType = `friends`
		} else if (logOutputLine.includes(`~hidden(`)) {
			instanceType = `friendsPlus`
		} else {
			instanceType = `public`
		}
	}

	InstanceHistory[0].current = false
	InstanceHistory.unshift({
		'current': true,
		'location': 'wrld_' + logOutputLine.split('wrld_')[1],
		'worldID': worldID,
		'groupID': groupID,
		'instanceType': instanceType,
		'join_timestamp': 0,
		'leave_timestamp': 0,
		'timeSpent': 0
	});


	// Get world info for OBS Stream
	let res = await limiter.reqCached('world', worldID).catch(async () => {
		return await limiter.req(vrchat.getWorld({ 'path': { 'worldId': worldID } }), 'world')
	})
	apiEmitter.emit('fetchedDistThumbnail', res.data.imageUrl, res.data.name.slice(0, 50), res.data.authorName.slice(0, 50), worldID)

	// Save avatar stats for the instance
	await requestAvatarStatTable(true, 0.05, true, `${InstanceHistory[1].worldID} - ${InstanceHistory[1].instanceType}${InstanceHistory[1].groupID != '' ? ' - ' + InstanceHistory[1].groupID : ''}`)

	// El Alba starting world
	if (groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && worldID == 'wrld_f6445b27-037d-4926-b51f-d79ada716b31') { worldHoppers = [] }
	if (groupID != 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && InstanceHistory[1]?.groupID != 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad' && groupID != '') { worldHoppers = [] }

	console.log(`${loglv.info}${selflogL} Instance Type ${instanceType}`)
}


function eventJoinWorld() {
	worldHopTimeout = setTimeout(() => {
		say.speak(`Been in world for too long. Proceed to next in queue`, 'Microsoft David Desktop', 1.0, (err) => {
			if (err) { return console.error(`${loglv.warn}${selflogL} say.js error: ` + err) }
		})
	}, 600_000)
	worldHopTimeoutHour = setTimeout(() => {
		say.speak(`Been in world for over an hour. Find a new world`, 'Microsoft David Desktop', 1.0, (err) => {
			if (err) { return console.error(`${loglv.warn}${selflogL} say.js error: ` + err) }
		})
	}, 3600_000)

	if (cooldownUrl == true) { cooldownUrl = false }

	InstanceHistory[0].join_timestamp = Date.now()
	// console.log(`${loglv.debug}${selflogL} [InstanceHistory]`, InstanceHistory)

	playersInInstance = []
	membersInInstance = []
	playersInstanceObject = []
	fs.readFile(worldQueueTxt, 'utf8', (err, data) => {
		if (data.includes(InstanceHistory[0].worldID) && InstanceHistory[0].worldID != '') {
			fs.writeFile(worldQueueTxt, data.replace(`${InstanceHistory[0].worldID}\r\n`, ''), (err) => {
				if (err) { console.log(err) }
				console.log(`${loglv.debug}${selflogL} ${InstanceHistory[0].worldID} was successfully purged from queue`)
			})
		}
	})


	if (lastSetUserStatus == movieShowNameLast && InstanceHistory[0].worldID != 'wrld_266523e8-9161-40da-acd0-6bd82e075833') {
		setUserStatus(``)
	}

}

function eventInstanceClosed() {
	if (InstanceHistory[0].worldID != 'wrld_6c4492e6-a0f2-4fb0-a211-234c573ab7d5' && InstanceHistory[0].groupID != 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		lastSetUserStatus = 'Instance is closed'
		setUserStatus('Instance is closed')
	} else if (InstanceHistory[0].groupID == 'grp_c4754b89-80f3-45f6-ac8f-ec9db953adce') {
		if (lastSetUserStatus != `Exploring World Queue`) {
			lastSetUserStatus = `Exploring World Queue`
			setUserStatus(`Exploring World Queue`)
		}
		inviteLocalQueue(G_autoNextWorldHop)

	}
	G_InstanceClosed = true
	oscSend('/avatar/parameters/log/instance_closed', true)

}

function eventReceivedNotification(line) {
	let senderUserID = line.split(', sender user id:')[1].split(',')[0]
	let notifType = line.split(', type:')[1].split(',')[0]

	switch (notifType) {
		case 'invite':
			oscSend('/avatar/parameters/log/inviteNotif', true)
			break;
		case 'localNotifs':
			if (senderUserID == '8JoV9XEdpo') {
				if (line.includes(`This instance will be reset`)) {
					let remainingTime = line.split('will be reset in ')[1].split(' due')[0]
					lastSetUserStatus = `Instance Reset in ${remainingTime}`
					setUserStatus(`Instance Reset in ${remainingTime}`)
					G_InstanceClosed = true
					oscSend('/avatar/parameters/log/instance_closed', true)
				}
			}
			break;
		default: break;
	}

	// Received Notification: <Notification from 
	// username:14anthony7095, 
	// sender user id:usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752 to usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752 of type: invite, 
	// id: not_f7a7c0af-84e9-4c2f-8e54-f0757ed3632b, 
	// created at: 06/17/2025 18:28:11 UTC, 
	// details: {{worldId=wrld_ab93c6a0-d158-4e07-88fe-f8f222018faa:68053~hidden(usr_498c8e8a-1e14-4ef1-8952-e9e9297167b3)~region(use), worldName=A Simple Fishing World}}, 
	// type:invite, 
	// m seen:False, 
	// message: "This is a generated invite to A Simple Fishing World">
}


var currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"], Agroup: true }
async function eventPlayerInitialized(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] Initialized player ')[1]

	if (playerDisplayName != undefined) {
		console.log(`${loglv.info}${selflogL} Player Joining: ` + playerDisplayName)
		logEmitter.emit('playerJoin', playerDisplayName)

		// Terrors of Nowhere alert friend join
		if (InstanceHistory[0].worldID == 'wrld_a61cdabe-1218-4287-9ffc-2a4d1414e5bd' &&
			[`invite`, `invitePlus`, `friends`, `friendsPlus`].includes(InstanceHistory[0].instanceType) &&
			Date.now() > (InstanceHistory[0].join_timestamp + 120_000) &&
			currentAccountInUse['Agroup'] == true) {
			oscChatBoxV2(`~Someone is joining if you want to wait for them: ${playerDisplayName}`, undefined, false, true, false, true, false)
		}


		playersInInstance.push(playerDisplayName)
		playersInstanceObject.push({ 'name': playerDisplayName })

		playerRatio = playersInInstance.length / playerHardLimit

		if ([`groupPlus`, `groupPublic`, `group`].includes(InstanceHistory[0].instanceType)) {
			memberRatio = membersInInstance.length / playersInInstance.length
			console.log(`${loglv.info}${selflogL} There are now ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`
		} else {
			console.log(`${loglv.info}${selflogL} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`
		}

		if (Date.now() > (InstanceHistory[0].join_timestamp + 30000)) { queueInstanceDataBurst() }

		switch (playerDisplayName) {
			case process.env["VRC_ACC_NAME_6"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_6"], id: process.env["VRC_ACC_ID_6"], Agroup: false }
				break;
			case process.env["VRC_ACC_NAME_4"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_4"], id: process.env["VRC_ACC_ID_4"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_7"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_7"], id: process.env["VRC_ACC_ID_7"], Agroup: false }
				break;
			case process.env["VRC_ACC_NAME_3"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_3"], id: process.env["VRC_ACC_ID_3"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_5"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_5"], id: process.env["VRC_ACC_ID_5"], Agroup: false }
				break;
			case process.env["VRC_ACC_NAME_2"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_2"], id: process.env["VRC_ACC_ID_2"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_1"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_1"], id: process.env["VRC_ACC_ID_1"], Agroup: true }
				break;
			case process.env["VRC_ACC_NAME_8"]:
				if (currentAccountInUse.name != playerDisplayName) { console.log(`${loglv.hey}${selflogL} Switching InviteUser target to ${playerDisplayName}`) }
				currentAccountInUse = { name: process.env["VRC_ACC_NAME_8"], id: process.env['VRC_ACC_ID_1'], Agroup: false }
				break;
			default:
				break;
		}
	}
}


var userTrustTableTimer
async function eventPlayerJoin(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerJoined ')[1]

	if (playerDisplayName != undefined) {
		var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0].replace(/\(/, '').replace(/\)/, '')

		playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '').replace(/ \([0-z]{10}\)/, '')

		// Append UserID to tracked player
		let pioIndex = playersInstanceObject.findIndex(playersInstanceObject => playersInstanceObject.name == playerDisplayName)


		// When I join instance
		if (playerDisplayName == currentAccountInUse.name) {
			logEmitter.emit('joinedworld', InstanceHistory[0].worldID)
		}

		// Group Member tagging
		function markUserAsMember(I_memberStatus, I_groupName = 'GroupMember', I_addToWorldHop = false) {
			console.log(`${loglv.info}${selflogA} [${I_groupName}] ${I_memberStatus == true ? '💜' : '👻'} ${playerDisplayName} ${I_memberStatus == true ? 'is' : 'NOT a'} member`)
			try { playersInstanceObject[pioIndex].isGroupMember = I_memberStatus } catch (error) {
				console.log(`${loglv.hey}${selflogL} playerTracker Object got Member before PlayerName - ${error}`)
				playersInstanceObject.push({ 'name': playerDisplayName, 'id': playerID, 'isGroupMember': I_memberStatus })
			}
			if (I_addToWorldHop) {
				worldHoppers.push({ "name": playerDisplayName, "id": playerID, "playtime": 0, "joinTime": Date.now(), "groupMember": I_memberStatus })
			}

			membersInInstance = playersInstanceObject.filter(p => p.isGroupMember == true)
			memberRatio = membersInInstance.length / playersInInstance.length
			playerRatio = playersInInstance.length / playerHardLimit
			console.log(`${loglv.info}${selflogA} There are now ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`
		}

		if (InstanceHistory[0].groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {

			var gotUserGroups = await limiter.reqCached('userGroups', playerID).catch(async () => {
				return await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': playerID } }), 'userGroups', playerID)
			})
			if (gotUserGroups.data.find(g => g.groupId == InstanceHistory[0].groupID) == undefined) {
				markUserAsMember(false, 'ElAlba', true)
			} else { markUserAsMember(true, 'ElAlba', true) }

		} else if (InstanceHistory[0].groupID == 'grp_c24efb98-3234-4060-94f1-7729523e9689') {

			var gotUserGroups = await limiter.reqCached('userGroups', playerID).catch(async () => {
				return await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': playerID } }), 'userGroups', playerID)
			})
			if (gotUserGroups.data.find(g => g.groupId == InstanceHistory[0].groupID) == undefined) {
				markUserAsMember(false, 'CommunityMeetup', true)
			} else { markUserAsMember(true, 'CommunityMeetup', true) }

		} else if (InstanceHistory[0].groupID != '' && G_groupMembersVisible == true) {

			var gotUserGroups = await limiter.reqCached('userGroups', playerID).catch(async () => {
				return await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': playerID } }), 'userGroups', playerID)
			})
			if (gotUserGroups.data.find(g => g.groupId == InstanceHistory[0].groupID) == undefined) {
				markUserAsMember(false)
			} else { markUserAsMember(true) }

		}


		// POSSIBLY HEAVY ON API CALLS
		// var ttt = await vrchat.getUser({ 'path': { 'userId': playerID } })
		// ttt.data.last_platform ==
		var gotUser = await limiter.reqCached('user', playerID).catch(async () => {
			return await limiter.req(vrchat.getUser({ 'path': { 'userId': playerID } }), 'user')
		})
		if (gotUser != undefined) {
			var userCachePlatform = gotUser.data.platform == 'offline' ? gotUser.data.last_platform : gotUser.data.platform
			var userCachePlatformLog = userCachePlatform == 'standalonewindows' ? '🖥️ PC     ' :
				userCachePlatform == 'android' ? '🍏 Android' :
					'📱 iOS    '

			var userCacheStatus = gotUser.data.status
			var userCacheStatusLog = gotUser.data.status == 'join me' ? '🔵 Join Me' :
				gotUser.data.status == 'busy' ? '🔴 Busy' :
					gotUser.data.status == 'ask me' ? '🟠 Ask Me' :
						'🟢 Active'

			var userCacheTrust = gotUser.data.tags.includes('system_trust_veteran') ? ['🟪 Trusted User', 'Trusted User'] :
				gotUser.data.tags.includes('system_trust_trusted') ? ['🟧 Known User  ', 'Known User'] :
					gotUser.data.tags.includes('system_trust_known') ? ['🟩 User        ', 'User'] :
						gotUser.data.tags.includes('system_trust_basic') ? ['🟦 New User    ', 'New User'] :
							['👻 Visitor     ', 'Visitor']

			console.log(`${loglv.info}${selflogA} [User] ${loglv.true}${playerDisplayName.replace(/[^\x20-\x7E]/g, "?").padEnd(20, ' ').slice(0, 20)}${loglv.reset} is a ${userCacheTrust[0]} on ${userCachePlatformLog} set to ${userCacheStatusLog}`)
			// console.log(`${loglv.info}${selflogA} [User] ${loglv.true}${playerDisplayName.replace(/[^\x00-\x7F]/g, "?").padEnd(20,' ').slice(0,20)}${loglv.reset} is a ${userCacheTrust[0]} on ${userCachePlatformLog} set to ${userCacheStatusLog}`)

			try {
				playersInstanceObject[pioIndex].platform = userCachePlatform
				playersInstanceObject[pioIndex].status = userCacheStatus
				playersInstanceObject[pioIndex].trust = userCacheTrust[1]
			} catch (err) {
				console.log(`${loglv.hey}${selflogL} playerTracker Object got Profile Data before PlayerName - ${err}`)
				playersInstanceObject.push({
					'name': playerDisplayName, 'id': playerID, 'platform': userCachePlatform, 'status': userCacheStatus, 'trust': userCacheTrust[1]
				})
			}

			clearTimeout(userTrustTableTimer)
			userTrustTableTimer = setTimeout(() => { requestUserTrustTable() }, 10000);

		}


		try {
			playersInstanceObject[pioIndex].id = playerID
		} catch (error) {
			console.log(`${loglv.hey}${selflogL} playerTracker Object got UserID before PlayerName - ${error}`)
			playersInstanceObject.push({ 'name': playerDisplayName, 'id': playerID })
		}
	}
}
// async function enqueueUserDataFetch(I_userID) {
//     let gotuser = await limiter.req(vrchat.getUser({ 'path': { 'userId': I_userID } }))

//     gotuser.data.id
// }

function eventPlayerLeft(logOutputLine) {
	var playerDisplayName = logOutputLine.split('[Behaviour] OnPlayerLeft ')[1]

	if (playerDisplayName != undefined || playerDisplayName != null) {
		// var playerID = /(?:\([0-z]{10}\))|(?:\(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\))/.exec(playerDisplayName)[0]

		playerDisplayName = playerDisplayName.replace(/ \(usr_[0-z]{8}-([0-z]{4}-){3}[0-z]{12}\)/, '').replace(/ \([0-z]{10}\)/, '')
		console.log(`${loglv.info}${selflogL} Player Left: ` + playerDisplayName)

		playersInInstance = playersInInstance.filter(name => name != playerDisplayName)
		playersInstanceObject = playersInstanceObject.filter(playersInstanceObject => playersInstanceObject.name !== playerDisplayName)
		playerRatio = playersInInstance.length / playerHardLimit

		if (Date.now() > (InstanceHistory[0].join_timestamp + 30000) && worldHopTimeout != null) { queueInstanceDataBurst() }

		try {
			avatarStatSummary.seenAvatars
				.filter(a => a.wearers.includes(playerDisplayName))
				.map(b => b.wearers.splice(b.wearers.indexOf(playerDisplayName)))
		} catch (error) {
			console.debug('no wearer to remove')
		}


		if ([`groupPlus`, `groupPublic`, `group`].includes(InstanceHistory[0].instanceType)) {
			membersInInstance = playersInstanceObject.filter(p => p.isGroupMember == true)
			memberRatio = membersInInstance.length / playersInInstance.length
			console.log(`${loglv.info}${selflogL} There are now ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${G_groupMembersVisible == true ? membersInInstance.length : '⛔'} / ${playersInInstance.length} (${playerHardLimit}) members in the instance. [ ${G_groupMembersVisible == true ? Math.round(memberRatio * 100) : '⛔'}% - ${Math.round(playerRatio * 100)}% ]`
		} else {
			console.log(`${loglv.info}${selflogL} There are now ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`)
			process.title = `Instance: ${playersInInstance.length} / ${playerHardLimit} players in the instance. [ ${Math.round(playerRatio * 100)}% ]`
		}
		// logEmitter.emit('playerLeft', playerDisplayName, playerID, playersInInstance)

		// El Alba starting world
		if (InstanceHistory[0].groupID == 'grp_6f6744c5-4ca0-44a4-8a91-1cb4e5d167ad') {
			var filteredhoppers = worldHoppers.find(a => a.name == playerDisplayName)
			if (filteredhoppers != undefined) {
				var foundindex = worldHoppers.findIndex(a => a.name == playerDisplayName)
				console.debug(worldHoppers[foundindex]["playtime"])
				console.debug(worldHoppers[foundindex]["joinTime"])
				console.debug(Date.now() - worldHoppers[foundindex]["joinTime"])
				worldHoppers[foundindex]["playtime"] += Date.now() - worldHoppers[foundindex]["joinTime"]
			} else {
				console.log(`${loglv.hey}${selflogL} [WorldHoppers] Skipping undetected join`)
			}
		}


		// When I leave instance
		if (playerDisplayName == currentAccountInUse.name) {
			clearTimeout(worldHopTimeout)
			clearTimeout(loadingAvatarTimer)
			clearTimeout(userTrustTableTimer)
			userTrustTableTimer = null
			loadingAvatarTimer = null
			worldHopTimeout = null
			cooldownUrl = true
			if (G_InstanceClosed == true) {
				if (lastSetUserStatus != `Exploring World Queue`) {
					lastSetUserStatus = ``
					setUserStatus('')
				}
				G_InstanceClosed = false
			}

			if (InstanceHistory.length > 1) {
				InstanceHistory[1].current = false
				InstanceHistory[1].leave_timestamp = Date.now()
				InstanceHistory[1].timeSpent = InstanceHistory[1].leave_timestamp - InstanceHistory[1].join_timestamp
				InstanceHistory = InstanceHistory.filter(ih => (ih.leave_timestamp + 3600_000 > Date.now() && ih.join_timestamp != 0) || ih.current == true)
			}

			oscSend('/avatar/parameters/log/instance_closed', false)
			tonAvgStartWait = []
			let buildLog = `${loglv.info}${selflogL}`
			if (ttvFetchFrom == 1 && urlType == 'twitch') {
				buildLog += ` Resetting Twitch target channel`
				switchChannel(process.env["VRC_ACC_NAME_1"])
				if (lastVideoURL != '') { buildLog += ` &` }
			}
			if (lastVideoURL != '') {
				buildLog += ` Clearing Video-URL history`
				lastVideoURL = ''
				seenVideoURLs = []
			}
			movieShowNameLast = ''
			console.log(buildLog)
		}
	}
}

function eventPlayerAvatarSwitch(logOutputLine) {
	let playerswitching = logOutputLine.split(`Switching `)[1].split(`to avatar `)[0].trim()
	let avatarswitchedto = logOutputLine.split(`to avatar `)[1].trim()

	console.log(`${loglv.info}${selflogL} [AvatarChange]: ${playerswitching} switching to (${avatarswitchedto})`)

	var pruneCheckLength = avatarStatSummary.seenAvatars.filter(a => Date.now() > a.lastAccessed + 60000 && a.wearers.length == 0)
	var pruneLeftover = avatarStatSummary.seenAvatars.filter(a => Date.now() < a.lastAccessed + 60000 || a.wearers.length != 0)
	if (pruneCheckLength.length > 0) {
		avatarStatSummary.seenAvatars = pruneLeftover
		console.log(`${loglv.info}\x1b[0m[\x1b[32mVRC_Log\x1b[0m] [AvatarCache]: Pruning ${pruneCheckLength.length} avatars from memory.`)
	}

	try {
		avatarStatSummary.seenAvatars.filter(a => a.wearers.includes(playerswitching)).map(b => b.wearers.splice(b.wearers.indexOf(playerswitching)))
		avatarStatSummary.seenAvatars.filter(a => a.name == avatarswitchedto)[0].wearers.push(playerswitching)
	} catch (err) {
		avatarStatSummary.seenAvatars.push({ "name": avatarswitchedto, "author": null, "wearers": [playerswitching], "lastAccessed": Date.now() })
	}

	clearTimeout(loadingAvatarTimer)
	loadingAvatarTimer = setTimeout(() => {
		logEmitter.emit('avatarQueueFinish', true)
	}, 10000);
}


function eventAssetDownload(logOutputLine) {
	var assetbundlelog = logOutputLine.split(`[AssetBundleDownloadManager] `)[1]
	// console.log(`${loglv.info}${selflog} [AssetBundleDownloadManager]: ${assetbundlelog}`)

	if (assetbundlelog.includes('Unpacking Avatar')) {
		// console.log(`${loglv.info}${selflog} [AssetBundle]: ${assetbundlelog}`)
		// [AssetBundle]: [593] Unpacking Avatar (Alula v3․48 Basic by 14anthony7095)
		let avatarswitchedto = assetbundlelog.split('Unpacking Avatar (')[1].split(' by ')[0]
		let avatarauthor = assetbundlelog.split('Unpacking Avatar (')[1].split(' by ')[1].slice(0, -1)

		try {
			var assSa = avatarStatSummary.seenAvatars.filter(a => a.name == avatarswitchedto)[0]
			assSa.author = avatarauthor
			console.log(`${loglv.info}\x1b[0m[\x1b[32mVRC_Log\x1b[0m] [AvatarChange]: ${assSa.wearers.toString()} in avatar (${assSa.name} by ${assSa.author})`)
		} catch (err) {
			console.log(`${loglv.info}\x1b[0m[\x1b[32mVRC_Log\x1b[0m] [AvatarFallback]: No Wearer for (${avatarswitchedto} by ${avatarauthor})`)
			avatarStatSummary.seenAvatars.push({ "name": avatarswitchedto, "author": avatarauthor, "wearers": [], "lastAccessed": Date.now() })
		}

		clearTimeout(loadingAvatarTimer)
		loadingAvatarTimer = setTimeout(() => {
			logEmitter.emit('avatarQueueFinish', true)
		}, 10000);
	}

	if (assetbundlelog.includes('Starting download of')) {
		let dlqueue = parseInt(logOutputLine.split(', ')[1].split(' ')[0].trim())
		if (dlqueue >= 1) {
			console.log(`${loglv.info}${selflogL} [AssetBundle]: Download Queue: ${dlqueue}`)
		}
	}
}



var cooldownUrl = false
function videoUrlResolver(videourl) {
	if (lastVideoURL === videourl) { console.log(`${loglv.info}${selflogL} Skipping url, already been displayed.`); return }
	if (seenVideoURLs.includes(videourl)) { console.log(`${loglv.info}${selflogL} Skipping url, is in seen list.`); return }
	if (videourl.includes('media.cdn.furality')) { console.log(`${loglv.info}${selflogL} Skipping url, Furality Content network.`); return }
	/*
	console.log(`${loglv.debug}${selflog}\n	OLD= ${lastVideoURL}\n	NEW= ${videourl}`)
	console.log(`${loglv.debug}${selflog} IS EQUAL? ${lastVideoURL === videourl}`)
	console.log(`${loglv.debug}${selflog} Stringifiy ${JSON.stringify(videourl)}`)
	*/
	lastVideoURL = videourl
	seenVideoURLs.push(videourl)

	if (cooldownUrl == true) { console.log(`${loglv.info}${selflogL} Skipping url, forcing Ratelimit`); return }

	cooldownUrl = true
	setTimeout(() => { cooldownUrl = false }, 5000);

	//	--- Print Video URL ---
	console.log(`${loglv.info}${selflogL} Video URL: ${videourl}`)
	if (ChatVideoURL == true && currentAccountInUse['Agroup'] == true) { oscChatBoxV2(`~VideoURL:\v${fitChars(videourl, 3)}`, 5000, true, true) }

	//	---	Twitch Channel URL Resolver	---
	if (videourl.includes('twitch.tv/') && !videourl.includes('twitch.tv/videos')) {
		//oscSend('/avatar/parameters/ttvEnabled', 1 )
		if (ttvFetchFrom == 1) { switchChannel(videourl.split('twitch.tv/')[1]) }
		if (urlType != 'twitch') {
			console.log(`${loglv.info}${selflogL} Video URL Type set to "Twitch"`)
			urlType = 'twitch'
		}
	}

	//	---	Hyperbeam URL Resolver	---
	if (videourl.includes('hyperbeam.com') && playersInInstance.includes('Chriin')) {
		if (ttvFetchFrom == 1) { switchChannel('sirlarr') }
		if (urlType != 'twitch') {
			console.log(`${loglv.info}${selflogL} Video URL Type set to "Twitch"`)
			urlType = 'twitch'
		}
	}

	//	---	Youtube Title Resolver	---
	if (videourl.includes('youtube.com/')) {
		videourl = 'http://www.youtube.com/' + videourl.split('youtube.com/')[1].split(' ')[0]
	} else if (videourl.includes('youtu.be/')) {
		videourl = 'http://www.youtube.com/watch?v=' + videourl.split('youtu.be/')[1].split(' ')[0]
	}

	var isValidateYTurl = ytdl.validateURL(videourl)
	//console.log(`${loglv.debug}${selflog} yt-dl is validate url? ${isValidateYTurl}`)

	if (isValidateYTurl == true) {
		//if( ttvAlwaysRun == false ){ oscSend('/avatar/parameters/ttvEnabled', 0 ) }

		if (urlType != 'youtube') {
			console.log(`${loglv.info}${selflogL} Video URL Type set to "Youtube"`)
			urlType = 'youtube'
			if (ttvFetchFrom == 1) { switchChannel(process.env["VRC_ACC_NAME_1"]) }
		}
		ytdl.getBasicInfo(videourl)
			.then((data) => {
				setTimeout(() => {
					console.log(`${loglv.info}${selflogL} Video Title: ${data.videoDetails.title}`)
					if (ChatVideoTitle == true && currentAccountInUse['Agroup'] == true) { oscChatBoxV2(`~VideoTitle:\v${fitChars(data.videoDetails.title, 3)}`, 2000, true, true) }
				}, 2000)
			})
			.catch((err) => {
				console.log(`${loglv.warn}${selflogL} Youtube-dl: ${err}`)
				if (ChatVideoURL == true && currentAccountInUse['Agroup'] == true) { oscChatBoxV2(`~${err}`, 2000, true, true, false, false, false) }
			})
	}
}


function worldDownloadProgress(dlduration, dlprogress) {
	var dlETAtotal = 0
	var crossmulti;
	try {
		crossmulti = dlduration * 100
		try { dlETAtotal = Math.floor(crossmulti / whole) }
		catch { dlETAtotal = Math.floor(crossmulti / dlprogress) }
	} catch {
		crossmulti = whole * dlprogress
		dlETAtotal = Math.floor(crossmulti / 100)
	}

	var dlETA = dlETAtotal - dlduration;

	if (dlETAtotal >= 60) {
		min = Math.floor(dlETAtotal / 60);
		sec = Math.floor(dlETAtotal - (min * 60));
		dlETAtotal = min + 'm' + sec + 's';
	} else {
		dlETAtotal = dlETAtotal + 'sec';
	}

	if (dlETA >= 60) {
		min = Math.floor(dlETA / 60);
		sec = Math.floor(dlETA - (min * 60));
		dlETA = min + ' min ' + sec + ' seconds';
	} else {
		dlETA = dlETA + ' seconds';
	}
	console.log(`${loglv.info}${selflogL} World Download ETA ${dlETA}`);
	say.speak(`E T A ${dlETA}`, 'Microsoft Zira Desktop', 1.0, (err) => {
		if (err) { return console.error(`${loglv.warn}${selflogL} say.js error: ` + err) }
		setTimeout(() => {
			isTalking = false
		}, 1000)
	})
}