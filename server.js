const express = require('express');
require('dotenv').config();
const cors = require('cors');
const {encodeFormData} = require('./utils/encodeFormData');
const request = require('request');
const dataPlaylists = require('./dataPlaylists.json');
const dataUser = require('./dataUser.json');
const dataSongs = require('./dataSongs.json');

const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: false}));
app.use(cors({origin: '*'}));

app.listen(8080, () => console.log(`Server started on port 8080...`));

const client_id = process.env.CLIENT_ID;
const redirect_uri = 'http://127.0.0.1:8080/callback/';
let access_token = '';
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
    console.log(body);
    const uri = process.env.FRONTEND_URI || 'http://localhost:3000';
    res.redirect(uri);
  });
})


app.get('/getuser', (req, res) => {
  // const options = {
  //   headers: {
  //     Authorization: `Bearer ${access_token}`,
  //     'Content-Type': 'application/json'
  //   }
  // }
  // request.get('https://api.spotify.com/v1/me', options, (err, response, body) => {
  //   const data = JSON.parse(body);
  //   userID = data.id;
  //   res.json(data);
  // });
  res.json(dataUser);
});

app.get('/getuserplaylist', (req, res) => {
  // const options = {
  //   headers: {
  //     Authorization: `Bearer ${access_token}`,
  //     'Content-Type': 'application/json'
  //   }
  // }
  // request.get(`https://api.spotify.com/v1/users/${userID}/playlists?limit=50&offset=0`, options, (err, response, body) => {
  //   const data = JSON.parse(body);
  //   console.log(data);
  //   res.json(data);
  // })
  res.json(dataPlaylists);
})


const fetchPlaylistTracks = () => {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        Host: 'api.spotify.com'
      }
    }
    const id = req.body.id;
    request.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, options, (err, response, body) => {
      if(err) reject(err);
      const data = JSON.parse(body);
      console.log(data);
      resolve(data);
    });
  })
}


app.post('/getsongs', async (req, res) => {

  const playlistTracks = fetchPlaylistTracks();
  
  Promise.all(playlistTracks())
    .then(data => {
      console.log(data)
    })
    .catch(err => {
      console.log(err);
    })
  
  // https://api.spotify.com/v1/playlists/3jaViGCQQUcx8w7mZIITS4/tracks
  
})

// nextnext.items.map(i => {
//   request.get(`https://api.spotify.com//v1/audio-features/${i.track.id}`, options, (err, response, body) => {
//     console.log(i.track.id);
//     if(err) {
//       console.log(err);
//     }
//     const extraData = JSON.parse(body);
//     console.log(extraData);
//   });
// })
