var http = require('http');
var path = require('path');
var request = require('request');
var url = require('url');
var cheerio = require('cheerio');
var fs = require('fs');
var im = require('imagemagick');

var imageCount = 0;
var imagePerFolder = 200;
var pageCount = 0;
var mkdirp = require('mkdirp');
mkdirp('downloaded/0');
mkdirp('cropped/0');

openHaivl('http://haivl.com',0);

function openHaivl(url,page){
	request({uri:url},function(err,response,body){
		var self = this;
		self.items = new Array();
	
		if(err){
			console.log('Request failed');
		}else{
			$ = cheerio.load(body);
			console.log($('title').text());
			var $thumbList = $('.thumbnail');	
		
			$thumbList.each(function(i,item){
				var $a = $(item).find('a');
				var href = $a.attr('href');
				var img = $a.find('img').attr('src');
				var title = $a.find('img').attr('alt');			
				var nameArr = img.split('/');
				var filename = nameArr[nameArr.length-1];						
				imageCount++;
				if(imageCount > imagePerFolder){
					imageCount = 0;
					pageCount++;
					mkdirp('downloaded/'+pageCount);
					mkdirp('cropped/'+pageCount);
				}				
				if(filename!='0.jpg'){
					downloadFile(img,filename,function(){
						cropHaivlImage(filename);				
					});
				}
				
			});

			if($thumbList.length == 0){
				console.log('Out of images');
				return false;
			}
			page++;
			openHaivl('http://haivl.com/new/'+page,page);				
		}
		
	})
}
function downloadFile(sourceUrl,destination,callback){
	callback = callback || function(){};
	console.log('Download from '+sourceUrl+' to '+destination);

	var file = fs.createWriteStream('downloaded/'+pageCount+'/'+destination);
	var request = http.get(sourceUrl, function(response) {
	  response.pipe(file,{
	  	end:true
	  });
	  response.on('end',function(){
	  	callback();
	  });
	});
	request.on('error',function(){
		return false;
	});
}

function cropHaivlImage(filename){
	im.identify('downloaded/'+pageCount+'/'+filename, function(err, output){
		if (err){
			return false;
		}
		console.log('Cropping ' + filename);
	  	im.crop({
	  		srcPath: 'downloaded/'+pageCount+'/'+filename,		 
		  	width: output.width,
		  	height: output.height - 30,
		  	quality: 1,
		  	gravity: "North"
		  
	  	},function(err,stdout,strerr){
	  		if(err){
	  			return false;
	  		}
	  		fs.writeFileSync('cropped/'+pageCount+'/'+filename, stdout, 'binary');	  		
	  	});
	  
	});
		
}
