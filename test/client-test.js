
describe('Client Model', function() {
	var client = new ClientSpace.Client();
	
	it('should exist in the given namespace', function() {
		expect(ClientSpace).to.be.ok;
	    expect(client).to.be.ok;
	});

	it('should initialize properly', function() {
		expect(typeof client.initialize).to.equal('function');
		expect(typeof client.get('currentShow')).to.equal('string');
		
	});

	it('should have cast and show data', function() {
		var shows = [];
		var upcoming = client.get('upcoming');
		for (var key in upcoming) {
			shows.push(upcoming[key]);
		}
		expect(shows.length > 0).to.equal(true);
	});

});

describe('Client Server', function() {
	var server = new ClientSpace.Server();


	it('should know its IP address', function() {
		expect(server.get('ip')).not.to.equal('undefined');
	});

});

