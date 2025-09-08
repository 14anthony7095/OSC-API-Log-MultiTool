console.log('Starting..')
const Jimp = require('jimp')
const fs = require('fs')
var execSync = require('child_process').execSync;

var cooldown = false
fs.watch('C:/Users/14anthony7095/Documents/14aOSC-API-Log/assets/crazoTimer.png', 'utf8', (eventType, filename) => {
    if(cooldown == true){ return }
    cooldown = true
    setTimeout(() => {
        cooldown = false
    }, 1000);
    
    //console.log(eventType)

    readStreamPixels()
})

var cmd = `ffmpeg -y -i "https://stream.vrcdn.live/live/crazco.live.ts" -frames:v 1 "C:/Users/14anthony7095/Documents/14aOSC-API-Log/assets/crazoTimer.png"`;
var options = {
  encoding: 'utf8'
};
setInterval(() => {
    console.log(execSync(cmd, options))
}, 10000);


function colorLookUp(r,g,b){
    if( r>=24-20 && r<24+20 ){ console.log('0'); return 0 }
    if( r>=30-20 && r<30+20 ){ console.log('1'); return 1 }
    if( r>=28-20 && r<28+20 ){ console.log('2'); return 2 }
    if( r>=25-20 && r<25+20 ){ console.log('4'); return 4 }
    if( r>=17-20 && r<17+20 ){ console.log('10'); return 10 }
    if( r>=12-20 && r<12+20 ){ console.log('11'); return 11 }
    if( r>=17-20 && r<17+20 ){ console.log('12'); return 12 }
    if( r>=94-20 && r<94+20 ){ console.log('19'); return 19 }
    if( r>=95-20 && r<95+20 ){ console.log('20'); return 20 }
    if( r>=93-20 && r<93+20 ){ console.log('21'); return 21 }
    if( r>=91-20 && r<91+20 ){ console.log('22'); return 22 }
    if( r>=91-20 && r<91+20 ){ console.log('23'); return 23 }
    if( r>=92-20 && r<92+20 ){ console.log('28'); return 28 }
    if( r>=84-20 && r<84+20 ){ console.log('29'); return 29 }
    if( r>=92-20 && r<92+20 ){ console.log('30'); return 30 }
    if( r>=93-20 && r<93+20 ){ console.log('31'); return 31 }
    if( r>=168-20 && r<168+20 ){ console.log('32'); return 32 }
    if( r>=163-20 && r<163+20 ){ console.log('35'); return 35 }
    if( r>=165-20 && r<165+20 ){ console.log('40'); return 40 }
    if( r>=162-20 && r<162+20 ){ console.log('41'); return 41 }
    if( r>=160-20 && r<160+20 ){ console.log('42'); return 42 }
    if( r>=153-20 && r<153+20 ){ console.log('45'); return 45 }
    if( r>=240-20 && r<240+20 ){ console.log('49'); return 49 }
    if( r>=236-20 && r<236+20 ){ console.log('50'); return 50 }
    if( r>=233-20 && r<233+20 ){ console.log('51'); return 51 }
    if( r>=237-20 && r<237+20 ){ console.log('52'); return 52 }
    if( r>=233-20 && r<233+20 ){ console.log('54'); return 54 }
    if( r>=226-20 && r<226+20 ){ console.log('55'); return 55 }
    if( r>=231-20 && r<231+20 ){ console.log('56'); return 56 }
    if( r>=232-20 && r<232+20 ){ console.log('57'); return 57 }



    /*
    */


    
}

function readStreamPixels() {
    Jimp.read('C:/Users/14anthony7095/Documents/14aOSC-API-Log/assets/crazoTimer.png', (err,image)=>{
        if (err) { console.log(err) };
        let topLeft = image.getPixelColour(0,0)
        let topRight = image.getPixelColour(175,0)
        let bottomLeft = image.getPixelColour(0,143)
        let bottomRight = image.getPixelColour(175,143)

        console.log(`Sec: Int ${bottomRight} , RGB ${JSON.stringify(Jimp.intToRGBA(bottomRight))}`)
        colorLookUp( Jimp.intToRGBA(bottomRight).r , 0 , 0 )

        //console.log( colorLookUp( Jimp.intToRGBA(bottomRight).r , Jimp.intToRGBA(bottomRight).g , Jimp.intToRGBA(bottomRight).b ) )
/*        
        console.log(`H ${topRight} = ${colorTable[topRight]} raw ${JSON.stringify(Jimp.intToRGBA(topRight))}
M ${bottomLeft} = ${colorTable[bottomLeft]} raw ${JSON.stringify(Jimp.intToRGBA(bottomLeft))}
S ${bottomRight} = ${colorTable[bottomRight]} raw ${JSON.stringify(Jimp.intToRGBA(bottomRight))}`)
*/

    });
}