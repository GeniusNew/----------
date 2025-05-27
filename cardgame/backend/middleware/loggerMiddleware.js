const loggerMiddleware = (req, res, next) => {
  // 记录请求详情
  console.log(`\n----- ${new Date().toISOString()} -----`);
  console.log(`${req.method} ${req.url}`);
  console.log('请求头:', JSON.stringify({
    authorization: req.headers.authorization ? '存在，但隐藏敏感信息' : '不存在',
    'content-type': req.headers['content-type']
  }));
  
  // 记录请求体（但不记录密码）
  const logBody = req.body ? { ...req.body } : {};
  if (logBody.password) logBody.password = '***隐藏***';
  console.log('请求体:', JSON.stringify(logBody));
  
  // 捕获响应
  const originalSend = res.send;
  res.send = function(body) {
    const logResponse = typeof body === 'string' ? 
      (body.length > 500 ? `${body.substring(0, 500)}...（已截断）` : body) : 
      body;
    console.log(`响应状态: ${res.statusCode}`);
    console.log(`响应体: ${JSON.stringify(logResponse)}`);
    console.log('----- 请求结束 -----\n');
    
    originalSend.call(this, body);
  };
  
  next();
};

module.exports = loggerMiddleware; 