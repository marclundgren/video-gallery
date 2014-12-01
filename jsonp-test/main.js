var URL = 'http://api.flickr.com/services/feeds/photos_public.gne?tags=monkey&tagmode=any&format=json';

// URL = 'http://fidm.edu/wps/wcm/connect/wmo%20content/en/about/fidm%20video%20gallery?WCM_PI=1&cmpntid=eca581a8-c028-48fa-a7ea-e52402f494fe&srv=cmpnt&source=library&WCM_Page.eca581a8-c028-48fa-a7ea-e52402f494fe={page}';

// To define your own callback function name, add the parameter jsoncallback with your desired name as the value.

function jsonFlickrFeed(rsp){
	console.log('rsp: ', rsp);

	if (rsp.stat != "ok"){

		// something broke!
		return;
	}

	for (var i=0; i<rsp.blogs.blog.length; i++){

		var blog = rsp.blogs.blog[i];

		var div = document.createElement('div');
		var txt = document.createTextNode(blog.name);

		div.appendChild(txt);
		document.body.appendChild(div);
	}
}

m.request({
  // callbackKey: 'processJSON',
  dataType: 'jsonp',
  url: URL
}).then(function(promisedData) {
	console.log('promisedData: ', promisedData);

  console.log('yay!');
});