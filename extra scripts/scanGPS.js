
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('C:/Users/14Anthony7095/AppData/Roaming/VRCX/VRCX.sqlite3');

var friendID = 'usr_34182235-335d-48a7-bd3f-616e343b4d16'

db.serialize(() => {
    db.each(`SELECT DISTINCT substring(location,1,41) FROM main.usre4c0f8e7e07f437fbdaff7ab7d34a752_feed_gps WHERE user_id LIKE '%${friendID}}%' ORDER BY location ASC`,(err,row)=>{

        console.log(row)
    });
})
