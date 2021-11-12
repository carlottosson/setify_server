const express = require('express');
require('dotenv').config();
const cors = require('cors');
const request = require('request');
const fetch = require('node-fetch');

const { encodeFormData } = require('./utils/encodeFormData');
const { parseSongData } = require('./utils/parseSongData');

const dataPlaylists = require('./dataPlaylists.json');
const dataUser = require('./dataUser.json');
const dataSongs = require('./dataSongs.json');
const dataAudioFeatures = require('./dataAudioFeatures.json');

const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: false}));
app.use(cors({origin: '*'}));

app.listen(8080, () => console.log(`Server started on port 8080...`));

const client_id = process.env.CLIENT_ID;
const redirect_uri = 'http://127.0.0.1:8080/callback/';
let access_token = process.env.ACCESS_TOKEN;
let userID = '';

app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email';

  res.redirect('https://accounts.spotify.com/authorize?' +
    encodeFormData({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));
})

app.get('/callback', (req, res) => {
  const code = req.query.code;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  }
  request.post(authOptions, (error, response, body) => {
    access_token = body.access_token;
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000';
    res.redirect(uri);
  });
})


app.get('/getuser', (req, res) => {
  const options = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  }
  request.get('https://api.spotify.com/v1/me', options, (err, response, body) => {
    const data = JSON.parse(body);
    userID = data.id;
    res.json(data);
  });
  // res.json(dataUser);
});

app.get('/getuserplaylist', (req, res) => {
  const options = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  }
  request.get(`https://api.spotify.com/v1/users/${userID}/playlists?limit=50&offset=0`, options, (err, response, body) => {
    const data = JSON.parse(body);
    res.json(data);
  })
  // res.json(dataPlaylists);
})


const fetchPlaylistTracks = (id) => new Promise((resolve, reject) => {
  const options = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      Host: 'api.spotify.com'
    }
  }
  fetch(`https://api.spotify.com/v1/playlists/${id}/tracks`, options)
  .then(res => res.json())
  .then(data => resolve(data))
  .catch(err => reject(err))
})

const fetchTracksAudioFeatures = (idArray) => new Promise((resolve, reject) => {
  const idList = idArray.join(',');
  const options = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      Host: 'api.spotify.com'
    }
  }
  fetch(`https://api.spotify.com/v1/audio-features?ids=${idList}`, options)
  .then(res => res.json())
  .then(data => resolve(data))
  .catch(err => reject(err))
});

app.post('/getsongs', async (req, res) => {
  try {
    const id = req.body.id;
    const playlistTracks = await fetchPlaylistTracks(id);
    const tracksIdArray = playlistTracks.items.map(i => i.track.id);
    const tracksAudioFeatures = await fetchTracksAudioFeatures(tracksIdArray);
    const data = parseSongData(playlistTracks, tracksAudioFeatures);
    res.json(data);
  } catch (error) {
    console.log(error);
  }

  // const data = parseSongData(dataSongs, dataAudioFeatures);

  
});
