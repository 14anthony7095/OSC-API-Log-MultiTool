/*
-------------------------------------

	VRChat Population

-------------------------------------
*/
//	--	Libraries	--
var { loglv, playerCounter, graphTimeRangeMinutes } = require('./config.js');
const { oscSend, oscEmitter, OSCDataBurst } = require('./Interface_osc_v1.js');
const { getVisitsCount } = require('./Interface_vrc-Api.js')


//	--	Global Vars	--
let selfLog = `\x1b[0m[\x1b[36mCounter\x1b[0m]`
var isActive = false
var counterTimer


console.log(`${loglv().log}${selfLog} Loaded -> ${loglv(playerCounter)}${playerCounter}${loglv().reset}`)


function start() {
	isActive = true
	console.log(`${loglv().log}${selfLog} Starting..`)

	getVisitsCount().then(count => { workload(count) }).catch((err) => { workload(0, 'Lost Connection') })

	counterTimer = setInterval(() => {
		getVisitsCount().then(count => { workload(count) }).catch((err) => { workload(0, 'Lost Connection') })
	}, 10000)
}
// start()


function stop() {
	isActive = false
	console.log(`${loglv().log}${selfLog} Stopping.`)
	clearInterval(counterTimer)
}


// function toBinary(dec) { return (parseInt(dec) >>> 0).toString(2).padStart(4, '0') }

// function wait(seconds) { return new Promise((resolve, reject) => { setTimeout(() => { resolve(true) }, seconds * 1000) }) }


function workload(playerCount) {

	/* 	
VRO: 1 2 3 4 5 6
	VRO%bar reset on ADDR 1
INS: 7 / 8
INF: 9 %

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

	let digitSeg = playerCount.toString().padStart(6, '0')
	let digitLen = playerCount.toString().length
	digitLen == 6 ? OSCDataBurst(1, digitSeg[0] ) : OSCDataBurst(1, 10 )
	digitLen == 5 ? OSCDataBurst(2, digitSeg[1] ) : OSCDataBurst(2, 10 )
	digitLen == 4 ? OSCDataBurst(3, digitSeg[2] ) : OSCDataBurst(3, 10 )
	digitLen == 3 ? OSCDataBurst(4, digitSeg[3] ) : OSCDataBurst(4, 10 )
	digitLen == 2 ? OSCDataBurst(5, digitSeg[4] ) : OSCDataBurst(5, 10 )
	digitLen == 1 ? OSCDataBurst(6, digitSeg[5] ) : OSCDataBurst(6, 10 )

}