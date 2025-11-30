const Jimp = require('jimp');
const fs = require('fs');
const EventEmitter = require('events');
const displayEmitter = new EventEmitter
// const { oscSend } = require("./Interface_osc_v1");
var osc = require('osc');
var udpPort = new osc.UDPPort({ localAddress: '127.0.0.1' })
const remotePort = 9000
udpPort.open()
function oscSend(a, v) { udpPort.send({ address: a, args: [v] }, '127.0.0.1', remotePort) }


const color64 = [
    "000000", "000055", "0000AA", "0000FF", "005500", "005555", "0055AA", "0055FF", "00AA00", "00AA55", "00AAAA", "00AAFF", "00FF00", "00FF55", "00FFAA", "00FFFF",
    "550000", "550055", "5500AA", "5500FF", "555500", "555555", "5555AA", "5555FF", "55AA00", "55AA55", "55AAAA", "55AAFF", "55FF00", "55FF55", "55FFAA", "55FFFF",
    "AA0000", "AA0055", "AA00AA", "AA00FF", "AA5500", "AA5555", "AA55AA", "AA55FF", "AAAA00", "AAAA55", "AAAAAA", "AAAAFF", "AAFF00", "AAFF55", "AAFFAA", "AAFFFF",
    "FF0000", "FF0055", "FF00AA", "FF00FF", "FF5500", "FF5555", "FF55AA", "FF55FF", "FFAA00", "FFAA55", "FFAAAA", "FFAAFF", "FFFF00", "FFFF55", "FFFFAA", "FFFFFF"
]

var cur = []
var delay = 500
var imageProgress = 1

function clamp(num) { return Math.max(0, Math.min(255, num)) }

mainloop()
async function mainloop() {

    await dumpImageData(`ba/17222_8p2fps_${imageProgress.toString().padStart(4, '0')}.png`)

    setTimeout(() => {
        // Auto-ReRender
        mainloop()
        displayEmitter.emit('finished')
    }, 3 * delay);

    for (let index = 1; index <= 3; index++) {
        setTimeout(() => {
            console.log(cur)
            let colR1 = parseInt(cur[index].slice(2,4), 16) / 255
            // console.log(cur[index])
            // console.log(cur[index].slice(0,2))
            // console.log(parseInt(cur[index].slice(0,2),16))
            // console.log(colR1)
            let colR2 = parseInt(cur[index * 2].slice(2,4), 16) / 255
            let colR3 = parseInt(cur[index * 3].slice(2,4), 16) / 255

            let colR4,colR5,colR6,colR7,colR8,colR9,colR10,colR11,colR12,colR13,colR14,colR15,colR16,colR17,colR18,colR19,colR20,colR21,colR22,colR23,colR24,colR25,colR26,colR27,colR28,colR29,colR30,colR31
            if (index != 3) {
                colR4 = parseInt(cur[index * 4].slice(2,4), 16) / 255
                colR5 = parseInt(cur[index * 5].slice(2,4), 16) / 255
                colR6 = parseInt(cur[index * 6].slice(2,4), 16) / 255
                colR7 = parseInt(cur[index * 7].slice(2,4), 16) / 255
                colR8 = parseInt(cur[index * 8].slice(2,4), 16) / 255
                colR9 = parseInt(cur[index * 9].slice(2,4), 16) / 255
                colR10 = parseInt(cur[index * 10].slice(2,4), 16) / 255
                colR11 = parseInt(cur[index * 11].slice(2,4), 16) / 255
                colR12 = parseInt(cur[index * 12].slice(2,4), 16) / 255
                colR13 = parseInt(cur[index * 13].slice(2,4), 16) / 255
                colR14 = parseInt(cur[index * 14].slice(2,4), 16) / 255
                colR15 = parseInt(cur[index * 15].slice(2,4), 16) / 255
                colR16 = parseInt(cur[index * 16].slice(2,4), 16) / 255
                colR17 = parseInt(cur[index * 17].slice(2,4), 16) / 255
                colR18 = parseInt(cur[index * 18].slice(2,4), 16) / 255
                colR19 = parseInt(cur[index * 19].slice(2,4), 16) / 255
                colR20 = parseInt(cur[index * 10].slice(2,4), 16) / 255
                colR21 = parseInt(cur[index * 21].slice(2,4), 16) / 255
                colR22 = parseInt(cur[index * 22].slice(2,4), 16) / 255
                colR23 = parseInt(cur[index * 23].slice(2,4), 16) / 255
                colR24 = parseInt(cur[index * 24].slice(2,4), 16) / 255
                colR25 = parseInt(cur[index * 25].slice(2,4), 16) / 255
                colR26 = parseInt(cur[index * 26].slice(2,4), 16) / 255
                colR27 = parseInt(cur[index * 27].slice(2,4), 16) / 255
                colR28 = parseInt(cur[index * 28].slice(2,4), 16) / 255
                colR29 = parseInt(cur[index * 29].slice(2,4), 16) / 255
                colR30 = parseInt(cur[index * 30].slice(2,4), 16) / 255
                colR31 = parseInt(cur[index * 31].slice(2,4), 16) / 255
            }

            draw(index, colR1, colR2, colR3, colR4, colR5, colR6, colR7, colR8, colR9, colR10, colR11, colR12, colR13, colR14, colR15, colR16, colR17, colR18, colR19, colR20, colR21, colR22, colR23, colR24, colR25, colR26, colR27, colR28, colR29, colR30, colR31)
        }, index * delay);
    }
}


