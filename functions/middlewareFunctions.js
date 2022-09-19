

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]
    console.log("_____________________")
    console.log("HEADER token " + token)
    console.log("_____________________")
  
    if (token == null) {
      console.log("You didn't present a token, no beuno!")
      return res.sendStatus(401)
    } 
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, authorizationData) => {
        if(!err) {
          req.authorizationData = authorizationData
          next();
        } else {
          console.log("Not Logged In")
          return res.sendStatus(403)
        }
    })
  }
  