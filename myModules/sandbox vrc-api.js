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

const vrcFriendsList = [
	"usr_4904f9c3-3ffe-4845-9f1d-86edee5442f4", "usr_4336eb60-5e95-4541-9fcf-3b8da5fc3bea", "usr_ee815921-8067-4486-a3e2-ded009457cf3", "usr_ce4369d7-9b7a-4ff0-8525-53ff6400b9b0", "usr_8963b9ee-815e-4e1f-9a9f-3696e8fd81c6", "usr_67997c8f-2f74-43bf-8ad2-a0c1c3e2c396", "usr_73b07248-81e2-4830-b0fc-bb8297364d22", "usr_2f95d21e-6cb1-4e3b-a692-bf0cbf1b98a8", "usr_10083767-0ce8-4819-8462-5cc606010ed2", "wS0bCRCA2Q", "usr_dd28d6b7-9e03-4f8c-950a-c8a5948bbdd8", "usr_a4c5014d-7ab3-41c1-bf11-5f554439fd29",
	"usr_0713889f-c2f0-48b7-aae4-e5da34f523b9", "usr_3857093d-12d3-492c-804b-d27dd421dff8", "usr_626775f6-4368-40b3-b6f9-1bf33683be24", "usr_4b6e356d-042d-4d40-b550-bd101da8352e", "usr_cde319bf-a5f5-47bb-8e78-5aff9a8cb5e6", "usr_bba4ca7a-5447-4672-828d-0a09d85f854e", "usr_3f072921-f926-4ffa-91f0-74a04838ea5f", "usr_d05302eb-f986-4300-a294-e0286cabc368", "usr_95c31e1e-15c3-4bf4-b8dd-00373124d67a", "usr_34182235-335d-48a7-bd3f-616e343b4d16", "usr_af56363e-1342-4ab1-98b9-62f0e446ab37",
	"usr_8c03d7ce-685a-400d-9a42-eba01c9b8e98", "usr_a3b22558-55b2-4847-982a-d4e3a2bffee5", "usr_469ba82d-a0eb-4938-b199-e773af70c8f9", "usr_ad0aa613-faf2-4386-9c34-2c1f9111a414", "usr_1caf73d5-4028-4c04-913c-f9ff0018670e", "DJuzKVCGUJ", "usr_b436a003-9dd6-4abb-9889-60eb762978b3", "usr_0fc19edf-1eb0-4c60-b0bc-1e84ed0ed3a8", "usr_666496dc-243c-4978-a386-35a738cdfd6b", "usr_d4614a20-60f1-4ddd-ba5e-173e2ddfb428", "usr_9e4832d8-a767-4e65-8625-3a045d723577", "usr_620a2406-9b7b-4014-aeb6-e571dc580baf",
	"usr_868f2607-4240-435f-b115-76fbcb489a4f", "usr_4d8b7274-2866-41f9-9a21-96dbd03ffc32", "usr_7c657a9f-3fc0-4dfd-81f8-aea3e174cefa", "usr_4c2469d6-a236-4a5f-801a-914c9451b349", "usr_f903de19-04ff-43a7-9977-3115ecc312bd", "usr_1e773333-355d-4163-b93d-bd3ec7740a31", "usr_41e9218b-1c8b-4de3-ad2c-cb6f08557922", "usr_d79cf307-8e27-445b-85ef-8e9632217ddd", "usr_eb71327e-9afc-4a7c-accb-dd8ee2b9a882", "usr_d0891533-36dd-4d07-bb89-e1a8e361603d", "usr_4e2b299c-3431-498f-a18e-cfaa5aec489e",
	"usr_ef656ebe-49a5-4626-93dc-aa7113e062f2", "usr_17a53295-03cd-4bc4-b9e3-281cac09e86d", "usr_39a91182-0df7-476e-bc4a-e5d709cca692", "usr_46296ab8-098e-4172-b044-c2d05db720ee", "usr_eda6f031-c4cb-4d3f-8d08-b878ed489d1a", "usr_732ae37f-307f-4a6d-ba1b-f7331cf12cb2", "usr_6f14da99-5083-4313-91ec-b4560477af11", "usr_8e02a5af-7198-4381-b3be-e99682c4f467", "usr_8625697d-766f-4a95-8eaf-ff3edc0c27f0", "usr_74043f8b-2aba-4b74-ba06-d460d11f40b0", "usr_27a3edeb-618d-4216-b2a3-00f9bf5835dc",
	"usr_ca11950e-1b2a-4f55-b6eb-fb411968f14d", "usr_df10c726-a5d8-48c0-8562-fe4c491d0d0b", "usr_de2e68aa-726f-464f-8c64-8a6298f2732f", "usr_7688f6db-10c2-4cde-a7a1-b07e5aa74aab", "usr_381cbc2d-4ead-4d42-8d50-17372a0497c6", "usr_67a65a48-bb54-41c5-93ec-c4de625e8f63", "usr_cfa0d20d-85e1-4d72-ba32-86b5d92c2510", "usr_0ff2e767-bf15-43ef-a4bf-a59c12b2f4f6", "usr_b8489476-54af-4391-86c7-e3722f020ddc", "usr_e86f244d-31ba-4d25-9f82-65b91bf21aee", "usr_73a95799-ecf7-4f37-89c9-46dc0132e707",
	"usr_b28f895f-6145-447e-ae98-1e010264fa8d", "usr_d05ba252-e280-4b20-8cd6-b86702677bf4", "usr_92274ca5-7efd-45f2-9505-2b458dd52e72", "usr_b4dc18cf-cd76-4e42-9821-20e9b0329506", "usr_65e830b6-f4c5-443d-be5e-f0189e79a4dc", "usr_f9cd6884-f10a-4787-b3ca-f187617d2a00", "usr_bd13db3a-d070-4fc6-8d80-098e15f89785", "usr_542b963e-dafb-4706-841a-34ea0c543bb0", "usr_d223d957-8e54-4621-aa19-48ebd8d54d42", "usr_e782d702-4d9b-41d2-b9f4-c6e696724ecc", "usr_6cb936bb-afb8-4e51-a802-f3fb631773af",
	"usr_f020c221-21bb-454d-9b3c-f73cd516743c", "usr_f5cf9730-b7f4-4a8e-8aa0-3f72bba1d054", "usr_39b5a285-6035-43ed-864c-3c967b8b69c3", "usr_75669630-2851-470e-8972-fc2f52f5b746", "usr_d3f2b55b-df07-4584-98c8-d162f2340744", "usr_73fafbef-1f6a-4aa3-9507-5e4c907fc743", "usr_fafcf782-7468-45b2-b00c-25d5bba3e1dd", "usr_60b263b7-77f7-4792-ba7b-296b11144cd0", "usr_42e46e78-70ae-4d3f-8a1e-504e041ca1a7", "usr_63c23aac-6d1e-4030-accf-a48731cdd069", "usr_fe203d3a-8098-4dc8-ac73-46cb5e9393ec",
	"usr_3aa2ab45-8070-4241-a78c-d73820f974d9", "usr_e19b4163-b877-43a1-a65d-2e84d4496964", "usr_7725e9ee-b8f5-4aea-9ded-989931597887", "usr_90e511a6-ffb9-4e19-a232-93c9bf0b3605", "usr_3ed5706f-8278-4bc4-9913-44e271ea32cb", "usr_db6b86b5-19ba-4a3d-ab92-e698c8baef1f", "usr_e7ec6241-cdfa-44c9-a955-97bfb4744158", "usr_a6284483-de0d-4533-b097-c52e6c5841ca", "usr_e70c5f32-e658-46ee-ad9d-3b9cabeee68d", "usr_4c09e232-19e5-4f15-8204-561bbe010a2d", "usr_29cb2349-c411-417a-8ac8-420c0a4faee6",
	"usr_c80bb859-7945-4f67-9978-e1142b265295", "usr_01cef8fa-0d04-4f39-9029-61090249ee1f", "usr_4ba82dee-9b54-4db6-91e3-1281391d8a00", "usr_fde4aec7-b117-494a-8bd7-0f65243ef2c9", "usr_59f5b4c9-c508-4bda-955d-36beffda015d", "usr_fc35c588-89fe-4f12-a6f5-0e4806b2f6a9", "usr_eea68662-9e36-40ab-a511-4938f5c7e354", "usr_bc82e5ec-59ce-45a2-b1c7-cc7bed5ccafc", "usr_8ca9d7c4-3928-45dc-bf06-c56c1795b408", "usr_ff51aa47-78e7-4eb1-b108-ed9ae73cc07b", "usr_782ae9f4-101c-4f8f-b619-88ce42cb34a5",
	"usr_ea9fc290-d6d6-44b9-9477-8553a007d276", "usr_b0a081c1-ef49-4bda-b21a-d4bda6d6830a"
]

