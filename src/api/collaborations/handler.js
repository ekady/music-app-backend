class CollaborationsHandler {
  constructor(collaborationsService, playlistsService, validator) {
    this._collaborationsService = collaborationsService;
    this._playlistsService = playlistsService;
    this._validator = validator;

    this.postCollaborationHandler = this.postCollaborationHandler.bind(this);
    this.deleteCollaborationHandler = this.deleteCollaborationHandler.bind(this);
  }

  async postCollaborationHandler(request, h) {
    this._validator.validateCollaborationsPayload(request.payload);

    const { playlistId } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    await this._playlistsService.verifyOwnerPlaylist({ playlistId, userId: credentialId });
    const collaborationId = await this._collaborationsService.addCollaboration(
      request.payload,
    );

    const response = h.response({
      status: 'success',
      message: 'Kolaborasi berhasil ditambahkan',
      data: {
        collaborationId,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCollaborationHandler(request) {
    this._validator.validateCollaborationsPayload(request.payload);

    const { playlistId } = request.payload;
    const { id: credentialId } = request.auth.credentials;
    await this._playlistsService.verifyOwnerPlaylist({ playlistId, userId: credentialId });
    await this._collaborationsService.deleteCollaboration(request.payload);

    return {
      status: 'success',
      message: 'Kolaborasi berhasil dihapus',
    };
  }
}

module.exports = CollaborationsHandler;
