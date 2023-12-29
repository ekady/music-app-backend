const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async verifyOwnerPlaylist({ playlistId, userId }) {
    const query = {
      text: `SELECT * FROM playlists p
        WHERE p.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async verifyPlaylist({ playlistId, userId }) {
    const query = {
      text: `SELECT p.id AS playlist_id,
              p.name AS playlist_name,
              p.owner AS playlist_owner,
              c.user_id AS collaborator_user
        FROM playlists p
        LEFT JOIN collaborations c ON p.id = c.playlist_id
        WHERE p.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];

    if (playlist.collaborator_user !== userId && playlist.playlist_owner !== userId) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addPlaylist({ name, owner }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(userId) {
    const query = {
      text: `SELECT *
        FROM playlists p
        LEFT JOIN users u
        ON p.owner = u.id
        LEFT JOIN collaborations c
        ON p.id = c.playlist_id
        WHERE p.owner = $1 OR c.user_id = $1`,
      values: [userId],
    };

    const result = await this._pool.query(query);
    return result.rows.map(({ id, name, username }) => ({
      id,
      name,
      username,
    }));
  }

  async deletePlaylist({ id, userId }) {
    await this.verifyOwnerPlaylist({ playlistId: id, userId });
    const query = {
      text: 'DELETE FROM playlists WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Playlist gagal dihapus. Id tidak ditemukan.');
    }
  }

  async addSongToPlaylist({ playlistId, songId, userId }) {
    await this.verifyPlaylist({ playlistId, userId });
    const id = nanoid(16);
    const query = {
      text: 'INSERT INTO playlist_songs VALUES ($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Musik gagal ditambahkan ke dalam playlist');
    }
  }

  async getSongByPlaylistId({ id, userId }) {
    await this.verifyPlaylist({ playlistId: id, userId });

    const queryPlaylist = {
      text: `SELECT p.id, p.name, u.username
        FROM playlists p
        LEFT JOIN users u
        ON p.owner = u.id
        WHERE p.id = $1`,
      values: [id],
    };

    const playlistsResult = await this._pool.query(queryPlaylist);

    if (!playlistsResult.rows.length) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const querySongs = {
      text: `SELECT *
        FROM songs s
        LEFT JOIN playlist_songs ps 
        ON ps.song_id = s.id
        WHERE ps.playlist_id = $1`,
      values: [id],
    };

    const songsResult = await this._pool.query(querySongs);
    const playlist = playlistsResult.rows[0];

    return {
      id: playlist.id,
      name: playlist.name,
      username: playlist.username,
      songs: songsResult.rows.map((song) => ({
        id: song.id,
        title: song.title,
        performer: song.performer,
      })),
    };
  }

  async deleteSongFromPlaylist({ id, songId, userId }) {
    await this.verifyPlaylist({ playlistId: id, userId });
    const query = {
      text: `DELETE FROM playlist_songs 
        WHERE playlist_id = $1 AND song_id = $2
        RETURNING id`,
      values: [id, songId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new InvariantError('Musik gagal dihapus dari playlist');
    }
  }
}

module.exports = PlaylistsService;
