var express = require('express');
var bodyParser = require('body-parser');

var request = require("request")
// var GoogleMapsLoader = require('google-maps')
// GoogleMapsLoader.KEY = 'AIzaSyAudxHKQN-xuIX9B7a39ILzoLCmiEJrE7U'
// GoogleMapsLoader.LIBRARIES = ['geometry', 'places']

var app = express();

var http = require('http').Server(app)



// use of static file in node app 
app.use(express.static(__dirname));





app.use(bodyParser.urlencoded({
	extended: false
}))

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


var lat, lng, eventsData
var categoryMap = { "food": '110', "Music": '103', "Bussiness": '101' }

// setup post call 
app.post('/messages', (req, res) => {
	console.log(req.body)
	radius = req.body.radius
	category = req.body.category
	fetchEventData(radius, category, res)
})

app.post('/latlng/', (req, res) => {
	console.log("lat lng for place", req.body)
	lat = req.body.lat
	lng = req.body.lng
})

app.post('/remainder', (req, res) => {
	console.log("Received request on remainder API")
	console.log(req.body)
	var email = req.body.email
	var eventName = req.body.name
	var eventDetails = req.body.details
	var eventTime = new Date(req.body.startTime)
	eventTime = eventTime.getTime() / 1000
	var remainderTime = parseInt(req.body.time, 10)
	eventTime -= (remainderTime * 60)
	console.log(eventTime)
	sendMail(email, eventName, eventDetails, eventTime)
	res.write("You will get mail before event")
	res.end()
})

app.get('/map', (req, res) => {
	console.log("received request here")
	res.send(eventsData)
	res.end()
	
})

app.get('/maps', (req, res) => {
	console.log("received request here")
	// res.send(eventsData)
	// res.end()
	res.render("map",{eventsData:"eventsdata"})
})

var server = http.listen(3000, () => {
	console.log("server is running on 3000");
})


function sendMail(email, eventName, eventDetails, eventTime) {
	var options = {
		method: 'POST',
		url: 'https://api.sendgrid.com/v3/mail/send',
		headers:
		{

			'cache-control': 'no-cache',
			'Content-Type': 'application/json',
			Authorization: 'Bearer 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'
		},
		body:
		{
			personalizations:
				[{
					to: [{ email: email }],
					subject: eventName
				}],
			from: { email: 'nikhilpatil123@gmail.com' },
			content: [{ type: 'text/plain', value: eventDetails }],
			send_at: eventTime
		},
		json: true
	};

	request(options, function (error, response, body) {
		if (error) throw new Error(error);

		console.log(body);
	});
}



function fetchEventData(radius, category, res) {

	eventsData = []

	console.log(lat, lng, radius, category)

	var options = {
		method: 'GET',
		url: 'https://www.eventbriteapi.com/v3/events/search',
		qs:
		{
			'location.latitude': lat.toString(),
			'location.longitude': lng.toString(),
			'location.within': radius.toString,
			categories: categoryMap[category],
			expand: 'venue'
		},
		headers:
		{
			'cache-control': 'no-cache',
			Authorization: 'Bearer J7Q7A7DNWVINGBW7OF5T',
			'Content-Type': 'application/json'
		}
	};

	request(options, function (error, response, body) {
		if (error) throw new Error(error);

		// console.log(body)
		var eventResp = JSON.parse(body)
		// console.log(eventResp.events)
		// console.log(eventResp.location)

		eventResp.events.forEach((item, index) => {
			console.log("Item data: ", item)
			var eventData = {}
			eventData['name'] = item.name.text
			eventData['details'] = item.description.text
			eventData['startTime'] = item.start.utc
			var eventVenue = {
				"address": item.venue.address.localized_address_display,
				"latitude": item.venue.latitude,
				"longitude": item.venue.longitude
			}
			eventData["address"] = eventVenue
			console.log("Event data details: ", eventData)
			eventsData.push(eventData)
		})
		res.render("map.html",{evetsData: eventsData})

	})

}







