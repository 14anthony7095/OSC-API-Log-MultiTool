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
const { ratelimitHandler } = require("./ratelimitHandler.cjs");
const limiter = new ratelimitHandler()
require('dotenv').config({ 'quiet': true })

let selflog = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
let selflogA = `\x1b[0m[\x1b[33mVRC_API\x1b[0m]`
console.log(`${loglv.info}${selflog} Loaded`)

var vrchat = new VRChat({ application: { name: "Api-Osc-Interface_DEV", version: "1.2-DEV", contact: process.env["CONTACT_EMAIL"] }, authentication: { credentials: { username: process.env["VRC_ACC_LOGIN_1"], password: process.env["VRC_ACC_PASSWORD_1"], totpSecret: process.env["VRC_ACC_TOTPSECRET_1"] } }, keyv: new KeyvFile({ filename: "./datasets/vrcA.json" }) });
var isApiErrorSkip = false



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


main()
const myVrcID = 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752';
async function main() {
	try {
		const { data: currentUser } = await vrchat.getCurrentUser({ throwOnError: true })
		console.log(`${loglv.info}${selflog} Logged in as: ${currentUser.displayName}`);
	} catch (error) { if (error.statusCode == 500) { isApiErrorSkip = true }; return }

	/* 
		for (const item in vrcFriendsList.friends) {
			var res = await vrchat.getUser({ 'path': { 'userId': vrcFriendsList.friends[item] } })
			res.data.discordId != undefined ? console.log(`${res.data.displayName} - ${res.data.discordId}`) : ''
		}
	*/
	// await sleep(10000)

	// Get pending group join requests
	// Get pending group join requests
	// var gotReqJoinGroups = await limiter.req(vrchat.getUserGroupRequests({ 'path': { 'userId': myVrcID } }));    console.log(gotReqJoinGroups.data)


	// outputPropsData()

	// await foundMemberMutualGroups('grp_43fe21c7-0b51-4ff4-80ed-23b73aa0c13e', undefined, undefined, true, false)

	// var gi = await vrchat.getWorld({ 'path': { 'worldId': 'wrld_0c3caeaa-7224-4800-aa64-bc473ccb18a2' } }); console.log(gi.data)

	// scanGroupAuditLogs()

	// searchForAntiFlightWorlds()

	// auditViewGroups('group-audit-view')
	// auditViewGroups('group-members-viewall')

	// Get Feedback Reports
	// Get Feedback Reports
	// var gModr = await limiter.req(vrchat.getModerationReports({ 'query': { 'reportingUserId': myVrcID, 'n': 100, 'offset': 0 } }));    console.log(gModr.data)

}

async function outputPropsData() {
	fs.readFile('./datasets/propcounts.json', 'utf8', async (err, data) => {
		if (err) { console.error(err) }

		var propData = []
		var partpropids = Object.keys(JSON.parse(data))
		for (const item in partpropids) {
			var gotProp = await limiter.req(vrchat.getProp({ 'path': { 'propId': 'prop_' + partpropids[item] } }))
			if (gotProp.data != undefined) {
				if (gotProp.data.itemTemplate != undefined) {
					var gotInvTemplate = await limiter.req(vrchat.getInventoryTemplate({ 'path': { 'inventoryTemplateId': gotProp.data.itemTemplate } }))
					if (gotInvTemplate.data != undefined) { gotProp.data.itemTemplate = gotInvTemplate.data }
				}
				gotProp.data.unityPackages = []
				console.log(gotProp.data)
				propData.push(gotProp.data)
			}
		}
		fs.writeFile('./output_props.json', JSON.stringify(propData), (err) => { if (err) { console.error(err) } })
	})
}

async function searchForAntiFlightWorlds() {
	var sw1 = await limiter.req(vrchat.searchWorlds({ 'query': { 'n': 100, 'tag': 'admin_disable_avatar_collision' } }))
	var sw2 = await limiter.req(vrchat.searchWorlds({ 'query': { 'n': 100, 'tag': 'admin_disable_avatar_stations' } }))
	console.log('admin_disable_avatar_collision', sw1.data.map((e) => { return e.name }))
	console.log('admin_disable_avatar_stations', sw2.data.map((e) => { return e.name }))
}

