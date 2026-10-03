// Erreur HTTP à lancer depuis un controller ou un middleware : le gestionnaire
// d'erreurs (src/app.js) renvoie { error: message, code } au client. `code` est
// un identifiant métier stable (ex. "ATHLETE_NOT_SUBSCRIBED") que le front peut
// tester sans dépendre du texte du message.
class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = HttpError;
