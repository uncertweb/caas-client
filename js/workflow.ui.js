var WorkFlow_UI = {};
var idCount = 100;
WorkFlow_UI.search =
{
		brokerInfo: new Array(),
        doSearch : function()
        {
        	$("#searchResults").empty();
        	var searchTerm = $('#search').val();
        	UncertWeb.broker.search(searchTerm,
	        function(data)
	        {
	        	brokerInfo = data;
	        },
	        function (data)
	        {
	        	 $("#searchResults").append('<p>An Error has occured</p>');
	        }
	        );
	        _.each(brokerInfo.results,function(res)
	        {
	        	$("#searchResults").append('<ul>');
	        	$("#searchResults").append('<li class="draggable" id=' + _.indexOf(brokerInfo.results, res) + '>' + res.annotation + '</li>');
	        	$("#searchResults").append('</ul>');	        	
	        });
	        if(brokerInfo.results.length == 0)
	        {
		        $("#searchResults").append('<p>No Results</p>');
	        }
	        $('.draggable').draggable({
		        revert: true
		        });   
		    _.each(brokerInfo.results,function(res)
	        {
	        	res["inputs"] =  new Array();
	        	for(var i =0;i<5;i++)
	        	{
		        	var inOb = {id:idCount,desc:'description for input ' + idCount,title:'title for input ' + idCount};
		        	res["inputs"].push(inOb);
		        	idCount++;
	        	}
	        	
	        	res["outputs"] =  new Array();
	        	for(var i =0;i<5;i++)
	        	{
		        	var outOb = {id:idCount,desc:'description for output ' + idCount,title:'title for output ' + idCount};
		        	res["outputs"].push(outOb);
		        	idCount++;
	        	}
	        	
	        		
	        }); 

	    },
	    doDrop : function (ev,ui,layer)
	    {
	    	//when an item has been dropped, we can then add an element to the layer
	    	 opts = arguments;
             var draggedID = ui.draggable.attr("id");
             var resultOb = brokerInfo.results[draggedID];
             
             offset = layer.getStage()._getContentPosition();
                //get search meta data using this id
                
                var wFlowEle = new Kinetic.WorkFlowElement({text:'',x:ui.position.left + offset.left,y:ui.position.top + offset.top,draggable:true,layer:layer,type:"component",brokerProperties:resultOb});
                layer.addElement(wFlowEle);
                
		    
	    }
};
WorkFlow_UI.io =
{
		IOs: {},
		noRows: 1,
		components : {},
		currentIOs : {},
		open : function(IO)
		{
			IOs = {inputs:IO.input.getInputs(),outputs:IO.output.getOutputs()};
			components = IO;
			currentIOs = this.getAllCurrentIOs();
			//clear modal contents, from previous opening
			 $('#inputDesc').empty();
			 $('#outputDesc').empty();
			 $('#dropdowns').empty();
			noRows = 1;
			this.outputCurrentIOs();
			//open modal and populate with IO
			$('#ioModal').modal('show');
			$('#ioModal').modal
			({
        		backdrop: true,
       			 keyboard: true
    		}).css
    		({
    			'overflow-y':'auto',
    			'max-height':'90%',
        		width: 'auto',
        		'margin-left': function () {
            		return -($(this).width() / 2);
       		 	}
   			 });
   			 
   			 
   			 
   			 //display the descriptions of the 2 items clicked
   			 if(IO.input instanceof Kinetic.WorkFlow)
   			 {
	   			 //set the type
	   			 $('#inputHeading').html('To: ' + IO.input.title);
	   			 $('#inputDesc').html('<h4>Title:</h4> ' + IO.input.title);
	   			 $('#inputDesc').append('<h4>Type:</h4> Nested Workflow');
	   			 $('#inputDesc').append('<h4>Description</h4>');
	   			 $('#inputDesc').append('<p>This is the Description, it will be added by the user when they choose to create a workflow</p>');
   			 }
   			 else if (IO.input instanceof Kinetic.WorkFlowElement)
   			 {
	   			 //set the type
	   			 $('#inputHeading').html('To: ' + IO.input.title);
	   			 $('#inputDesc').html('<h4>Title:</h4> ' + IO.input.title);
	   			 $('#inputDesc').append('<h4>Type:</h4> Component');
	   			 $('#inputDesc').append('<h4>Description</h4>');
	   			 $('#inputDesc').append('<p>' + IO.input.brokerProperties.description +'</p>');

	   			 
   			 }
   			 if(IO.output instanceof Kinetic.WorkFlow)
   			 {
	   			 //set the type
	   			 $('#outputHeading').html('From: ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Title:</h4> ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Type:</h4> Nested Workflow');
	   			 $('#outputDesc').append('<h4>Description</h4>');
	   			 $('#outputDesc').append('<p>This is the Description, it will be added by the user when they choose to create a workflow</p>');
	   			 
   			 }
   			 else if (IO.output instanceof Kinetic.WorkFlowElement)
   			 {
	   			 //set the type
	   			 $('#outputHeading').html('From: ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Title:</h4> ' + IO.output.title);
	   			 $('#outputDesc').append('<h4>Type:</h4> Component');
	   			 $('#outputDesc').append('<h4>Description</h4>');
	   			 $('#outputDesc').append('<p>' + IO.output.brokerProperties.description +'</p>');

	   			 
   			 }
   			 
   			//$('#inputCollapse').collapse('show');
   			//$('#outputCollapse').collapse('show');
   			
   			 //need to display, previous connections that are set
   			 
   			 //display new section to be set
   			 this.displayIO();
			
			
		},
		getAllCurrentIOs : function ()
		{
			var currentIn = new Array();
			var currentOut = new Array();
			//get inputs connections based on the output
			currentIn = components.input.getInputConnections(components.output);
			
			currentOut = components.output.getOutputConnections(components.input);
			
			//sanity check, in and out should be the same
			if(!(_.isEqual(currentIn,currentOut)))
			{
				console.error('CurrentIns and outs not the same');
			}
			return currentOut;
		},
		outputCurrentIOs : function()
		{
			//loop through currentIOs
			//each time call displayIO, then modify the row so
			//the correct option is selected and alert-success and delete button is set
			var that = this;
			_.each(currentIOs,
				function(currentIO)
				{
					that.displayIO();
					$("#inputs_" + (noRows-1) + " option[value=" + currentIO.input.inputIO.id + "]").attr('selected', 'selected');
					$("#outputs_" + (noRows-1) + " option[value=" + currentIO.output.outputIO.id + "]").attr('selected', 'selected');
					//$('#inputs_' + noRows-1).val(currentIO.input.inputIO.id).attrs('selected',true);
					//$('#outputs_' + noRows-1).val(currentIO.output.outputIO.id).attrs('selected',true);
					that.disableRow(noRows-1);
					//change the button to delete, to give the ability to delete the connection
					var button = $('#button_' + (noRows-1))
					button.html('Delete');
					button.attr('onclick', 'WorkFlow_UI.io.deleteIO(' + (noRows-1) + ')');
					$('#row_' + (noRows-1)).attr('class','row alert alert-success');
					$('#rowAlertHeading_' + (noRows-1)).empty();

				});	
		},
		displayIO : function()
		{
			//display outputs
			var form = $('<form class="form-vertical"></form>');
			var row = $(' <div class="row alert fade in" id="row_' + noRows +'"></div>')
			row.append('<h4 class="alert-heading" id=rowAlertHeading_' + noRows + '></h4>');
			var spanOutputs = $('<div class="span4"></div>');
			var group = $('<div class="control-group"></div>');
			var controls = $('<div class="controls"></div>');
			var select = $(' <select id="outputs_' + noRows + '" onchange="WorkFlow_UI.io.displayOutputDetails(' + noRows + ',this);"></select>');
			_.each(IOs.outputs,function(oIO)
			{
				//data attribute will store the actual ioObject from the broker
				//the value in the select will be the title of the ioObject
				select.append('<option value=' + oIO.id + ' data-ioObjectid=' + oIO.id + '>' + oIO.title + '</option>');
				
			});     
			
			controls.append(select);
			group.append(controls);
			//group.append('<button class="btn btn-primary" onclick="WorkFlow_UI.io.setIO(' + noRows + ')" href="#">Set</button>')
			spanOutputs.append(group);
			spanOutputs.append('<div id="outputDetails_' + noRows + '"></div>');
			row.append(spanOutputs);
			  
			
			
			  
			
			
			//output inputs
			
			var spanInputs = $('<div class="span4"></div>');
			var group = $('<div class="control-group"></div>');
			var controls = $('<div class="controls"></div>');
			var select = $(' <select id="inputs_' + noRows + '" onchange="WorkFlow_UI.io.displayInputDetails(' + noRows + ',this);"></select>');
			
			_.each(IOs.inputs,function(iIO)
			{
				//data attribute will store the actual ioObject from the broker
				//the value in the select will be the title of the ioObject
				select.append('<option value=' + iIO.id + ' data-ioObjectid=' + iIO.id + '>' + iIO.title + '</option>');
				
			});
			
			controls.append(select);
			group.append(controls);
			spanInputs.append(group);
			spanInputs.append('<div id="inputDetails_' + noRows + '"></div>');
			row.append(spanInputs);
			row.append('<div class="span1"><button id="button_' + noRows + '" class="btn btn-primary" onclick="WorkFlow_UI.io.setIO(' + noRows + ')" href="#">Set</button></div>');	
			$('#dropdowns').append(row);
			$(".alert").alert()
			
			noRows++;      
			             
			        
		
			
		},
		displayInputDetails : function(rowDetail,el)
		{
			$('#inputCollapse').collapse('hide');
   			$('#outputCollapse').collapse('hide');
			var select = $('#inputs_' + rowDetail).find(":selected");
			var id =  select.data('ioobjectid');
			//have the id, now need to find the object using the input object
			ioObject = components.input.getIOObject(id);
			$('#inputDetails_' + rowDetail).html(ioObject.desc);
			
		},
		displayOutputDetails : function(rowDetail,el)
		{
			var select = $('#outputs_' + rowDetail).find(":selected");
			var id =  select.data('ioobjectid');
			//have the id, now need to find the object using the input object
			ioObject = components.output.getIOObject(id);
			$('#outputDetails_' + rowDetail).html(ioObject.desc);
			
		},
		clearDetails : function ()
		{
			for(var r = 0; r<noRows;r++)
			{
				$('#outputDetails_' + r).empty();
				$('#inputDetails_' + r).empty();
			}
			
		},
		disableRow : function (row)
		{
			$('#inputs_' + row).attr("disabled", "disabled");
			$('#outputs_' + row).attr("disabled", "disabled");
		},
		setIO : function(row)
		{
			//get the input from the select
			var select = $('#inputs_' + row).find(":selected");
			var inputObId =  select.data('ioobjectid');
			//get the output from the select
			var select = $('#outputs_' + row).find(":selected");
			var outputObId =  select.data('ioobjectid');

			//call connectTo on the output
			//this will include object of: input object, input IOObject and output IOObject
			var resultCon = components.output.connectTo(
			{
				input:{obj:components.input,inputIO:components.input.getIOObject(inputObId)},
				output:{obj:components.output,outputIO:components.output.getIOObject(outputObId)}
			});
			
			
			if(resultCon)
			{
				$('#row_' + row).attr('class','row alert alert-success');
				$('#rowAlertHeading_' + row).empty();
				$(".alert").alert()
				//display new IO, to map new IO
				this.displayIO();
				this.clearDetails();
				//
				this.disableRow(row);
				//change the button to delete, to give the ability to delete the connection
				var button = $('#button_' + row)
				button.html('Delete');
				button.attr('onclick', 'WorkFlow_UI.io.deleteIO(' + row + ')');

			}
			else
			{
				//this has already been mapped, display message
				$('#row_' + row).attr('class','row alert alert-error');
				$(".alert").alert()
				$('#rowAlertHeading_' + row).html('<h4>Connection already Defined</h4><br>');
			}
			
		},
		deleteIO : function(row)
		{
			//get the input from the select
			var select = $('#inputs_' + row).find(":selected");
			var inputObId =  select.data('ioobjectid');
			//get the output from the select
			var select = $('#outputs_' + row).find(":selected");
			var outputObId =  select.data('ioobjectid');
			
			//delete the connection from the intput and output
			var resultCon = components.output.disconnect(
			{
				input:{obj:components.input,inputIO:components.input.getIOObject(inputObId)},
				output:{obj:components.output,outputIO:components.output.getIOObject(outputObId)}
			});
			
			//update the currentIOs
			//remove the row, do we need to change all the IDS?
			$('#row_' + row).alert('close')
			//$('#row_' + row).remove();
		}

};
