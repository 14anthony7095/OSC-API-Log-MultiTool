const { loglv } = require('./config.js');
const { cmdEmitter } = require('./input.js');
const { oscEmitter, OSCDataBurst, oscSend } = require('./Interface_osc_v1.js');
const WebSocket = require('ws');
const { PiShockAll } = require('./Interface_PS.js');
let selfLog = `\x1b[0m[\x1b[31mHeart-Rate Monitor\x1b[0m]`
console.log(`${loglv().log}${selfLog} Loaded`)
require('dotenv').config()

var hrmRandomizer;
var hrmLinar;
cmdEmitter.on('cmd',(cmd,args,raw)=>{
	if( cmd == 'help' ){ console.log(`${selfLog}
-	heart random [true/false]
-	heart set [num]`) }
	if( cmd == 'heart' && args[0] == 'random' ){
		if( args[1] == 'true' ){
			hrmRandomizer = setInterval(()=>{
				var randrate = Math.floor( Math.random() * 254 )
				console.log(`${loglv().log}${selfLog} BPM: ${randrate}` )
				// OSCDataBurst(15, parseFloat( randrate / 255 - 1 ), 0, 0, 0, false )
				oscSend('/avatar/parameters/Float/HeartRate_BPM', parseFloat( randrate / 255 - 1 ) )
				console.log(`${loglv().log}${selfLog} OSC Data: ${parseFloat( randrate / 255 - 1 )}` )
			},2000)
		}
		if( args[1] == 'false' ){ clearInterval(hrmRandomizer) }
	}
	if( cmd == 'heart' && args[0] == 'linar' ){
		if( args[1] == 'true' ){
			for (let index = 0; index <= 254; index++) {
				setTimeout(() => {
					oscSend('/avatar/parameters/Float/HeartRate_BPM', parseFloat( index / 255 - 1 ) )
				}, 100*index);
			}
			hrmLinar = setInterval(()=>{
				for (let index = 0; index <= 254; index++) {
					setTimeout(() => {
						oscSend('/avatar/parameters/Float/HeartRate_BPM', parseFloat( index / 255 - 1 ) )
					}, 100*index);
				}
			},25400)
		}
		if( args[1] == 'false' ){ clearInterval(hrmLinar) }		
	}
	if( cmd == 'heart' && args[0] == 'set' ){
		clearInterval(hrmRandomizer)
		oscSend('/avatar/parameters/Float/HeartRate_BPM', parseFloat( args[1] / 255 - 1 ) )
	}
})

var wsopenned = false
function start() {
	if( wsopenned == false ){
		console.log(`${loglv().log}${selfLog} Starting..`)		
		openWebSocket()
	}else if( wsopenned == true ){
		console.log(`${loglv().log}${selfLog} WS is already running, continuing to use last session.`)
	}
}



function stop() {
	isActive = false
	console.log(`${loglv().log}${selfLog} Stopping, but will continue to run in background until crashes`)
}
var lastbpm = 0
var lastbpmUpdate = 0
var reconDelay;
function openWebSocket() {
	const ws = new WebSocket(process.env["PULSOID_WSS"])
	ws.on('open', e =>{
		wsopenned = true
		console.log(`${loglv().log}${selfLog} WebSocket Connection Open to PULSOID`)
		ws.on('message', ev => {
			const data = JSON.parse(ev)
			const Heartrate = {

			}
			if( lastbpm != data.data.heartRate ){
				// - 1 minute cooldown for Logging to console window
				if(Date.now() > lastbpmUpdate+60_000){
					lastbpmUpdate = Date.now()
					console.log(`${loglv().log}${selfLog} BPM: ${data.data.heartRate}` )
				}

				// - Shock me if Heartrate below Threshold
				// if( parseInt(data.data.heartRate) <= 50 ){ PiShockAll(30,3) }
				
				oscSend('/avatar/parameters/Float/HeartRate_BPM', parseFloat( data.data.heartRate / 255 - 1 ) )
				
				// - DataBurst Multiplex alt
				// OSCDataBurst(15, parseFloat( data.data.heartRate / 255 - 1 ), 0, 0, 0, false )
			}
			lastbpm = data.data.heartRate
		})
	})
	ws.on('close', e =>{
		console.log(`${loglv().hey}${selfLog} [PULSOID] Device Lost Connection.. Reconnecting in 60sec`)
		wsopenned = false
		if( isActive == true ){
			reconDelay = setTimeout(()=>{
				openWebSocket()
			},60_000)
		}
	})
	ws.on('error', (error) => {
		console.log(`${loglv().warn}${selfLog} [PULSOID] ${error}`)
		wsopenned = false
		clearTimeout(reconDelay)
		ws.close()
	})
}

var isActive = false
var supportedAvatars = ['avtr_3de07f88-5838-4d53-a732-991287dea363','avtr_0c97e918-23d0-4934-b364-5fd28fb10236','avtr_5c866609-f49a-4867-ac74-5dab03d5d713','avtr_6865ad14-dfcb-4285-8e3d-1674ed655722','avtr_9d2264c9-0524-44eb-a6da-712b9306e04d','avtr_7c561c55-9225-400a-899e-7300f44ca545','avtr_e1dbdac0-0a9e-42f0-aeef-bb2d4ef27bc1','avtr_430f03d7-8ae4-4d0f-afa4-f70ecc2e2555','avtr_7368d5ea-67cb-41fa-80f0-34c9fed6bc39']
oscEmitter.on('osc', (address, value) => {
	if( address == '/avatar/change' ){
		if( isActive == false && supportedAvatars.includes(value) ){
			isActive = true
			start()
		}else if( isActive == true && !supportedAvatars.includes(value) ){
			isActive = false
			stop()
		}
	}
})