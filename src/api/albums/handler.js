const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(service, storageService, validator, uploadsValidator) {
    this._service = service;
    this._storageService = storageService;
    this._validator = validator;
    this._uploadsValidator = uploadsValidator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const albumId = await this._service.addAlbum(request.payload);

    const response = h.response({
      status: 'success',
      message: 'Album berhasil ditambahkan',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadImageHandler(request, h) {
    const { cover } = request.payload;
    this._uploadsValidator.validateImageHeaders(cover.hapi.headers);

    const { id } = request.params;
    const album = await this._service.getAlbumById(id);

    const fileLocation = await this._storageService.writeFile(
      cover,
      cover.hapi,
    );

    await this._service.editAlbumById(id, {
      name: album.name,
      year: album.year,
      coverUrl: fileLocation,
    });

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postUserLikeAlbum(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.getAlbumById(albumId);
    await this._service.checkUserLikeAlbum({ userId, albumId });
    await this._service.addUserLikeAlbum({ userId, albumId });

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
    });
    response.code(201);
    return response;
  }

  async deleteUserLikeAlbum(request) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this._service.deleteuserLikeAlbum({ albumId, userId });

    return {
      status: 'success',
      message: 'Anda berhasil membatalkan like pada album ini',
    };
  }

  async getAlbumLikes(request, h) {
    const { id: albumId } = request.params;

    const data = await this._service.getAlbumLikes({ albumId });

    const response = h
      .response({
        status: 'success',
        data: {
          likes: data.data.length,
        },
      })
      .header('X-Data-Source', data.cache ? 'cache' : '');
    return response;
  }
}

module.exports = AlbumsHandler;
