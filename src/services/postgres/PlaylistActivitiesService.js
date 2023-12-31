const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');

class PlaylistActivitiesService {
  constructor() {
    this._pool = new Pool();
  }

  async createPlaylistActivity({
    playlistId, songId, userId, action,
  }) {
    const id = nanoid(16);
    const time = new Date().toISOString();
    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, time],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Aktivitas gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylistActivities({ playlistId }) {
    const query = {
      text: `SELECT pa.id as id,
              u.username as username,
              s.title as title,
              pa.action as action,
              pa.time as time
        FROM playlist_song_activities pa 
        LEFT JOIN users u ON u.id = pa.user_id
        LEFT JOIN songs s ON s.id = pa.song_id
        WHERE pa.playlist_id = $1
        ORDER BY pa.time ASC`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }
}

module.exports = PlaylistActivitiesService;
