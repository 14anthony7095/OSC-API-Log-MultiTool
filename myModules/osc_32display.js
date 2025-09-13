const Jimp = require('jimp');
const { oscSend } = require("./Interface_osc_v1");

const color64 = [
    "000000","000055","0000AA","0000FF","005500","005555","0055AA","0055FF","00AA00","00AA55","00AAAA","00AAFF","00FF00","00FF55","00FFAA","00FFFF",
    "550000","550055","5500AA","5500FF","555500","555555","5555AA","5555FF","55AA00","55AA55","55AAAA","55AAFF","55FF00","55FF55","55FFAA","55FFFF",
    "AA0000","AA0055","AA00AA","AA00FF","AA5500","AA5555","AA55AA","AA55FF","AAAA00","AAAA55","AAAAAA","AAAAFF","AAFF00","AAFF55","AAFFAA","AAFFFF",
    "FF0000","FF0055","FF00AA","FF00FF","FF5500","FF5555","FF55AA","FF55FF","FFAA00","FFAA55","FFAAAA","FFAAFF","FFFF00","FFFF55","FFFFAA","FFFFFF"
]

function mainloop() {
    Jimp.read('./bin/test.png', (err, value, coords) => {
        var cur1 = Buffer.from(value.bitmap.data).toString('hex').slice(0, 2048).match(/.{1,8}/g)
        var cur2 = Buffer.from(value.bitmap.data).toString('hex').slice(2048, 4096).match(/.{1,8}/g)
        var cur3 = Buffer.from(value.bitmap.data).toString('hex').slice(4096, 6144).match(/.{1,8}/g)
        var cur4 = Buffer.from(value.bitmap.data).toString('hex').slice(6144, 8192).match(/.{1,8}/g)

        setTimeout(() => {
            mainloop()
        }, 256 * 200);

        for (let index = 0; index < 256; index++) {
            setTimeout(() => {
                console.log(`pointer ${index}`)
                let colR1 = parseInt(cur1[index].match(/.{1,2}/g)[0], 16) / 255
                let colG1 = parseInt(cur1[index].match(/.{1,2}/g)[1], 16) / 255
                let colB1 = parseInt(cur1[index].match(/.{1,2}/g)[2], 16) / 255
                // console.log(`cur1: ${colR1},${colG1},${colB1}`)

                let colR2 = parseInt(cur2[index].match(/.{1,2}/g)[0], 16) / 255
                let colG2 = parseInt(cur2[index].match(/.{1,2}/g)[1], 16) / 255
                let colB2 = parseInt(cur2[index].match(/.{1,2}/g)[2], 16) / 255
                // console.log(`cur2: ${colR2},${colG2},${colB2}`)

                let colR3 = parseInt(cur3[index].match(/.{1,2}/g)[0], 16) / 255
                let colG3 = parseInt(cur3[index].match(/.{1,2}/g)[1], 16) / 255
                let colB3 = parseInt(cur3[index].match(/.{1,2}/g)[2], 16) / 255
                // console.log(`cur3: ${colR3},${colG3},${colB3}`)

                let colR4 = parseInt(cur4[index].match(/.{1,2}/g)[0], 16) / 255
                let colG4 = parseInt(cur4[index].match(/.{1,2}/g)[1], 16) / 255
                let colB4 = parseInt(cur4[index].match(/.{1,2}/g)[2], 16) / 255
                // console.log(`cur4: ${colR4},${colG4},${colB4}`)

                draw(index, colR1, colG1, colB1, colR2, colG2, colB2, colR3, colG3, colB3, colR4, colG4, colB4)
            }, index * 200);
        }
    })
}

mainloop()


function draw(head, r1, g1, b1, r2, g2, b2, r3, g3, b3, r4, g4, b4) {
    oscSend('/avatar/parameters/14a/osc/curPos', ((head / 255) * 2) + -1)
    oscSend('/avatar/parameters/14a/osc/cur1_R', parseFloat(r1))
    oscSend('/avatar/parameters/14a/osc/cur1_G', parseFloat(g1))
    oscSend('/avatar/parameters/14a/osc/cur1_B', parseFloat(b1))
    oscSend('/avatar/parameters/14a/osc/cur2_R', parseFloat(r2))
    oscSend('/avatar/parameters/14a/osc/cur2_G', parseFloat(g2))
    oscSend('/avatar/parameters/14a/osc/cur2_B', parseFloat(b2))
    oscSend('/avatar/parameters/14a/osc/cur3_R', parseFloat(r3))
    oscSend('/avatar/parameters/14a/osc/cur3_G', parseFloat(g3))
    oscSend('/avatar/parameters/14a/osc/cur3_B', parseFloat(b3))
    oscSend('/avatar/parameters/14a/osc/cur4_R', parseFloat(r4))
    oscSend('/avatar/parameters/14a/osc/cur4_G', parseFloat(g4))
    oscSend('/avatar/parameters/14a/osc/cur4_B', parseFloat(b4))
}