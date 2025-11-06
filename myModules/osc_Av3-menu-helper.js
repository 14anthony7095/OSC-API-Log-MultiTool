const { loglv } = require('./config.js')
const { OSCDataBurst,oscEmitter, oscSend } = require('./Interface_osc_v1.js');
const { logEmitter } = require('./Interface_vrc-Log.js')
// const say = require('say');
let selflog = `\x1b[0m(\x1b[34mAv3MenuHelper\x1b[0m)`
console.log(`${loglv().log}${selflog} Loaded`)

// function remap(value,lowOld,highOld,lowNew,highNew) {
// 	return lowNew + (value - lowOld) * (highNew - lowNew) / (highOld - lowOld)
// }

var menuX = 0
var menuY = 0
var doAutoJump = false
oscEmitter.on('osc', (address, value) => {

	
	if( address == '/avatar/parameters/osc/doAutoJump' ){ doAutoJump = value }
	if( address == '/avatar/parameters/Grounded' && doAutoJump == true ){
		if( value == true ){
				oscSend('/input/Jump',true);setTimeout(() => { oscSend('/input/Jump',false) },100);
		}
	}else{ value == false }
	
	if( address == '/avatar/parameters/menu/directionalH' ){ menuX = value }
	if( address == '/avatar/parameters/menu/directionalV' ){ menuY = value }
	if( address == '/avatar/parameters/menu/directionalX' || address == '/avatar/parameters/menu/directionalV' ){ 
		oscSend('/avatar/parameters/osc/menuDirection', Math.atan2(menuY,menuX) * ( 180 / Math.PI ) )
		console.log(`Angle ${Math.atan2(menuY,menuX) * ( 180 / Math.PI )}`)
	}
	
})

// logEmitter.on('log', line => {
// 	if( syncingAvatars == true && line.includes('VRCPlayer[Local]') && line.includes('ReloadAvatarNetworkedRPC') ){
// 		loadingParams = false
// 		// console.log(`${loglv().debug}${selflog} [SYNC] loadingParams = ${loadingParams} from logEmitter [SET]`)
// 		console.log(`${loglv().debug}${selflog} [SYNC] Resettings Parameters`)
// 		Object.keys( oscMemory ).forEach( (entry,index) =>{
// 			if( entry.includes('*') ){
// 				console.log(`${loglv().debug}${selflog} [SYNC] resetting ${entry} to ${oscMemory[ entry ]}`)
// 				if( oscMemDefaults[ entry ] != undefined ){
// 					oscMemory[ entry ] = oscMemDefaults[ entry ]
// 				}else{
// 					oscMemory[ entry ] = 0
// 				}
// 			}
// 		})
// 	}
// })