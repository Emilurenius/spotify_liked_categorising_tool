const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const path = require("path")
const fs = require("fs")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt")

const SpotifyWebAPI = require('spotify-web-api-node');
scopes = ["user-read-playback-state"]

// Reading input from terminal start
const port = parseInt(process.argv[2]) || 3000
console.log(`${port} registered as server port`)

function refreshAccessToken() {
    spotifyAPI.refreshAccessToken().then(
        (data) => { 
            console.log("Access token refreshed")

            spotifyAPI.setAccessToken(data.body["access_token"])
        },
        (err) => {
            console.log("Could not refresh access token", err)
        }
    )
}

function loadJSON(filename) {
    const rawdata = fs.readFileSync(path.join(__dirname, filename))
    const data = JSON.parse(rawdata)
    return data
}

const clientData = loadJSON("/spotifyClientData.json")
const spotifyAPI = new SpotifyWebAPI({
    clientId: clientData.clientID,
    clientSecret: clientData.clientSecret,
    redirectUri: clientData.loginRedirect
})
console.log(clientData)

app.get('/spotify/login', (req, res) => {
    const loginPage = spotifyAPI.createAuthorizeURL(scopes)
    res.redirect(`${loginPage}`)
    console.log("Login initiated")
})

app.get("/spotify/login/success", async (req, res) => {
    const { code } = req.query

    try {
        const data = await spotifyAPI.authorizationCodeGrant(code)
        const { access_token, refresh_token } = data.body
        spotifyAPI.setAccessToken(access_token)
        spotifyAPI.setRefreshToken(refresh_token)

        // res.send(`Logged in! ${access_token} ${refresh_token}`)
        res.send('Login completed')
        console.log("Logged in")
    } catch (err) {
        res.send("Oops, something went wrong")
        console.log("Login failed")
    }
})

app.get('/spotify/liked', async (req, res) => {

    try {
        console.log('Requesting liked songs from spotify API')
        spotifyAPI.getMySavedTracks(market='ES', limit=50, offset=0).then(
            (data) => {
                console.log(data)
                res.status.send(data)
            }
        )
    }
    catch (err) {
        console.log(err)
        refreshAccessToken()
        res.redirect('/spotify/liked')
    }
})


app.get('/spotify/elvis', async (req, res) => {
    spotifyAPI.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE').then(
        function(data) {
          console.log('Artist albums', data.body);
          res.send(data.body);
        },
        function(err) {
          console.error(err);
        }
      );
})

app.listen(port, () => console.log(`Listening on ${port}`))