const { Pool } = require('pg');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getSongByPlaylistId({ playlistId }) {
    const queryPlaylist = {
      text: `SELECT p.id, p.name
        FROM playlists p
        WHERE p.id = $1`,
      values: [playlistId],
    };

    const playlistsResult = await this._pool.query(queryPlaylist);

    const querySongs = {
      text: `SELECT *
        FROM songs s
        LEFT JOIN playlist_songs ps 
        ON ps.song_id = s.id
        WHERE ps.playlist_id = $1`,
      values: [playlistId],
    };

    const songsResult = await this._pool.query(querySongs);
    const playlist = playlistsResult.rows[0];

    return {
      id: playlist.id,
      name: playlist.name,
      songs: songsResult.rows.map((song) => ({
        id: song.id,
        title: song.title,
        performer: song.performer,
      })),
    };
  }
}

module.exports = PlaylistsService;
