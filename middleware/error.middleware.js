/**
 * 错误处理中间件
 */

export function errorHandler(err, _req, res, _next) {
  console.error('Error:', err);

  // 默认错误响应
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    ok: false,
    message
  });
}

/**
 * 404处理
 */
export function notFoundHandler(_req, res) {
  res.status(404).json({
    ok: false,
    message: 'Not Found'
  });
}
