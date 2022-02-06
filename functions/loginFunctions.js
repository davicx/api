const db = require('./conn');
const bcrypt = require('bcrypt')
//app.use(express.json());
const Functions = require('./functions');
const validationFunctions = require('./validationFunctions');
const User = require('./classes/User')

//const Notification = require('./classes/Notifications');

/*
FUNCTIONS A: All Functions Related to a User 
	1) Function A1: Login
	1) Function A2: Register 

*/

//FUNCTIONS A: All Functions Related to a User 
//Function A1: Get User Profile
function userLogin(req, res) {

    res.send({login:"login"})

}
//Function A2: Register New User 
async function userRegister(req, res) {
  const userName = req.body.userName;
  const fullName = req.body.fullName;
  const userEmail = req.body.email;
  const rawPassword = req.body.password
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(req.body.password, salt)
  var registerUserLoginOutcome = {}

	const newUser = {
		userName: userName,
		fullName: fullName,
		userEmail: userEmail,
    password: hashedPassword,
    salt: salt
	}
  //console.log(newUser);

  //STEP 1: Check if Username is taken 
	const userExistsStatus = await Functions.checkIfUserExists(userName)

  //STEP 2: Validate Information (or do all at once in validationFunctions.js)
  const validationStatus = validationFunctions.validateRegisterUser(userEmail, userName, fullName, rawPassword);

  if(userExistsStatus.userExists == 0) {
    console.log("user name is good!")
     
    registerUserLoginOutcome = await User.registerUserLogin(newUser)

    //User.registerUserProfile(newUser)



    /*
    $sql = 'INSERT INTO user_login (user_name, user_email, salt, password) VALUES (?, ?, ?, ?)';
		$stmt = $conn->stmt_init();
		$stmt = $conn->prepare($sql);
		$stmt->bind_param('ssis', $username, $email, $salt, $pwd);
		$stmt->execute();
		$stmt->close();
    */
	} else {
    console.log("user name is taken!")
	}

  //STEP 3: Register the New User 
  //const registerUserOutcome = User.registerUser(newUser);

	res.send(registerUserLoginOutcome) 

} 

module.exports = { userLogin, userRegister};




/*
		//Insert into User Login Table 
		$sql = 'INSERT INTO user_login (user_name, user_email, salt, password) VALUES (?, ?, ?, ?)';
		$stmt = $conn->stmt_init();
		$stmt = $conn->prepare($sql);
		$stmt->bind_param('ssis', $username, $email, $salt, $pwd);
		$stmt->execute();
		$stmt->close();

		//Pull user_id and update user_profile table with this id 
		if ($result_id = mysqli_prepare($conn, "SELECT user_id FROM user_login WHERE user_name=?")) {
			$result_id -> bind_param("s", $username);
			$result_id -> execute();
			$result_id -> bind_result($result_user_id);
			$result_id -> fetch();
			$user_id = $result_user_id;
			$result_id -> close();
		} 
		
		//Insert user data into User Profile 
*/




//APPENDIX
 

/*
app.post("/registert", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt)
    const userName = req.body.username;
    const name = req.body.name;
    const userEmail = req.body.email;

    const user = {name: userName, password: hashedPassword}
    users.push(user);
    res.status(201).send(users);
	console.log("created a new user " + userName);
  } catch {
    res.status(500).send();
  }
})


app.post("/login", async (req, res) => {
  const user = users.find(user => user.name = req.body.username)
  console.log("USER: " + user)
  if (user == null ) {
    return res.status(400).send('cant find user')
  }
  try {
    if(await bcrypt.compare(req.body.password, user.password)) {
          res.send('yay! worked ' + req.body.username)
    } else {
      res.send('no matchy!')
    }
  } catch {
    res.status(500).send();
  }

})
*/










