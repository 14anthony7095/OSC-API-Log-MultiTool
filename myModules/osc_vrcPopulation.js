/*
-------------------------------------

	VRChat Population

-------------------------------------
*/
//	--	Libraries	--
var { loglv, playerCounter, graphTimeRangeMinutes } = require('./config.js');
const { oscSend, oscEmitter, OSCDataBurst } = require('./Interface_osc_v1.js');
const { getVisitsCount, apiEmitter } = require('./Interface_vrc-Api.js')


//	--	Global Vars	--
let selflog = `\x1b[0m[\x1b[36mCounter\x1b[0m]`
var isActive = false
var isWorlding = false
var counterTimer
var worldTimer


console.log(`${loglv().log}${selflog} Loaded -> ${loglv(playerCounter)}${playerCounter}${loglv().reset}`)


function start() {
	isActive = true
	console.log(`${loglv().log}${selflog} Starting..`)

	getVisitsCount().then(count => {
		// console.log(`setting 13 to 0`)
		OSCDataBurst(13, parseFloat(0))
		workload(count)

	}).catch((err) => { workload(0, 'Lost Connection') })

	counterTimer = setInterval(() => {
		getVisitsCount().then(count => {
			// console.log(`setting 13 to 0`)
			OSCDataBurst(13, parseFloat(0))
			workload(count)
		}).catch((err) => { workload(0, 'Lost Connection') })
	}, 10000)
}
start()


function stop() {
	if (isActive == true) {
		isActive = false
		console.log(`${loglv().log}${selflog} Stopping.`)
	}
	clearInterval(counterTimer)
	counterTimer = null
}

var worldcount_mem = 0
apiEmitter.on('switch', (data, type) => {
	/* if (data >= 1 && type == 'population') {
		stop()
		if (isWorlding == false) {
			isWorlding = true
			worldcount_mem = data
			// console.log(`setting 13 to true`)
			OSCDataBurst(13, parseFloat(1))
			workload(worldcount_mem)
			worldTimer = setInterval(() => {
				// console.log(`setting 13 to true`)
				OSCDataBurst(13, parseFloat(1))
				workload(worldcount_mem)
			}, 10000)
		} else if (isWorlding == true) {
			worldcount_mem = data
		}
	} else  */
	if (data >= 1) {
		stop()
		if (isWorlding == false) {
			isWorlding = true
			worldcount_mem = data
			// console.log(`setting 13 to true`)
			OSCDataBurst(13, parseFloat(1))
			workload(worldcount_mem)
			worldTimer = setInterval(() => {
				// console.log(`setting 13 to true`)
				OSCDataBurst(13, parseFloat(1))
				workload(worldcount_mem)
			}, 10000)
		} else if (isWorlding == true) {
			worldcount_mem = data
		}
	} else {
		isWorlding = false
		start()
		clearInterval(worldTimer)
		worldTimer = null
	}
})




// function toBinary(dec) { return (parseInt(dec) >>> 0).toString(2).padStart(4, '0') }

// function wait(seconds) { return new Promise((resolve, reject) => { setTimeout(() => { resolve(true) }, seconds * 1000) }) }


async function workload(playerCount) {

	/* 	
VRO: 1 2 3 4 5 6
INS: 7 8 / 9 10
INF: 11 %

ADDR	Int 0-255
DATA	Int 0-255 (remap to -1 to 1 Float)

Int Double DATA handling
  _0 = 0
  _1 = 1
  _9 = 9
  10 = 10
  11 = 11
  99 = 99
  00 = 100
  01 = 101
  09 = 109  
  0_ = 200
  9_ = 209
  __ = 255
 */

	/*
	OSCDataBurst(7, playersInInstance.length > 80 ? 80 : playersInInstance.length)
	playerHardLimit < 10 ? OSCDataBurst(8, (playerHardLimit > 80 ? 80 : playerHardLimit) + 200) : OSCDataBurst(8, playerHardLimit > 80 ? 80 : playerHardLimit)
	OSCDataBurst(9, parseFloat(playerRatio))
	*/

	let digitSeg = playerCount.toString().padStart(6, '0')
	let digitLen = playerCount.toString().length
	digitLen == 6 ? OSCDataBurst(1, parseInt(digitSeg[0]) / 10) : OSCDataBurst(1, parseFloat(1))
	digitLen >= 5 ? OSCDataBurst(2, parseInt(digitSeg[1]) / 10) : OSCDataBurst(2, parseFloat(1))
	digitLen >= 4 ? OSCDataBurst(3, parseInt(digitSeg[2]) / 10) : OSCDataBurst(3, parseFloat(1))
	digitLen >= 3 ? OSCDataBurst(4, parseInt(digitSeg[3]) / 10) : OSCDataBurst(4, parseFloat(1))
	digitLen >= 2 ? OSCDataBurst(5, parseInt(digitSeg[4]) / 10) : OSCDataBurst(5, parseFloat(1))
	digitLen >= 1 ? OSCDataBurst(6, parseInt(digitSeg[5]) / 10) : OSCDataBurst(6, parseFloat(1))


	



}