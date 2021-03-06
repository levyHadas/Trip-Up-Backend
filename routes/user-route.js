const userService = require('../services/user-service')
const BASE_PATH = '/api/user'

module.exports = addUserRoutes;


function addUserRoutes(app) {

    //create user
    app.post(`${BASE_PATH}`, async(req, res) => {
        if (req.body.username && req.body.password) {
            const user = req.body
            try {
                const signedUIser = await userService.addUser(user)
                return res.json(signedUIser)
            }
            catch(err) {
                res.status(401).end('Could not sign up')
                throw (err)
            }
        }
        else res.status(401).end()
    })
    //login
    app.post(`${BASE_PATH}/login`, async(req, res) => {
        if (!req.body.username || !req.body.password) res.status(401).end()
        else {
            const user = req.body
            try {
                const loggedUser = await userService.checkLogin(user)
                delete loggedUser.password
                req.session.user = loggedUser
                return res.json(loggedUser)
            }
            catch(err){
                res.status(401).end('Could not login')
                throw (err)
            }
        }
    })
    //get logged user
    app.get(`${BASE_PATH}/loggedUser`, (req, res) => {
        const loggedUser = req.session.user
        return res.json(loggedUser)
    })
    //logout
    app.get(`${BASE_PATH}/logout`, (req, res) => {
        req.session.destroy()
        res.clearCookie('connect.sid')
        res.end()
        return Promise.resolve()
    })
    //update 
    app.put(`${BASE_PATH}/:userId`, _checkUserAuth, async(req, res) => {
        const user = req.body
        try {
            const updatedUser = await userService.update(user)
            req.session.user = updatedUser
            return res.json(updatedUser)
        }
        catch(err) {
            res.end('Could not update user')
            throw(err)
        }
    })
    //need a different route for this, since we are updating a user that is not logged in - only adding to his incomingRequests
    app.put(`${BASE_PATH}/incomingRequests/:organizerId`, async(req, res) => {
        try {
            const { organizerId } = req.params
            const newRequest = req.body
            var organizer = await userService.getById(organizerId)
            if (!organizer.incomingRequests) organizer.incomingRequests = [] //for users that wew created before adding these fields
            organizer.incomingRequests.push(newRequest)
            const updatedUser = await userService.update(organizer)
            return res.json(updatedUser)
        }
        catch(err) {
            res.end('Could not update user')
            throw(err)
        }
    })
    //get users
    app.get(BASE_PATH, async(req, res) => {        
        try {
            const users = await userService.query(req.query)
            return res.json(users)
        }
        catch(err) {
            res.end('Could not fatch users')
            throw(err)
        }
    })
    //get one BY ID
    app.get(`${BASE_PATH}/:userId`, async(req, res) => {
        const id = req.params.userId
        try {
            const user = await userService.getById(id)
            return res.json(user)
        }
        catch(err) {
            res.end('Could not fetch user')
            throw(err)
        }
    })

}

function _checkUserAuth(req, res, next) {
    const {userId} = req.params
    if (userId !== req.session.user._id) { //if it's not the user that
        res.status(401).end('Unauthorized');
        return;
    }
    next()
}


 