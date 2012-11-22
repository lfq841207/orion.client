/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 * Contributors: IBM Corporation - initial API and implementation
 ******************************************************************************/
/*global define eclipse window parent document*/

define(["orion/xhr", "orion/plugin", "orion/Deferred", "domReady!"], function(xhr, PluginProvider, Deferred) {
	var temp = document.createElement('a');
	temp.href = "../mixloginstatic/LoginWindow.html";
	var login = temp.href;
	var headers = {
		name: "Orion Task Management Service",
		version: "1.0",
		description: "This plugin provides access to the tasks a user is currently running or ran recently, and provides management of those tasks.",
		login: login
	};

	var provider = new PluginProvider(headers);

	function makeParentRelative(location) {
		try {
			if (window.location.host === parent.location.host && window.location.protocol === parent.location.protocol) {
				return location.substring(parent.location.href.indexOf(parent.location.host) + parent.location.host.length);
			}
		} catch (e) {
			//skip
		}
		return location;
	}

	temp.href = "../task";
	var base = makeParentRelative(temp.href);

	// testing that command service handles image-less actions properly
	provider.registerService("orion.core.operation", {
		getOperations: function(contUpdate) {
		
			if(contUpdate){
				var that = this;
				var options = {Longpolling: true};
				var deferred = new Deferred();
				
				function requestLongpolling(longpollingId, deferred){
					if(longpollingId){
						options.LongpollingId = longpollingId;
					}
					xhr("GET", base, {
						headers: {
							"Orion-Version": "1"
						},
						query: options,
						timeout: 70000
					}).then(function(resp) {
						var result = resp.response ? JSON.parse(resp.response) : null;
						deferred.progress(result);
						requestLongpolling(result.LongpollingId, deferred);
					}, function(error){
						if("timeout"===error.dojoType){
							requestLongpolling(longpollingId, deferred);
						}
						deferred.reject(error);
					});
				}
				
				requestLongpolling(null, deferred);
				return deferred;
			}
					
			return xhr("GET", base, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		getOperation: function(taskLocation) {
			function readTask(taskLocation, deferred){
				return xhr("GET", taskLocation, {
					headers: {
						"Orion-Version": "1"
					},
					timeout: 15000
				}).then(function(result) {
					var task = result.response ? JSON.parse(result.response) :{};
					deferred.progress(task);
					if(task.Running){
						setTimeout(function(){readTask(taskLocation, deferred);}, 2000);
					} else {
						if(task.Result && task.Result.Severity === "Ok"){
							deferred.resolve(task.Result.JsonData);
						} else {
							deferred.reject(task.Result);
						}
					}
				});				
			}
			var deferred = new Deferred();
			readTask(taskLocation, deferred);
			return deferred;
		},
		removeCompletedOperations: function() {
			return xhr("DELETE", base, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		removeOperation: function(taskLocation) {
			return xhr("DELETE", taskLocation, {
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		},
		cancelOperation: function(taskLocation) {
			return xhr("PUT", taskLocation, {
				data: JSON.stringify({
					Cancel: true
				}),
				headers: {
					"Orion-Version": "1"
				},
				timeout: 15000
			}).then(function(result) {
				return result.response ? JSON.parse(result.response) : null;
			});
		}
	}, {
		name: "Tasks",
		pattern: base,
		global:true
	});
	provider.connect();
});