async function auditViewGroups(permissionSearch = 'group-audit-view') {
	var userAllGroupPermissions = await limiter.reqCached('groupperms', myVrcID, true).catch(async () => {
		return await limiter.req(vrchat.getUserAllGroupPermissions({ 'path': { 'userId': myVrcID } }), 'groupperms', myVrcID)
	})
	var groupWithAuditViewPermission = Object.keys(Object.fromEntries(Object.entries(userAllGroupPermissions.data).filter(([key, value]) => value.includes(permissionSearch) || value.includes('*'))))
	var logString = `Groups with ${permissionSearch} permission`
	for (const group in groupWithAuditViewPermission) {
		// console.log(`Fetching`,groupWithAuditViewPermission[group])
		var gotGroup = await limiter.reqCached('group', groupWithAuditViewPermission[group]).catch(async () => {
			return await limiter.req(vrchat.getGroup({ 'path': { 'groupId': groupWithAuditViewPermission[group] } }), 'group')
		})
		logString += `\n${gotGroup.data.id} - ${gotGroup.data.name}`
	}
	console.log(logString, '\n')
}



async function sleep(timeMS) { return new Promise((resolve, reject) => { setTimeout(() => { resolve('done') }, timeMS) }) }
async function foundMemberMutualGroups(groupID, membersOverride, membersIDs, writeCSV = true, checkMutualFriends = false) {
	return new Promise(async (resolve, reject) => {
		var members = []
		var chkMembers = []
		var groups = []
		const sleeptime = 200
		fs.readFile('datasets/groupMembers-mutualGroups.json', (err, data) => {
			if (err) { console.error(err) }
			if (data.length != 0) { groups = JSON.parse(data).groups; chkMembers = JSON.parse(data).members }
		})

		// Get current group's members
		console.log('[API] Fetching Group')
		if (groupID == undefined) {
			console.log(`[14A] No group specified`)
			if (membersOverride != undefined) {
				console.log(`[14A] Using member override`)
				members = membersOverride
			} else {
				console.log(`[14A] Using member id list`)
				for (const id in membersIDs) {
					console.log(`[API][${id}/${membersIDs.length - 1}][${Math.round(id / (membersIDs.length - 1) * 100)}%] Fetching user ${membersIDs[id]}`)
					if (!chkMembers.includes(membersIDs[id])) {
						var gotUser = await limiter.reqCached('user', membersIDs[id]).catch(async () => {
							return await limiter.req(vrchat.getUser({ 'path': { 'userId': membersIDs[id] } }), 'user')
						})
						console.log(`[API] Got user ${gotUser.data.displayName}`)

						if (!chkMembers.includes(gotUser.data.displayName)) {
							if (checkMutualFriends == true) {
								var gotMutuals = await limiter.reqCached('mutualFriends', membersIDs[id], true).catch(async () => {
									return await limiter.req(vrchat.getMutualFriends({ 'path': { 'userId': membersIDs[id] } }), 'mutualFriends', membersIDs[id])
								})

								members.push({
									'id': gotUser.data.id,
									'name': gotUser.data.displayName,
									'mutualfriends': gotMutuals.data.map(m => m.displayName)
								})
							} else {
								members.push({
									'id': gotUser.data.id,
									'name': gotUser.data.displayName
								})
							}
						}
					}
					await sleep(sleeptime * limiter.delayMulti)
				}
			}
		} else {
			var gotGroup = await limiter.reqCached('group', groupID).catch(async () => {
				return await limiter.req(vrchat.getGroup({ 'path': { 'groupId': groupID } }), 'group')
			})
			console.log(`[API] Found ${gotGroup.data.name} with ${gotGroup.data.memberCount} members`)

			var forAmount = new Array(1 + Math.floor(gotGroup.data.memberCount / 100)).fill(0)
			console.log(forAmount)
			for (const i in forAmount) {
				console.log(`${loglv.info}[API][${i}/${forAmount.length - 1}][${Math.round(i / (forAmount.length - 1) * 100)}%] Fetching GroupMembers offset ${i * 100}`)
				var groupMembers = await limiter.req(vrchat.getGroupMembers({ 'path': { 'groupId': groupID }, 'query': { 'n': 100, 'offset': i * 100 } }))
				if (groupMembers.data == undefined || groupMembers.data == []) {
					fs.writeFile('datasets/groupMembers-mutualGroups.json', JSON.stringify({ 'groups': groups, 'members': chkMembers }), (err) => { if (err) { console.error(err) } })
					continue
				}
				console.log(`${loglv.info}[API] Found ${groupMembers.data.length} members`)

				for (const memberIndex in groupMembers.data) {
					// console.log(`[API] Member: ${groupMembers.data[memberIndex].user.displayName}`)
					if (groupMembers.data[memberIndex].user == undefined) { continue }
					if (!chkMembers.includes(groupMembers.data[memberIndex].user.displayName)) {
						if (checkMutualFriends == true) {
							var gotMutuals = await limiter.reqCached('mutualFriends', groupMembers.data[memberIndex].user.id).catch(async () => {
								return await limiter.req(vrchat.getMutualFriends({ 'path': { 'userId': groupMembers.data[memberIndex].user.id } }))
							})

							members.push({
								'id': groupMembers.data[memberIndex].user.id,
								'name': groupMembers.data[memberIndex].user.displayName,
								'mutualfriends': gotMutuals.data.map(m => m.displayName)
							})
						} else {
							members.push({
								'id': groupMembers.data[memberIndex].user.id,
								'name': groupMembers.data[memberIndex].user.displayName
							})
						}
					}
				}
				await sleep(1500 * limiter.delayMulti)
			}
		}


		console.log(`${loglv.info}Switching to Members' Groups - Pausing for 5secs`)
		await sleep(10000)

		// Get each member's group list
		for (const memberIndex in members) {
			console.log(`${loglv.info}[API][${memberIndex}/${members.length - 1}][${Math.round(memberIndex / (members.length - 1) * 100)}%] Fetching Groups for ${members[memberIndex].name}`)
			var userGroups = await limiter.reqCached('UserGroups', members[memberIndex].id, true).catch(async () => {
				return await limiter.req(vrchat.getUserGroups({ 'path': { 'userId': members[memberIndex].id } }), 'UserGroups', members[memberIndex].id, 5)
			})
			if (userGroups.data == undefined || userGroups.data == []) {
				fs.writeFile('datasets/groupMembers-mutualGroups.json', JSON.stringify({ 'groups': groups, 'members': chkMembers }), (err) => { if (err) { console.error(err) } })
				continue
			}
			console.log(`${loglv.info}[API] Found ${userGroups.data.length} groups`)

			let cntCreated = 0
			let cntAdds = 0
			let cntDupes = 0
			for (const groupIndex in userGroups.data) {
				// console.log(`[MEM] Checking if group is in cache`)
				var foundGroup = groups.find(e => e.id == userGroups.data[groupIndex].groupId)
				if (foundGroup == undefined) {
					cntCreated++
					// console.log(`[MEM] Creating ${userGroups.data[groupIndex].name}`)
					// console.log(`[MEM] Adding ${members[memberIndex].name} to ${userGroups.data[groupIndex].name}`)
					groups.push({ 'name': userGroups.data[groupIndex].name, 'members': [members[memberIndex].name], 'id': userGroups.data[groupIndex].groupId })
				} else {
					cntAdds++
					// console.log(`[MEM] Adding ${members[memberIndex].name} to ${foundGroup.name} [Users: ${foundGroup.members.length}]`)
					if (!groups[groups.indexOf(foundGroup)].members.includes(members[memberIndex].name)) {
						groups[groups.indexOf(foundGroup)].members.push(members[memberIndex].name)
					} else {
						cntDupes++
					}
				}
			}
			console.log(`${loglv.info}[MEM] Added ${cntAdds} | Created ${cntCreated} | Dupes? ${cntDupes}`)
			chkMembers.push(members[memberIndex].name)
			await sleep(sleeptime * limiter.delayMulti * 2)
		}

		if (writeCSV == true) {
			var stringToWrite = ``
			console.log(groups)
			groups.sort((a, b) => { return b.members.length - a.members.length }).filter(f => f.members.length >= 2).forEach(gr => {
				stringToWrite += `${stringToWrite.length == 0 ? '' : '\n'}"${gr.name}","${gr.members.toString().replaceAll(',', '","')}"`
			})
			members.filter(f => f.mutualfriends?.length >= 1).forEach(mm => {
				stringToWrite += `${stringToWrite.length == 0 ? '' : '\n'}"${mm.name}","${mm.mutualfriends.toString().replaceAll(',', '","')}"`
			})

			console.log(stringToWrite)
			fs.writeFile('./datasets/output_memberMutualGroups.csv', stringToWrite, (err) => { if (err) { console.err(err) } })
		}
		fs.writeFile('datasets/groupMembers-mutualGroups.json', JSON.stringify({ 'groups': groups, 'members': chkMembers }), (err) => {
			if (err) { console.error(err) }
			resolve(true)
		})
	})
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
	let res = await limiter.req(vrchat.getFile({ 'path': { 'fileId': fileid, 'versionId': fileversion } })); console.log(res)
	let res2 = await limiter.req(vrchat.getFileAnalysisSecurity({ 'path': { 'fileId': fileid, 'versionId': fileversion } })); console.log(res2)
}
// fileCheck('file_c34d0d63-ce1b-4b1c-ae2d-9c52f2ace478',30)



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

