export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}
