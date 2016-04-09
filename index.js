var http=require('http');
var fs=require('fs');
var url=require('url');
var path=require('path');
var mime=require('mime');
var mysql = require('mysql');
var zy = require('./sms_send.js');
var formidable = require('formidable'),      
sys = require('sys'),
io = require('socket.io'); 
var Recdata_name=false;
var Recdata_tel=false;
var Recdata_addr=false; 
var Recdata_pay=false;
var Recdata_yan=false;
var Recdata_take=false;
var Recdata_remark=false;
var Recdata_order_num=false;
var Recdata_username=false;
var Recdata_loginname=false;
var Recdata_loginpassword=false;
var Recdata_registerusername=false;
var Recdata_registerpassword=false;
var word_add=false;
var word_name=false;
var connectionsArray = [];


querystring = require("querystring") 
fs=require('fs');
var cache={};

var db = mysql.createConnection({
  host:     '127.0.0.1',
  user:     'root',
  password :'',
  database: 'print'
});

//配置

zy.setConfig = {
　　//appKey 登录后可以在 管理中心→账号信息 中进行查看
　　appKey: 'ca1aca5a0d244e7e90934e7375168cc5',
　　//taken 登录后可以在 管理中心→应用管理 中进行查看
　　token: 'Y44793g6YB04',
　　//templateId  这个就是你的短信签名了， 登录后可以在 管理中心→短信签名 中进行查看
  templateId: 'RSETSESEKESE'

};

var server=http.createServer(function (req,res){

	var pathname=url.parse(req.url).pathname;
		//console.log("Request for "+pathname+" recived");
	var filePath=false;
	if(req.url=="/upload.html"){
		console.log("/upload");
		upload(req,res);
	}
		if(req.url=='/'){
		filePath='public/index.html';
	}else{
		filePath='public'+req.url;
	}

	var absPath='./'+filePath;
	serverStatic(res,cache,absPath);
	
});
function serverStatic(res,cache,absPath){
	if(cache[absPath]){
		sendfile(res,absPath,cache[absPath]);
	}else{
		fs.exists(absPath,function(exists){
			if(exists){
				fs.readFile(absPath,function(err,data){
				if(err){
					send404(res);
				}else{
					cache[absPath]=data;
					sendfile(res,absPath,data);
				}
			});
		}else{
			send404(res);
		}
		});
	}
}

