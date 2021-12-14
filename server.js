const express = require('express');
require('dotenv').config();
const cors = require('cors');
const request = require('request');
const axios = require('axios');

const { encodeFormData } = require('./utils/encodeFormData');
const { parseSongData } = require('./utils/parseSongData');

// const dataPlaylists = require('./mockData/dataPlaylists.json');
// const dataUser = require('./mockData/dataUser.json');
// const dataSongs = require('./mockData/dataSongs.json');
// const dataAudioFeatures = require('./mockData/dataAudioFeatures.json');

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
      redirect_uri: redirect_uri,
      // show_dialog: true
    }));
})

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  const url =  'https://accounts.spotify.com/api/token';
  const params = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri,
  }
  const authOptions = {
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    json: true
  }

  try {
    const response = await axios.post(url, encodeFormData(params), authOptions);
    access_token = response.data.access_token;
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000';
    res.redirect(uri);
  } catch (err) {
    console.log(err);
  }
  
})


app.get('/getuser', async (req, res) => {
  const options = {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    }
  }
  // const response = axios.get('https://api.spotify.com/v1/me', options, (err, response, body) => {
  //   const data = JSON.parse(body);
  //   userID = data.id;
  //   res.json(data);
  // });
  try {
    const response = await axios.get('https://api.spotify.com/v1/me', options);
    const data = response.data;
    userID = data.id;
    res.json(data);
  } catch (err) {
    console.log(err.message);
  }
  // res.json(dataUser);
});

app.get('/getuserplaylist', async (req, res) => {
  const options = {
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  }
  const response = await axios.get(`https://api.spotify.com/v1/users/${userID}/playlists?limit=50&offset=0`, options);
  res.json(response.data);
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
  axios.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, options)
    .then(res => resolve(res.data))
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
  axios.get(`https://api.spotify.com/v1/audio-features?ids=${idList}`, options)
    .then(res => resolve(res.data))
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
