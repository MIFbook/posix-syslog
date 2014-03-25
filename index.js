// Posix Syslog Module
// Christopher Giffard 2013

var posix	= require("posix"),
	util	= require("util");

var syslog = {};

// Enabled masks for logfile...
var masks = {
	'emerg': true,
	'alert': true,
	'crit': true,
	'err': true,
	'warning': true,
	'notice': true,
	'info': true,
	'debug': true
};

var defaultOptions = {
	cons: true,
	ndelay: true,
	pid: true
};

// Generate log functions based on mask availability
for (var maskID in masks) {
	if (masks.hasOwnProperty(maskID)) {

		(function(maskID) {
			syslog[maskID] = function() {
				var message = syslog.format.apply(syslog,arguments);
				
				if (!syslog.status) syslog.open();
				
				posix.syslog(maskID,message);
				
				if (syslog.mirror) {
					if (maskID === "emerg"	||
						maskID === "alert"	||
						maskID === "crit"	||
						maskID === "err"	){
						
						console.error(message);
					
					} else if (maskID === "warning") {
						
						console.warn(message);
						
					} else if (maskID === "info") {
						
						console.info(message);
					
					} else {
						
						console.log(message);
					}
					
				}
			};

		})(maskID);
	}
}

// Set our initial connection state
syslog.status = 0;

syslog.upto = function(level) {
    // reset all to false...
    masks = {
        'emerg': false,
        'alert': false,
        'crit': false,
        'err': false,
        'warning': false,
        'notice': false,
        'info': false,
        'debug': false
    };

    // fall-through is on-purpose, we want to enable from point and all that follow    
    switch(level) {
        case 'debug':
            masks.debug = true;
        case 'info':
            masks.info = true;
        case 'notice':
            masks.notice = true;
        case 'warning':
            masks.warning = true;
        case 'err':
            masks.err = true;
        case 'crit':
            masks.crit = true;
        case 'alert':
            masks.alert = true;
        case 'emerg':
            masks.emerg = true;
    };
    
	posix.setlogmask(masks);
};

syslog.format = function() {
	return util.format.apply(util,arguments);
};

syslog.open = function(identity,options,facility) {
	
	if (syslog.status) return;
	
	if (options && options.mirror)
		syslog.mirror = true;
	
	posix.openlog(
		identity	|| "node",
		options		|| defaultOptions,
		facility	|| "local0"
	);
    
	posix.setlogmask(masks);
	
	return !!(syslog.status = 1);
};

syslog.close = function() {
	
	if (!syslog.status) return;
	
	posix.closelog();
	syslog.status = 0;
	
	return true;
};

syslog.log = function() {
	syslog.info.apply(syslog,arguments);
};

syslog.error = function() {
	syslog.alert.apply(syslog,arguments);
};

// Publish existence of module...
module.exports = syslog;