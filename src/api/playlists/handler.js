class PlaylistHandler {
  constructor(
    playlistsService,
    songsService,
    playlistActivitiesService,
    validator,
  ) {
    this._playlistsService = playlistsService;
    this._songsService = songsService;
    this._playlistActivitiesService = playlistActivitiesService;
    this._validator = validator;

    this.postPlaylistHandler = this.postPlaylistHandler.bind(this);
    this.getPlaylistsHandler = this.getPlaylistsHandler.bind(this);
    this.deletePlaylistByIdHandler = this.deletePlaylistByIdHandler.bind(this);
    this.postSongToPlaylistHandler = this.postSongToPlaylistHandler.bind(this);
    this.getSongByPlaylistIdHandler = this.getSongByPlaylistIdHandler.bind(this);
    this.deleteSongFromPlaylistByIdHandler = this.deleteSongFromPlaylistByIdHandler.bind(this);
    this.getPlaylistActivities = this.getPlaylistActivities.bind(this);
  }

  async postPlaylistHandler(request, h) {
    this._validator.validatePlaylistPayload(request.payload);
    const { id: credentialId } = request.auth.credentials;
    const { name } = request.payload;
    const playlistId = await this._playlistsService.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      message: 'Playlist berhasil ditambahkan',
      data: { playlistId },
    });
    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this._playlistsService.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistByIdHandler(request) {
    const { id: userId } = request.auth.credentials;
    const { id } = request.params;
    await this._playlistsService.deletePlaylist({ id, userId });

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._songsService.getSongById(songId);
    await this._playlistsService.addSongToPlaylist({
      playlistId,
      songId,
      userId,
    });
    await this._playlistActivitiesService.createPlaylistActivity({
      playlistId,
      songId,
      userId,
      action: 'add',
    });

    const response = h.response({
      status: 'success',
      message: 'Lagu  berhasil ditambahkan ke dalam playlist',
    });
    response.code(201);
    return response;
  }

  async getSongByPlaylistIdHandler(request) {
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    const playlist = await this._playlistsService.getSongByPlaylistId({
      id,
      userId,
    });
    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongFromPlaylistByIdHandler(request) {
    this._validator.validatePlaylistSongPayload(request.payload);
    const { songId } = request.payload;
    const { id } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._songsService.getSongById(songId);
    await this._playlistsService.deleteSongFromPlaylist({ id, songId, userId });
    await this._playlistActivitiesService.createPlaylistActivity({
      playlistId: id,
      songId,
      userId,
      action: 'delete',
    });

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }

  async getPlaylistActivities(request) {
    const { id: playlistId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._playlistsService.verifyPlaylist({ playlistId, userId });
    const activities = await this._playlistActivitiesService.getPlaylistActivities({
      playlistId,
    });

    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistHandler;