function send404(res){
	res.writeHead(404,{'Content-Type':'text/plain'});
	res.write('Error 404:resoure not found');
	res.end();
}
function sendfile(res,filePath,fileContents){
	res.writeHead(
		200,
		{'content-Type':mime.lookup(path.basename(filePath))}
		);
	res.end(fileContents)
}
function upload(req,res){
	var form = new formidable.IncomingForm();
	var filename=false;
	form.uploadDir="./public/wenjian";   
	form.parse(req, function(err, fields, files) {   
		//将文件名以.分隔，取得数组最后一项作为文件后缀名。    
	//var types = files.upload.name.split('.');
	// try{
	word_name=filename=files.upload.name;
	word_add="./public/wenjian/"+filename;
		console.log(filename);
		var fileaddr="";
		var current = new Date().getTime(); 
		Recdata_order_num=current;
		console.log("订单号:E"+Recdata_order_num);	
		fs.renameSync(files.upload.path, "./public/wenjian/"+filename); 
		fileaddr="C:\\Users\\Administrator\\Desktop\\e-print3.0\\public\\wenjian\\"+filename; 
		console.log(fileaddr);
    //console.log(Recdata_addr); 
		//word2pdf(fileaddr); 
		
    if(Recdata_name!="姓名"&&Recdata_tel!="电话号码"&&Recdata_addr!="地址"&&Recdata_name!=false&&Recdata_tel!=false)
    {
      console.log("we will into send2qiantai.................");
    	send2qiantai(Recdata_order_num);
        //word转PDF
      var cmd=require('child_process').spawn('cmd',['/c','C: && cd \\Users\\Administrator\\Desktop && java -jar word2pdf.jar '+fileaddr]);
      cmd.stdout.on('data',function (data){
        console.log('stdout:'+data);
      });
      cmd.stderr.on('data',function(data){
        console.log('stderr:'+data);
      });
      cmd.on('exit',function(code){
      //console.log(Recdata_name+Recdata_tel+Recdata_addr); 
        console.log("child process exited with code "+code);
      });
    	console.log(Recdata_name+","+Recdata_tel+","+Recdata_addr);
    	db.query(
   		"INSERT INTO cus_info (name,tel,address)"+
   		"VALUES(?,?,?)",
   		[Recdata_name,Recdata_tel,Recdata_addr],
  		function(err){
		if(err) throw err;
});
     	console.log(Recdata_order_num+Recdata_name+word_name+Recdata_tel+Recdata_addr+word_add+Recdata_pay+Recdata_take+Recdata_remark);
 //    	db.query(
 //   		"INSERT INTO printed (order_num,name,word_name,tel,address,word_add,pay,take,remark)"+
 //   		"VALUES(?,?,?,?,?,?,?,?,?)",
 //   		[Recdata_order_num,Recdata_name,word_name,Recdata_tel,Recdata_addr,word_add,Recdata_pay,Recdata_take,Recdata_remark],
 //  		function(err){
	// 	if(err) throw err;
	// });
    	db.query(
   		"INSERT INTO printing (order_num,name,word_name,tel,address,word_add,pay,take,remark)"+
   		"VALUES(?,?,?,?,?,?,?,?,?)",
   		[Recdata_order_num,Recdata_name,word_name,Recdata_tel,Recdata_addr,word_add,Recdata_pay,Recdata_take,Recdata_remark],
  		function(err){
		if(err) throw err;
	});
    }else if(Recdata_name=false&&Recdata_tel!=false&&Recdata_addr!=false){
    	//sendError2qiantai("300")
    	console.log("Error .....In this wayy");
    }

});     
return;
}
server.listen(3000);
console.log('Server is running in 127.0.0.1:3000');
var yoursocket = io.listen(server).set('log', 1);
yoursocket.on('connection', function (client) { 
	 connectionsArray.push(client);
   //1.YourcustomMessage_loginname
	 client.on('YourcustomMessage_loginname', function (data) {  
        console.log('Client Custom Message_loginname: ', data); 
        Recdata_loginname=data; 
		console.log(Recdata_loginname);
        //client.emit('YourMessageResponse', data );
   }); 
   //2.YourcustomMessage_loginpassword
   client.on('YourcustomMessage_loginpassword', function (data) {  
        console.log('Client Custom Message_loginpassword: ', data); 
        Recdata_loginpassword=data; 
				console.log(Recdata_loginpassword);
     var query=db.query('select * from cusinformation where tel like '+Recdata_loginname),
   articles1 = []; 
   query
    .on('error', function(err) {
      // 查询出错处理
      console.log(err);
      client.emit('YourMessageResponse_authentication', "0" );
    })
    .on('result', function(user) {
      // 加入查询到的结果到articles数组
      articles1.push(user);
    })
    .on('end', function() {
      // 检查是否有客户端连接，有连接就继续查询数据库
      try{
          if(Recdata_loginpassword==articles1[0].password){
            client.emit('YourMessageResponse_authentication', "1" );
          }
      }catch(err){
            client.emit('YourMessageResponse_authentication', "0" );
      }
      
   });
				//authentication(Recdata_loginname,Recdata_loginpassword);
        //client.emit('YourMessageResponse', data );
   });
   //12 YourcustomMessage_yan
   client.on('YourcustomMessage_yan', function (data) {  
        console.log('Client Custom Message_yan: ', data); 
        Recdata_yan=data; 
        console.log(Recdata_yan);
        var numrand=false;
        if(data!=""){
        numrand=Math.floor(Math.random()*1000000);
        console.log("验证码发送结果为："+numrand);
        console.log("发送短信验证码。。。");
        
        /*发送短信验证码
        /*phone 接受短信的用户手机号码
        /*code 发送的验证码数据（怎么生成就自己来了）
        /*callback 回调函数
        */
        /**
        　　/*回调函数
        　　/*err 错误信息（如网络连接问题……）
        　　/*data 所有数据（验证码发送结果存在与body中）
        　　/*mess 验证码发送结果
        　　/*（data中存放着所有返回参数，而mess中只存放着验证码发送结果的json字符串。json字符串又通过JSON.parse()来转换成json取值）
        　　/* 0---->失败  1---->成功
            */
        zy.sendSms(
            Recdata_yan,
            numrand,
        　　function(err,data,mess){
        　　　　if(err){
                    client.emit('YourMessageResponse_yan', "0" );
                    console.log("YourMessageResponse_yan--->0");
        　　　　　　console.log(err);
        　　　　}else{
        　　　　　　client.emit('YourMessageResponse_yan', numrand );
                    console.log("YourMessageResponse_yan--->"+numrand);
                    console.log("发送短信成功");
        　　　　　　console.log(JSON.parse(data.body).reason);   
        　　　　　　console.log(JSON.parse(mess).reason);
        　　　　}
        　　}
        );
        }
        
        //client.emit('YourMessageResponse', data );
   });
   //3. YourcustomMessage_registerusername
    client.on('YourcustomMessage_registerusername', function (data) {  
        console.log('Client Custom Message_registerusername: ', data); 
        Recdata_registerusername=data; 
		console.log(Recdata_registerusername);
        //client.emit('YourMessageResponse', data );
   });
   //4.YourcustomMessage_registerpassword
   client.on('YourcustomMessage_registerpassword', function (data) {  
        console.log('Client Custom Message_registerpassword: ', data); 
        Recdata_registerpassword=data; 
		console.log(Recdata_registerpassword);
    //处理用户的登陆情况先查询是否存在，不存在 就创建
    var query = db.query('SELECT * FROM cusinformation where tel like '+Recdata_registerusername),
    articles2 = [];
    query
    .on('error', function(err) {
      // 查询出错处理
      console.log(err);

    })
    .on('result', function(user) {
      // 加入查询到的结果到articles数组
      articles2.push(user);
    })
    .on('end', function() {
      // 检查是否有客户端连接，有连接就继续查询数据库
      try{
      //测试articles2[0].tel是否存在，如何报错则不存在，可以注册
      console.log("test user exist :"+articles2[0].tel);
      client.emit('YourMessageResponse_ifregister', "0" );
      console.log("YourMessageResponse_ifregister--->0");
      }catch(err){
      //用户不存在，写入数据库
      db.query(
        "insert into cusinformation (name,tel,password,gender)"
        +"values(?,?,?,?)",
        [" ",Recdata_registerusername,Recdata_registerpassword,"0"],
        function(err){
        if(err) throw err;
        });
        client.emit('YourMessageResponse_ifregister', "1" );
      console.log("YourMessageResponse_ifregister--->1");
      }
    });
        //client.emit('YourMessageResponse', data );
   });
   //5.YourcustomMessage_name
    client.on('YourcustomMessage_name', function (data) {  
        console.log('Client Custom Message_name: ', data); 
        Recdata_name=data; 
		console.log(Recdata_name);
        //client.emit('YourMessageResponse', data );
   }); 
   //6. YourcustomMessage_tel
    client.on('YourcustomMessage_tel', function (data) {  
        console.log('Client Custom Message_tel: ', data); 
        Recdata_tel=data; 
        console.log(Recdata_tel);
        //client.emit('YourMessageResponse', data );
   });
   //7.YourcustomMessage_username
   client.on('YourcustomMessage_username', function (data) {  
        console.log('Client Custom Message_username: ', data); 
        Recdata_username=data; 
        console.log(Recdata_username);
        callbackperson(Recdata_username);
        //client.emit('YourMessageResponse', data );
   });
   //8.YourcustomMessage_addr
    client.on('YourcustomMessage_addr', function (data) {  
        console.log('Client Custom Message_addr: ', data); 
        Recdata_addr=data; 
        console.log(Recdata_addr);
        //client.emit('YourMessageResponse', data );
   });
   //9.YourcustomMessage_take
    client.on('YourcustomMessage_take', function (data) {  
        console.log('Client Custom Message_addr: ', data); 
        Recdata_take=data; 
        console.log(Recdata_take);
        //client.emit('YourMessageResponse', data );
   });
   //10.YourcustomMessage_pay
    client.on('YourcustomMessage_pay', function (data) {  
        console.log('Client Custom Message_pay: ', data); 
        Recdata_pay=data; 
        console.log(Recdata_pay);
        //client.emit('YourMessageResponse', data );
   });
   //11.YourcustomMessage_remark
    client.on('YourcustomMessage_remark', function (data) {  
        console.log('Client Custom Message_remark: ', data); 
        Recdata_remark=data; 
        console.log(Recdata_remark);
        //upload(req,res);
        //client.emit('YourMessageResponse', data );
   });
 
    client.on('disconnect', function () {  
        console.log('Your Client disconnected');  
    });  
}); 
function sendError2qiantai(data){
	yoursocket.on('connection', function (client) { 
		 client.emit('YourMessageResponse', data );
	});
	
}
function authentication(dat1,dat2){
yoursocket.on('connection', function (client) {
console.log("Now in authentication ..............."); 
     var query=db.query('select * from cusinformation where tel like '+dat1),
   articles1 = []; 
   query
    .on('error', function(err) {
      // 查询出错处理
      console.log(err);
      client.emit('YourMessageResponse_authentication', "0" );
    })
    .on('result', function(user) {
      // 加入查询到的结果到articles数组
      articles1.push(user);
    })
    .on('end', function() {
      // 检查是否有客户端连接，有连接就继续查询数据库
      console.log(dat2+'------'+articles1[0].password);
      if(dat2==articles1[0].password){
        client.emit('YourMessageResponse_authentication', "1" );
      }else {
        client.emit('YourMessageResponse_authentication', "0" );
      }
   });
  });
}
function send2qiantai(data){
	yoursocket.on('connection', function (client) { 
     console.log("YourMessageResponse_order_num--->"+data);
		 client.emit('YourMessageResponse_order_num', data );
	});
}
function callbackperson(data){
	 var query=db.query('select * from printed where tel like '+data),
	 articles=[];
	 query.on('error',function(err){
	 	// 查询出错处理
      console.log(err);
	 })
	 .on('result', function(user) {
      // 加入查询到的结果到articles数组
      articles.push(user);
    })
    .on('end', function() {
      // 检查是否有客户端连接，有连接就继续查询数据库
      updateSockets({
          articles: articles
        });
      try{
      console.log(articles[0].name+"my in pollingLoop");
      yoursocket.on('connection', function (client) { 
         client.emit('YourMessageResponse_myoder', data );
      });
  }catch (err){
    yoursocket.on('connection', function (client) { 
    console.log("YourMessageResponse_personerr---->0");
     client.emit('YourMessageResponse_personerr', "0" );
     
  });
  }
    }); 
}
var updateSockets = function(data) {
  // 加上最新的更新时间
  data.time = new Date();
  // 推送最新的更新信息到所以连接到服务器的客户端
  connectionsArray.forEach(function(tmpSocket) {
    tmpSocket.volatile.emit('notification', data);
  });
};




