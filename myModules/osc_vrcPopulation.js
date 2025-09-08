/*
-------------------------------------

	VRChat Population

-------------------------------------
*/
//	--	Libraries	--
var { loglv, playerCounter, graphTimeRangeMinutes } = require('./config.js');
const { oscSend, oscEmitter } = require('./Interface_osc_v1.js');
const { getVisitsCount } = require('./Interface_vrc-Api.js')


//	--	Global Vars	--
let selfLog = `\x1b[0m[\x1b[36mCounter\x1b[0m]`
var isActive = false
var counterTimer


console.log(`${loglv().log}${selfLog} Loaded -> ${loglv(playerCounter)}${playerCounter}${loglv().reset}`)


function start() {
	isActive = true
	console.log(`${loglv().log}${selfLog} Starting..`)
	
	getVisitsCount().then(count=>{ workload(count, count) }).catch((err)=>{ workload(0, 'Lost Connection') })
	
	counterTimer = setInterval(() => {
		getVisitsCount().then(count=>{ workload(count, count) }).catch((err)=>{ workload(0, 'Lost Connection') })
	}, 10000)
}
start()


function stop() {
	isActive = false
	console.log(`${loglv().log}${selfLog} Stopping.`)
	clearInterval(counterTimer)
}


function toBinary(dec) { return (parseInt(dec) >>> 0).toString(2).padStart(4, '0') }


function counterAddressData(addr, data, clearChar = false) {
	let a1 = toBinary(addr)[3]
	let a2 = toBinary(addr)[2]
	let a4 = toBinary(addr)[1]
	let a8 = toBinary(addr)[0]
	let d1 = toBinary(data)[3]
	let d2 = toBinary(data)[2]
	let d4 = toBinary(data)[1]
	let d8 = toBinary(data)[0]
	if (clearChar == true) { d1 = 0; d2 = 1; d4 = 0; d8 = 1 }

	oscSend('/avatar/parameters/counter/CountAddr_x8', 1 == a8)
	oscSend('/avatar/parameters/counter/CountAddr_x4', 1 == a4)
	oscSend('/avatar/parameters/counter/CountAddr_x2', 1 == a2)
	oscSend('/avatar/parameters/counter/CountAddr_x1', 1 == a1)
	oscSend('/avatar/parameters/counter/CountData_x8', 1 == d8)
	oscSend('/avatar/parameters/counter/CountData_x4', 1 == d4)
	oscSend('/avatar/parameters/counter/CountData_x2', 1 == d2)
	oscSend('/avatar/parameters/counter/CountData_x1', 1 == d1)
}


function wait(seconds){
	return new Promise((resolve,reject)=>{
		setTimeout(()=>{ resolve(true) },seconds*1000)
	})
}


async function workload(playerCount) {

	// console.log(`${loglv().debug}${selfLog} count ${playerCount}`)
	

	oscSend('/avatar/parameters/counter/Count_RefreshTimer', true)
	counterAddressData(1, playerCount.toString().padStart(6, '0')[5], false)
	await wait(0.2)
	
	oscSend('/avatar/parameters/counter/Count_RefreshTimer', false)
	if (playerCount.toString().padStart(6, '0') < 10) {
		counterAddressData(2, 10, true)
	} else {
		counterAddressData(2, playerCount.toString().padStart(6, '0')[4], false)
	}
	await wait(0.2)

	if (playerCount.toString().padStart(6, '0') < 100) {
		counterAddressData(3, 10, true)
	} else {
		counterAddressData(3, playerCount.toString().padStart(6, '0')[3], false)
	}
	await wait(0.2)

	if (playerCount.toString().padStart(6, '0') < 1000) {
		counterAddressData(4, 10, true)
	} else {
		counterAddressData(4, playerCount.toString().padStart(6, '0')[2], false)
	}
	await wait(0.2)

	if (playerCount.toString().padStart(6, '0') < 10000) {
		counterAddressData(5, 10, true)
	} else {
		counterAddressData(5, playerCount.toString().padStart(6, '0')[1], false)
	}
	await wait(0.2)

	if (playerCount.toString().padStart(6, '0') < 100000) {
		counterAddressData(6, 10, true)
	} else {
		counterAddressData(6, playerCount.toString().padStart(6, '0')[0], false)
	}
	await wait(0.2)
	counterAddressData(0, 0)
}