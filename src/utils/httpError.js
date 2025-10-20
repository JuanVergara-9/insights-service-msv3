function badRequest(code, message) {
  const err = new Error(message);
  err.status = 400;
  err.code = code;
  return err;
}

function unauthorized(code, message) {
  const err = new Error(message);
  err.status = 401;
  err.code = code;
  return err;
}

function notFound(code, message) {
  const err = new Error(message);
  err.status = 404;
  err.code = code;
  return err;
}

function internalError(code, message) {
  const err = new Error(message);
  err.status = 500;
  err.code = code;
  return err;
}

module.exports = {
  badRequest,
  unauthorized,
  notFound,
  internalError
};
