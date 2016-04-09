//建立MySQL连接, 根据自己环境修改相应的数据库信息
var app = require('http').createServer(handler);
  io = require('socket.io').listen(app),
  fs = require('fs'),
  url=require('url'),
  mysql = require('mysql'),
  filename=false;
  filepath=false;
  file_order_num=false;
  connectionsArray = [],
connection = mysql.createConnection({
    host:     '127.0.0.1',
    user:     'root',
    password :'',
    database: 'print'
  }),
  POLLING_INTERVAL = 1000,
  // pollingTimer;

// 检查数据库连接是否正常
connection.connect(function(err) {
  // 不出现错误信息，那表示数据库连接成功
  console.log(err);
});

//启动HTTP服务，绑定端口8080
app.listen(3333);

// 加载客户端首页
function handler(req, res) {
  var pathname=url.parse(req.url).pathname;
    console.log("Request for "+pathname+" recived");
    if(pathname=="/download"){
      console.log("this place for download");
      download(res);
    }else{
    fs.readFile(__dirname + '/public/client.html', function(err, data) {
    if (err) {
      console.log(err);
      res.writeHead(500);
      return res.end('加载客户端首页发生错误...');
    }
    res.writeHead(200);
    res.end(data);
  });
    }
}

function download(res){
  console.log("filename is "+filename);
  console.log("filepath is"+filepath);
  console.log("order_num"+file_order_num);
  var query = connection.query('DELETE FROM printing where order_num like '+file_order_num),
    articles = [];
    query
    .on('error', function(err) {
      // 查询出错处理
      console.log(err);
    })
    .on('result', function(user) {
      // 加入查询到的结果到articles数组
      articles.push(user);
    })
    .on('end', function() {
      // 检查是否有客户端连接，有连接就继续查询数据库
      console.log("我可以删除的地址："+articles[0].word_add);

    });

  res.setHeader('Content-disposition', 'attachment; filename='+filename);
  res.setHeader('Content-type', 'application/pdf');
  var fstream = fs.createReadStream(filepath);
  fstream.on('data',function(filebody){
  res.write(filebody);
});
fstream.on('end', function() {
    console.log("end");
    res.end();});
fstream.on('error',function(err){
    console.log(err);
}) 

  //   res.writeHead(200,{
  //     'Content-Type': 'application/msword',
  //     'Content-Disposition': 'attachment; filename=test1.doc'
  // });
  //    pdf.pipe(res);
  console.log("this is download() res");
 
}
/*
 * 这个就是实现主要功能的方法，间隔3秒去查询数据库表，有更新就推送给客户端
 */
var pollingLoop = function() {

  // 查询数据库
  var query = connection.query('SELECT * FROM printing'),
    articles = []; // 用于保存查询结果

  // 查询结果监听
  query
    .on('error', function(err) {
      // 查询出错处理
      console.log(err);
      updateSockets(err);
    })
    .on('result', function(user) {
      // 加入查询到的结果到articles数组
      articles.push(user);
    })
    .on('end', function() {
      // 检查是否有客户端连接，有连接就继续查询数据库
      if (connectionsArray.length) {
        pollingTimer = setTimeout(pollingLoop, POLLING_INTERVAL);

        updateSockets({
          articles: articles
        });
      }
    //  console.log(articles[0].name+"my in pollingLoop");
    });

};


// 创建一个websocket连接，实时更新数据
io.sockets.on('connection', function(socket) {
 // socket.on('YourMessageResponse_order_num',function(data){
 //  console.log(data+ "in my view");
 //  });
  console.log('当前连接客户端数量:' + connectionsArray.length);
  // 有客户端连接的时候才去查询，不然都是浪费资源
  if (!connectionsArray.length) {
    pollingLoop();
  }
  socket.on('disconnect', function() {
    var socketIndex = connectionsArray.indexOf(socket);
    console.log('socket = ' + socketIndex + ' disconnected');
    if (socketIndex >= 0) {
      connectionsArray.splice(socketIndex, 1);
    }
  });
   socket.on('YourcustomMessage_00',function(data){
    console.log(data);
    var query = connection.query('SELECT * FROM printing where order_num like '+data),
    articles = [];
    query
    .on('error', function(err) {
      // 查询出错处理
      console.log(err);
    })
    .on('result', function(user) {
      // 加入查询到的结果到articles数组
      articles.push(user);
    })
    .on('end', function() {
      // 检查是否有客户端连接，有连接就继续查询数据库
      console.log(articles[0].word_add);
      filename=articles[0].word_name;
      filepath=articles[0].word_add;
      file_order_num=articles[0].order_num;
      connection.query(
      "INSERT INTO printed (order_num,name,word_name,tel,address,word_add,pay,take,remark)"+
      "VALUES(?,?,?,?,?,?,?,?,?)",
      [articles[0].order_num,articles[0].name,articles[0].word_name,articles[0].tel,articles[0].address,articles[0].word_add,articles[0].pay,articles[0].take,articles[0].remark],
      function(err){
    if(err) throw err;
    console.log("tianjia chengg ");
  });
    });


  });
  console.log('有新的客户端连接!');
  connectionsArray.push(socket);

});

var updateSockets = function(data) {
  // 加上最新的更新时间
  data.time = new Date();
  // 推送最新的更新信息到所以连接到服务器的客户端
  connectionsArray.forEach(function(tmpSocket) {
    tmpSocket.volatile.emit('notification', data);
  });
};