const db = require('./conn');
const dayjs = require('dayjs')
var relativeTime = require('dayjs/plugin/relativeTime')
dayjs.extend(relativeTime)
dayjs().format()


/*
FUNCTIONS A: All Functions Related to Time
	1) Function A1: Format a Timestamp in ISO

*/

/*
//TIME 
//Step 1: Create a Post Time Holder 
let postTimeData = {}
let date = dayjs(row.created).format('MM/DD/YYYY')      
let minutes = dayjs(row.created).minute()
let hour = dayjs(row.created).hour()

//Step 2: Get the time in hours and minutes
if(hour > 12) {
    hour = hour - 12
}

let time = hour + ":0" + minutes + " pm";

//Step 3: Get the Message 
let timeMessage = dayjs(row.created).fromNow()

postTimeData.date = date
postTimeData.time = time
postTimeData.timeMessage = timeMessage
*/

//Function A1: Format a Timestamp
function formatTimestamp(timestamp) {
    let formattedTime = {}

    //Format Date
    let date = dayjs(timestamp).format('MM/DD/YYYY')      
    
    //Format Time 
    let minutes = dayjs(timestamp).minute()
    let hour = dayjs(timestamp).hour()

    if(hour > 12) {
        hour = hour - 12
    }
    let time = hour + ":0" + minutes + " pm"

    //Get a Message to Display 
    let timeMessage = dayjs(timestamp).fromNow()

    formattedTime.date = date
    formattedTime.time = time
    formattedTime.timeMessage = timeMessage

    return formattedTime;
	
}

//Function A1: Format a Timestamp
function getCurrentTime() {
    let formattedTime = {}
    var now = dayjs()
 
    //Format Date
    let date = dayjs(now).format('MM/DD/YYYY')  

    //Format Time 
    let minutes = dayjs(now).minute()
    let hour = dayjs(now).hour()

    if(hour > 12) {
        hour = hour - 12
    }
    let time = hour + ":" + minutes + " pm"
 
    //Get a Message to Display 
    let timeMessage = dayjs(now).fromNow()
   
    formattedTime.now = now
    formattedTime.postDate = date
    formattedTime.postTime = time
    formattedTime.timeMessage = timeMessage

    return formattedTime;

}

//Async
/*
async function formatTimestamp(timestamp) {
    var formattedTime = {}
    
	return new Promise(async function(resolve, reject) {
        try {
            //Format Date
            let date = dayjs(timestamp).format('MM/DD/YYYY')      
            
            //Format Time 
            let minutes = dayjs(row.created).minute()
            let hour = dayjs(row.created).hour()

            if(hour > 12) {
                hour = hour - 12
            }
            let time = hour + ":0" + minutes + " pm"

            //Get a Message to Display 
            let timeMessage = dayjs(row.created).fromNow()

            formattedTime.date = date
            formattedTime.time = time
            formattedTime.timeMessage = timeMessage

            console.log(timeMessage)
            resolve(timeMessage); 

            
        } catch(err) {
            userIdOutcome.outcome = 500;
            reject(formattedTime);
        } 
    })
*/

module.exports = { formatTimestamp, getCurrentTime };




/*



    return new Promise(async function(resolve, reject) {
        try {
            connection.query(queryString, [groupID], (err, rows) => {
                if (!err) {
                    const posts = rows.map((row) => {
                        console.log("Dates")
                        console.log(row.created)
                        let date = dayjs(row.created).format('MM/DD/YYYY h:mm A') 
                        console.log(date)

                        let minutes = dayjs(row.created).minute()
                        let hour = dayjs(row.created).hour()
                        console.log(hour + " " + minutes)
                        if(hour > 12) {
                            hour = hour - 12
                        }
                        console.log(hour + ":0" + minutes + " pm")


                        console.log("Dates")
                        return {
                            postID: row.post_id,
                            postType: row.post_type,
                            groupID: row.group_id,
                            listID: row.list_id,
                            postFrom: row.post_from,
                            postTo: row.post_to,
                            postCaption: row.post_caption,
                            fileName: row.file_name,
                            fileNameServer: row.file_name_server,
                            fileUrl: row.file_url,
                            videoURL: row.video_url,
                            videoCode: row.video_code,
                            created: row.created
                        }
                    });
                    postsOutcome.posts = posts;

                    resolve(postsOutcome)
        
                } else {
                    console.log("Failed to Select Posts" + err)
                    reject(postsOutcome);
                }
           })
            
        } catch(err) { 
            reject(postsOutcome);
        } 
    })
    */