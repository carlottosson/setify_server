// const songData = require('../dataSongs.json');
// const audioData = require('../dataAudioFeatures.json');

const durationConvrter = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

const keyConverter = (num) => {
  switch (num) {
    case 0: {
      return 'C';
    }
    case 1: {
      return 'C#';
    }
    case 2: {
      return 'D';
    }
    case 3: {
      return 'D#';
    }
    case 4: {
      return 'E';
    }
    case 5: {
      return 'F';
    }
    case 6: {
      return 'F#';
    }
    case 7: {
      return 'G';
    }
    case 8: {
      return 'G#';
    }
    case 9: {
      return 'A';
    }
    case 10: {
      return 'A#';
    }
    case 11: {
      return 'B';
    }
  
    default: {
      return '-'
    }
  }
}

const emojiConverter = (num) => {
  if (num < .1) return '😭';
  if (num < .2) return '😔';
  if (num < .4) return '🙁';
  if (num < .5) return '😐';
  if (num < .6) return '🙂';
  if (num < .7) return '😊';
  if (num < .8) return '😁';
  if (num < .9) return '😂';
  if (num < 1)  return '🤣';
}

const parseSongData = (songData, audioData) => {
  const totalTime = songData.items.reduce((a, b)=> a + b.track.duration_ms, 0);
  const totalTimeNice = durationConvrter(totalTime);
  return songData.items.map((song, index) => {
    return {
      songName: song.track.name,
      songLink: song.track.external_urls.spotify,
      image: song.track.album.images[2].url ? song.track.album.images[2].url : null,
      artist: song.track.artists.map(i => i.name).join(', '),
      duration_nice: durationConvrter(song.track.duration_ms),
      duration_ms: song.track.duration_ms,
      key: keyConverter(audioData.audio_features[index].key),
      mode: audioData.audio_features[index].mode === 0 ? 'Minor' : 'Major',
      danceability: audioData.audio_features[index].danceability,
      energy: audioData.audio_features[index].energy,
      tempo: Math.round(audioData.audio_features[index].tempo),
      happy: audioData.audio_features[index].valence,
      happy_emoji: emojiConverter(audioData.audio_features[index].valence),
      id: song.track.id,
      duration_total: totalTimeNice
    }
  })
}

module.exports.parseSongData = parseSongData;