main()
const myVrcID = 'usr_e4c0f8e7-e07f-437f-bdaf-f7ab7d34a752';
var authToken = ''
async function main() {
	try {
		const { data: currentUser } = await limiter.req(vrchat.getCurrentUser({ throwOnError: true }))
		console.log(`${loglv.info}${selflog} Logged in as: ${currentUser.displayName}`);
		const { data: auth } = await limiter.req(vrchat.verifyAuthToken())
		if (auth.ok == true) {
			authToken = auth.token
		}
	} catch (error) {
		console.log(`${loglv.warn}${selflog} API is down.. Cry`)
		isApiErrorSkip = true
	}


	// console.log(await manualCall('avatarparts/avp_8f6bb9b7-4875-4b72-95d1-5cd3c2fb1dd2', 'GET'))


	// for (const item in vrcFriendsList.friends) { var res = await limiter.req(vrchat.getUser({ 'path': { 'userId': vrcFriendsList.friends[item] } })); res.data.discordId != undefined ? console.log(`${res.data.displayName} - ${res.data.discordId}`) : '' }

	// await sleep(10000)

	// Get pending group join requests
	// Get pending group join requests
	// var gotReqJoinGroups = await limiter.req(vrchat.getUserGroupRequests({ 'path': { 'userId': myVrcID } })); console.log(gotReqJoinGroups.data)

	/* 	var gotUserGroupInstances = await vrchat.getUserGroupInstances({ 'path': { 'userId': process.env['VRC_ACC_ID_1'] } })
		if (gotUserGroupInstances.data != undefined) {
			var src = gotUserGroupInstances.data.instances.filter(f => f.closedAt == null || (f.closedAt != null && f.closedAt > Date.now()) || f.queueEnabled == true)
			console.log(src)
		} */


	// outputPropsData()

	// await foundMemberMutualGroups('grp_43fe21c7-0b51-4ff4-80ed-23b73aa0c13e', undefined, undefined, true, false)

	// var gi = await vrchat.getWorld({ 'path': { 'worldId': 'wrld_0c3caeaa-7224-4800-aa64-bc473ccb18a2' } }); console.log(gi.data)

	// scanGroupAuditLogs()

	// searchForAntiFlightWorlds()

	// auditViewGroups('group-audit-view')
	// auditViewGroups('group-members-viewall')

	// Get Feedback Reports
	// Get Feedback Reports
	// var gModr = await limiter.req(vrchat.getModerationReports({ 'query': { 'reportingUserId': myVrcID, 'n': 100, 'offset': 0 } }));
	// var reportedAvatars_array = gModr.data.results.filter((f) => { return f.type == 'avatar' }).map((m)=>{return m.contentId });	console.log(reportedAvatars_array)

}

async function manualCall(vrcapiEndpoint, methodType = 'GET', bodyJson) {
	return new Promise(async (resolve, reject) => {
		const vrcapihttp = `https://api.vrchat.cloud/api/1/`

		var apiRequest = {
			method: methodType,
			headers: { 'User-Agent': '14anthony7095/Curl', 'Cookie': 'auth=' + authToken },
		}
		if (bodyJson != undefined) {
			apiRequest['body'] = JSON.stringify(bodyJson)
			apiRequest['headers']['Content-Type'] = 'application/json'
		}

		var request = await fetch(vrcapihttp + '' + vrcapiEndpoint, apiRequest)
		// console.log(request)
		var jsonResponse = await request.json()
		resolve(jsonResponse)
	})
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






// setInterval(() => { console.log('30s') }, 30_000);

