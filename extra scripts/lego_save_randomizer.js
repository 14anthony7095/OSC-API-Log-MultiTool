const fs = require('fs')

function genarateLegoSave() {
    let BricksArray = ``
    // BrickID: 1 -> 255
    // X: 0 -> 128
    // Y: 0 -> 255
    // Z: 0 -> 128
    // Facing: 0 -> 3
    // Color: 0 -> 24
    // Transparency: 0 -> 1
    let sizeX = 128 // 128
    let sizeY = 254 // 254
    let sizeZ = 128 // 128
    let splitMulti = 10
    let isforceBrickID = 'no'
    let isforceFacing = 'no'
    let isforceColor = 'no'
    let isforceTrans = 'no'
    let brickCount = 0
    console.log('Genarating..')
    for (let indexY = 0; indexY < sizeY/splitMulti; indexY++) {
        for (let indexX = 0; indexX < sizeX/splitMulti; indexX++) {
            for (let indexZ = 0; indexZ < sizeZ/splitMulti; indexZ++) {
                brickCount++
                if( isforceBrickID == 'no' ){ var forceBrickID = Math.round( Math.random() * 254 ) + 1 }else{ var forceBrickID = isforceBrickID }
                if( isforceFacing == 'no' ){ var forceFacing = Math.round( Math.random() * 3 ) }else{ var forceFacing = isforceFacing }
                if( isforceColor == 'no' ){ var forceColor = Math.round( Math.random() * 24 ) }else{ var forceColor = isforceColor }
                if( isforceTrans == 'no' ){ var forceTrans = Math.round( Math.random() * 1 ) }else{ var forceTrans = isforceTrans }
                BricksArray += `;${ forceBrickID },${ indexX*splitMulti },${ indexY*splitMulti },${ indexZ*splitMulti },${ forceFacing },${ forceColor },${ forceTrans }`
            }
        }
    }
    // BricksArray.push( `${BrickID},${X},${Y},${Z},${Facing},${Color},${Transparency}` )
    
    // fs.writeFile('lego-save.txt', `0;nodegensave;NodeJS${Buffer.from(BricksArray).toString('base64')}`, (err)=>{
    fs.writeFile('lego-save.txt', `0;gen;14aOSC${BricksArray}`, (err)=>{
        if(err) throw err;
        console.log(`Saved to lego-save.txt with ${brickCount} Bricks`)
    })
}

function convertLegoSaveToLDR(InpurtString){
    // BrickID: 1 -> 255
    // X: 0 -> 128
    // Y: 0 -> 255
    // Z: 0 -> 128
    // Facing: 0 -> 3
    // Color: 0 -> 24
    // Transparency: 0 -> 1

}

convertLegoSaveToLDR(`0;xyzspacingtest;14anthony7095;1,4,12,4,1,0,0;1,2,12,4,1,0,0;1,2,12,2,1,0,0;1,4,12,2,1,0,0;1,2,12,0,1,0,0;1,4,12,0,1,0,0;1,0,12,2,1,0,0;1,0,12,0,1,0,0;1,0,12,4,1,0,0;1,4,0,4,1,0,0;1,2,0,4,1,0,0;1,0,0,4,1,0,0;1,4,6,0,1,0,0;1,4,6,2,1,0,0;1,4,0,2,1,0,0;1,4,0,0,1,0,0;1,2,0,0,1,0,0;1,2,0,2,1,0,0;1,0,0,2,1,0,0;1,0,0,0,1,0,0;1,4,6,4,1,0,0;1,2,6,4,1,0,0;1,0,6,4,1,0,0;1,2,6,2,1,0,0;1,0,6,2,1,0,0;1,0,6,0,1,0,0;1,2,6,0,1,0,0`)

genarateLegoSave()


// 0;
// xyzspacingtest;
// 14anthony7095;
// 1,4,12,4,1,0,0;
// 1,2,12,4,1,0,0;
// 1,2,12,2,1,0,0;
// 1,4,12,2,1,0,0;
// 1,2,12,0,1,0,0;
// 1,4,12,0,1,0,0;
// 1,0,12,2,1,0,0;
// 1,0,12,0,1,0,0;
// 1,0,12,4,1,0,0;
// 1,4,0,4,1,0,0;
// 1,2,0,4,1,0,0;
// 1,0,0,4,1,0,0;
// 1,4,6,0,1,0,0;
// 1,4,6,2,1,0,0;
// 1,4,0,2,1,0,0;
// 1,4,0,0,1,0,0;
// 1,2,0,0,1,0,0;
// 1,2,0,2,1,0,0;
// 1,0,0,2,1,0,0;
// 1,0,0,0,1,0,0;
// 1,4,6,4,1,0,0;
// 1,2,6,4,1,0,0;
// 1,0,6,4,1,0,0;
// 1,2,6,2,1,0,0;
// 1,0,6,2,1,0,0;
// 1,0,6,0,1,0,0;
// 1,2,6,0,1,0,0