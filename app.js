
var http = require('http');  
var url = require('url');  
var reqq = require('sync-request');
var yelp= require('yelp-fusion');
var fs = require('fs');
var location='';
const apiKey = 'hGyReLqIL3t-qvtD_94G8wU03tuUWL9t_ql2FhSVoilMQLECNCvpukMrb9oQxIe5VK4CIQksf3ES1AgDflaBFNKqzcorfhw1eAvXHySfgJH7D7N7_nwHPEeLeJbTXXYx';

var createServer = http.createServer(onRequest);  
  
function onRequest(request, response) {  
  if(request.url.endsWith("/index.html")){
   fs.readFile("./index.html", function (err, data) {
      response.writeHead(200, {'Content-Type': 'text/html'});
      response.write(data);
      response.end();
   });
  }
    var todo = url.parse(request.url,true)['query']['todo'];
    var nearbykey="AIzaSyD1aKalf821pJcM1jmf6c6pZss8FjEMGic";
    
      if(todo == "placetable"){
    	var keyword = url.parse(request.url, true)['query']['key_word'];
        
    	//console.log(keyword);
    	keyword=encodeURI(keyword);
    	
    	var type = url.parse(request.url,true)['query']['category'];
    	type = encodeURI(type);
    	
    	var radius = 0; 
      if(url.parse(request.url,true)['query']['distance'] == ""){
      	radius = 10;
      }else{
      	radius = url.parse(request.url,true)['query']['distance'];
      }
      var mtradius = radius * 1609;
      if (mtradius>50000){
      	mtradius=50000;
      }
    
      if(url.parse(request.url,true)['query']['Locationchoice']=="option1"){
           location = url.parse(request.url,true)['query']['herela'] + ',' + url.parse(request.url,true)['query']['herelo'];
      }else if(url.parse(request.url,true)['query']['Locationchoice'] == "option2"){
      	 splocation = url.parse(request.url,true)['query']['locationname'];
      	 splocation = encodeURI(splocation);

    	 var urlsp = "https://maps.googleapis.com/maps/api/geocode/json?address="+ splocation + "&key=AIzaSyCA0roe3dnx-M00HRvjPaXvTf8xjwEgWso";   
         try{  
          var resq = reqq('GET', urlsp);
          var jsonsp = JSON.parse(resq.getBody('utf8'));
           if(jsonsp['status']=="OK"){
           lat = jsonsp['results'][0]['geometry']['location']['lat'];
           lng = jsonsp['results'][0]['geometry']['location']['lng'];
           location=lat+','+lng;
    	  //console.log(location);
            }else if(jsonsp['status']=="ZERO_RESULTS"){
            location='';
            }//else
          }//try
          catch(err){
            response.write("failed");
           //console.log('zheli');
          }	
    }

    var googlenearby = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+location+"&radius="+mtradius+"&type="+type+"&keyword="+keyword+"&key="+nearbykey;
    try{
    var resq = reqq('GET', googlenearby);	
    var googlenear = JSON.parse(resq.getBody('utf8'));
    //console.log(googlenear);	

    response.writeHead(200, {  
        'Content-Type': 'application/json',  
        'Access-Control-Allow-Origin': '*'  
    });  
    var str = JSON.stringify(googlenear);  
    response.write(str);  
    }//try
    catch(err){
        response.write('failed');
    }
    response.end();  
  }//if todo==placetable


    if(todo=='nextrq'){
        //console.log('ok');
        var nextpage = url.parse(request.url, true)['query']['nextpage'];
        //console.log(nextpage);
        var urlnx="https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken="+nextpage+"&key="+nearbykey;
        try{
        var resq = reqq('GET',urlnx);
        var nextresult = JSON.parse(resq.getBody('utf8'));
        response.writeHead(200, {  
            'Content-Type': 'application/json',  
            'Access-Control-Allow-Origin': '*'  
        });  
        var str = JSON.stringify(nextresult);  
        response.write(str); 
        }//try
        catch(err){
           response.write('failed');
        }//catch

         response.end();  
    }//if todo = nextrq
    


    if(todo=='yelpreq'){
        
        var dtplacename=url.parse(request.url, true)['query']['name'];
        var yelpadd=url.parse(request.url, true)['query']['address1'];
        var yelpcity=url.parse(request.url, true)['query']['city'];
        var yelpcountry=url.parse(request.url, true)['query']['country'];
        var yelpstate=url.parse(request.url, true)['query']['state'];
        
        var client = yelp.client(apiKey);

        response.writeHead(200, {  
            'Content-Type': 'application/json',  
            'Access-Control-Allow-Origin': '*'  
        });  

        client.businessMatch({
          name: dtplacename,
          address1: yelpadd,
          city: yelpcity,
          state: yelpstate,
          country: yelpcountry,
          match_threshold:'default',
          limit:1
        }).then(resp => { 
         var bstmatch = resp.jsonBody.businesses;
         //console.log(bstmatch);
        if(bstmatch!=''){
          if(bstmatch[0].hasOwnProperty('name')){
            //if(bstmatch[0].name==dtplacename){
              if(bstmatch[0].hasOwnProperty('id')){
                var matchid=bstmatch[0].id;
                //console.log(matchid);
                client.reviews(matchid).then(respo => {
                  //console.log(respo.jsonBody.reviews);
                  var yelpreviews=respo.jsonBody.reviews;
                  var str = JSON.stringify(yelpreviews); 
                  response.write(str); 
                  response.end(); 
                }).catch(e => {
                  console.log(e);
                  var errormg=[{'nomatch':'error'}];
                  var str = JSON.stringify(errormg); 
                  response.write(str); 
                  response.end(); 
                });
              }else{
              var nomatchst = [{'nomatch':'nomatch'}]; 
              var str = JSON.stringify(nomatchst); 
                  response.write(str); 
                  response.end(); 
              }//else if id        
          }else{
            var nomatchst = [{'nomatch':'nomatch'}]; 
              var str = JSON.stringify(nomatchst); 
                  response.write(str); 
                  response.end(); 
          }//if has name
        }else{
               var nomatchst = [{'nomatch':'nomatch'}]; 
              var str = JSON.stringify(nomatchst); 
                  response.write(str); 
                  response.end(); 
        }//else if bstmatch 不是空



        }).catch(e => {
          console.log(e);
          var errormg=[{'nomatch':'error'}];
                  var str = JSON.stringify(errormg); 
                  response.write(str); 
                  response.end();  
        });
    }//if yelpreq
    
}//function
createServer.listen(8000);   
 //var myport = 8000;
//sever.listen(process.env.PORT || myport);
// console.log('Server running  at port 8000.'); 