// fs.watchFile('./bin/test.png', (curr, prev) => { dumpImageData() })

displayEmitter.on('finished', () => {
    imageProgress++
})
function dumpImageData(imageName = 'test.png') {
    return new Promise((resolve, reject) => {
        Jimp.read('./bin/' + imageName, (err, value, coords) => {
            console.log(imageName)
            cur = Buffer.from(value.bitmap.data).toString('hex').match(/.{0,8}/g)
            cur.pop()
            // console.log(cur)
            resolve('finished')
        })
    })
}

function draw(head, h1=0, h2=0, h3=0, h4=0, h5=0, h6=0, h7=0, h8=0, h9=0, h10=0, h11=0, h12=0, h13=0, h14=0, h15=0, h16=0, h17=0, h18=0, h19=0, h20=0, h21=0, h22=0, h23=0, h24=0, h25=0, h26=0, h27=0, h28=0, h29=0, h30=0, h31=0) {
    // oscSend('/avatar/parameters/14a/osc/curPos', ((head / 255) * 2) + -1)
    oscSend('/avatar/parameters/cursor', head)
    oscSend('/avatar/parameters/h1', parseFloat(h1))
    oscSend('/avatar/parameters/h2', parseFloat(h2))
    oscSend('/avatar/parameters/h3', parseFloat(h3))
    oscSend('/avatar/parameters/h4', parseFloat(h4))
    oscSend('/avatar/parameters/h5', parseFloat(h5))
    oscSend('/avatar/parameters/h6', parseFloat(h6))
    oscSend('/avatar/parameters/h7', parseFloat(h7))
    oscSend('/avatar/parameters/h8', parseFloat(h8))
    oscSend('/avatar/parameters/h9', parseFloat(h9))
    oscSend('/avatar/parameters/h10', parseFloat(h10))
    oscSend('/avatar/parameters/h11', parseFloat(h11))
    oscSend('/avatar/parameters/h12', parseFloat(h12))
    oscSend('/avatar/parameters/h13', parseFloat(h13))
    oscSend('/avatar/parameters/h14', parseFloat(h14))
    oscSend('/avatar/parameters/h15', parseFloat(h15))
    oscSend('/avatar/parameters/h16', parseFloat(h16))
    oscSend('/avatar/parameters/h17', parseFloat(h17))
    oscSend('/avatar/parameters/h18', parseFloat(h18))
    oscSend('/avatar/parameters/h19', parseFloat(h19))
    oscSend('/avatar/parameters/h20', parseFloat(h20))
    oscSend('/avatar/parameters/h21', parseFloat(h21))
    oscSend('/avatar/parameters/h22', parseFloat(h22))
    oscSend('/avatar/parameters/h23', parseFloat(h23))
    oscSend('/avatar/parameters/h24', parseFloat(h24))
    oscSend('/avatar/parameters/h25', parseFloat(h25))
    oscSend('/avatar/parameters/h26', parseFloat(h26))
    oscSend('/avatar/parameters/h27', parseFloat(h27))
    oscSend('/avatar/parameters/h28', parseFloat(h28))
    oscSend('/avatar/parameters/h29', parseFloat(h29))
    oscSend('/avatar/parameters/h30', parseFloat(h30))
    oscSend('/avatar/parameters/h31', parseFloat(h31))
}