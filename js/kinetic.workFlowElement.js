Kinetic.WorkFlowElement = function (config)
{
	this.classType = "WorkFlowElement";
	this.vertices 	= new Array();
	/*ioConnections layout = {
				input:{obj:components.input,inputIO:components.input.getIOObject(inputObId)},
				output:{obj:components.ouput,outputIO:components.output.getIOObject(outputObId)}
			}*/
	this.ioConnections = new Array();
	//broker details, either from broker or from the user when creating a nested workflow
	this.brokerProperties = config.brokerProperties;
	this.getInputConnections = function(output)
	{
		//find all connections that have the output as the output
		return _.filter(this.ioConnections, function(io){ return _.isEqual(io.output.obj,output);});
	};
	this.getOutputConnections = function(input)
	{
		//find all connections that have the output as the output
		return _.filter(this.ioConnections, function(io){ return _.isEqual(io.input.obj,input);});
	};
	//inputs could be from the broker or created  when user assigns them for workflow
	this.getInputs = function (com)
	{	
		if(this.brokerProperties.inputs ==undefined)
		{
			this.brokerProperties.inputs = [];
			return this.brokerProperties.inputs;
		}
		else if(com != undefined)
		{
			//this means we are finding inputs for a workflow and need to check all inputs for the component
			return _.filter(this.brokerProperties.inputs,function(i){return _.isEqual(i.com,com)})
		}
		else
		{
			return this.brokerProperties.inputs;
		}
		
	};
	//outputs could be from the broker or created  when user assigns them for workflow
	this.getOutputs = function (com)
	{
		if(this.brokerProperties.outputs ==undefined)
		{	
			this.brokerProperties.outputs = []
			return this.brokerProperties.outputs;
		}
		else if(com != undefined)
		{
			//this means we are finding inputs for a workflow and need to check all inputs for the component
			return _.filter(this.brokerProperties.outputs,function(i){return _.isEqual(i.com,com)})
		}
		else
		{
			return this.brokerProperties.outputs;
		}
	};
	this.getAllIOs = function ()
	{
		return this.getInputs().concat(this.getOutputs());
	}
	this.getIOObject = function(id)
	{
		//loop through all IOs and return id match
		return _.find(this.getAllIOs(), function(IO){ return IO["id"] == id; })
		//return null;
	};
	
	Kinetic.Group.apply(this, [{draggable:config.draggable}]);

}
Kinetic.WorkFlowElement.prototype = {
	connectToEl : function (el)
	{
		//only want to add one connection between this and el
		//this should always bee the output i.e. arrow point towards el
		var that = this;
		foundCon = _.find(this.vertices, function(vert)
					{
						return vert.start == that && vert.end == el;
					});
		if(foundCon == undefined)
		{
			//no connection, so create one
			connection = new Kinetic.Connection({start: this, end: el, lineWidth: 1, color: "black", dashArray: [30,10]}); 
			this.getLayer().add(connection);
			
			this.getLayer().draw();
		}
		WorkFlow_UI.toolbox.checkWhatNext();
	},
	disconnectAllVertices : function ()
	{
		//remove the vertices
		var deleteVerts = this.vertices.slice();
		//remove all the vertices for this workflow
		_.each(deleteVerts,function(vert)
		{
			vert.remove();
		});
	},
	connectTo : function (connectConfig)
	{
		this.getLayer().draw();
		//this is always the output as its being connected to an input
		//need to check whether this map already exists
		var foundCon  = _.find(this.ioConnections,function(ioCon)
						{
							return _.isEqual(ioCon,connectConfig);
						});
		if (foundCon != undefined)
		{
			//this connection has already been defined
			var that = this;
			foundCon = _.find(this.vertices, function(vert)
						{
							return vert.start == that && vert.end == connectConfig.input.obj;
						});
			if(foundCon == undefined)
			{
				//no connection, so create one
				connection = new Kinetic.Connection({start: this, end: connectConfig.input.obj, lineWidth: 1, color: "black", dashArray: [30,10]}); 
				this.getLayer().add(connection);
				
				this.getLayer().draw();
			}
			return false;
		}
		else
		{
			//this is not a current connection
			//so we need to save it in the list
			this.ioConnections.push(connectConfig);
			
			connectConfig.input.obj.ioConnections.push(connectConfig);
			

			
			//check whether we should draw a connection, ie whether the connection has not already been drawn
			var that = this;
			foundCon = _.find(this.vertices, function(vert)
						{
							return vert.start == that && vert.end == connectConfig.input.obj;
						});
			if(foundCon == undefined)
			{
				//no connection, so create one
				connection = new Kinetic.Connection({start: this, end: connectConfig.input.obj, lineWidth: 1, color: "black", dashArray: [30,10]}); 
				this.getLayer().add(connection);
				
				this.getLayer().draw();
			}
			return true;
		}
		WorkFlow_UI.toolbox.checkWhatNext();
	},
	setAllAttrs : function(attrs)
	{
		var self = this;
		_.each(this.children,function(child)
		{
			if(self instanceof Kinetic.WorkFlow)
			{
				child.setAllAttrs(attrs);
			}
			else
			{
				self.setAttrs(attrs);
				child.setAttrs(attrs);
			}
			
		})	
	},
	disconnect :function(connectConfig)
	{
		//this is always the output
		//delete from IO connections
		this.ioConnections.splice(_.indexOf(this.ioConnections, connectConfig),1);
		
		connectConfig.input.obj.ioConnections.splice(_.indexOf(connectConfig.input.obj.ioConnections, connectConfig),1);
		
		//delete from vertices, if this is the last ioconnection for this and input
		var foundCon  = _.find(this.ioConnections,function(ioCon)
						{
							return _.isEqual(ioCon.input.obj,connectConfig.input.obj) && _.isEqual(ioCon.output.obj,connectConfig.output.obj);
						});
		//if its undefined that means there should not be a connection
		if (foundCon == undefined)
		{
			//need to delete
			//find the connection in vertices
			var that = this;
			foundCon = _.find(this.vertices, function(vert)
						{
							return vert.start == that && vert.end == connectConfig.input.obj;
						});
			foundCon.remove();
			this.getLayer().draw();
			
		}
		
	},
	//this is used to delete all the IOs for this element
	//it is used when element is deleted
	deleteAllIOs : function ()
	{
		//loop through all the ioConnections
		//call disconnect on the ouput	
		_.each(this.ioConnections,function(io)
		{
			io.output.obj.disconnect(io);
		});
		//check for IO set for parent
		
		//delete vertices that are for ordering
		this.disconnectAllVertices();

	},
	connectAllIOs : function()
	{
		_.each(this.ioConnections,function(io)
		{
			io.output.obj.connectTo(io);
		});
	},
	addConnectionsToLayer : function ()
	{
		//add connections to th elayer, but only when this element is the start node
		//this avoids duplicates
		for(Vi=0;Vi<this.vertices.length;Vi++) 
		{ 
			if(this.vertices[Vi].start == this)
			{
				this.getLayer().add(this.vertices[Vi]);
			}
		}
	},
	getPositionOfElement : function()
	{
		if(this instanceof Kinetic.WorkFlow)
		{
			if(this.type == Kinetic.WorkFlowType.nested)
			{
				return this.mainElement.getPosition();
			}
		}
		else
		{
			return this.rect.getPosition();
		}
	}
}

Kinetic.GlobalObject.extend(Kinetic.WorkFlowElement, Kinetic.Group);
Kinetic.WorkFlowType = {"main" : 0, "standAlone" : 1, "nested" : 2}; 