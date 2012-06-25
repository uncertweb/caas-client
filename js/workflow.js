// Lets keep the global namespace tidy by wrapping everything
// in a self-invoking anonymous function.
(function ($, global) {

  // Utility function for type checking
  var _typeOf = function (obj) {
        return Object.prototype.toString.call(obj);
      };

  // Set the unique ID to the current timestamp
  var _currID = +new Date();

  // Core functions
  // --------------

  var UncertWeb = {
    // Check whether an object is an Array
    isArray: function (obj) {
      return _typeOf(obj) === '[object Array]';
    },

    // Check whether an object is an Object
    isObject: function (obj) {
      return _typeOf(obj) === '[object Object]';
    },

    // Check whether an object is a Function
    isFunction: function (obj) {
      return _typeOf(obj) === '[object Function]';
    },

    // Check whether an object is a Component
    isComponent: function (obj) {
      return obj instanceof this.Component;
    },

    // Check whether an object is a Workflow
    isWorkflow: function (obj) {
      return obj instanceof this.Workflow;
    },

    // Check whether an object is a Number
    isNumber: function (obj) {
        return _typeOf(obj) === '[object Number]';
    },

    // Check whether an object is a String
    isString: function (obj) {
      return _typeOf(obj) === '[object String]';
    },

    // Generate a unique ID
    uid: function () {
      _currID += 1;
      return '_'+_currID;
    }
  };

  // UncertWeb options
  UncertWeb.options = {
    broker_url: 'lib/broker.php',
    caas_url:   'lib/caas.php',
    // Setup default search options for the broker.
    //
    //- **si**: Start index
    //- **st**: Search term
    //- **bbox**: Bounding box
    //- **rel**: Spatial relationship, e.g. contains, intersects
    //- **ts**: time start for temporal queries
    //- **te**: time end for temporal queries
    //- **ct**: Count - number of results returned
    //- **loc**: Location string, put through a geocoder before querying
    search_config: {
      si: 1,
      st: '',
      bbox: '',
      rel: '',
      ts: '',
      te: '',
      ct: 1000,
      loc: '',
      outputFormat: 'application/atom+xml'
    }
  };

  UncertWeb.namespaces = {
    GCO: 'http://www.isotc211.org/2005/gco',
    BPMN: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
    BPMNDI: 'http://www.omg.org/spec/BPMN/20100524/DI',
    DC: 'http://www.omg.org/spec/DD/20100524/DC',
    DI: 'http://www.omg.org/spec/DD/20100524/DI',
    G: 'http://www.jboss.org/drools/flow/gpd',
    TNS: 'http://www.jboss.org/drools',
    XSD: 'http://www.w3.org/2001/XMLSchema',
    XSI: 'http://www.w3.org/2001/XMLSchema-instance',
    MVEL: 'http://www.mvel.org/2.0',
    JAVA: 'http://www.java.com/javaTypes',
    GMD: 'http://www.isotc211.org/2005/gmd',
    CAAS: 'http://essi.iia.cnr.it/caas/1.0'
  };


  // Broker module
  // -------------

  // Create the `UncertWeb.broker` module.
  UncertWeb.broker = {
    // Search the broker for the specified `keywords`.
    // Handle the success via inline callbacks or via the returned
    // deferred object.
    search: function (keywords) {
      var dfd = $.Deferred(),
          results = [],
          $data,
          entry = {},
          start = +new Date(),
          result_object = {},
          base_url = UncertWeb.options.broker_url,
          index = 1,
          opts,
          success,
          fail;

      // Check for options
      if(UncertWeb.isObject(arguments[index])) {
        opts = arguments[index];
        index += 1;
      }

      success = arguments[index];
      fail = arguments[index+1];

      config = $.extend({}, UncertWeb.options.search_config, opts);

      // Set the keywords in the search config
      config.st = keywords;

      // Make an AJAX request to the proxy service with the configuration options
      $.ajax({
        url: base_url,
        data: config
        // When the AJAX query responds
      }).done(function (data) {
        $data = $(data);
        // Map the XML data into an array of JSON objects
        results = $.map($data.find('entry'), function (elem) {
          var $this = $(elem);
          // Skip any elements without annotations as we cannot use them in the system.
          if($this.find('category[scheme="urn:X-GI-caas:component:taxonomy"]').length === 0) {
            return null;
          }
          // Return a JSON representation of the XML `entry` element
          //
          //- **id**: Unique ID, not to be confused with the internal IDs used by us.
          //- **title**: Human readable title.
          //- **endpoint**: URL of component, although this is rarely set so shouldn't be relied on.
          //- **keywords**: Array of words describing the component.
          //- **updated**: Date and time that the component was last updated in the broker.
          //- **summary**: Human readable description of the component.
          //- **serviceType**: Type of component (data access, model etc).
          //- **annotation**: CaaS annotation of this component.
          return {
            id: $this.find('id').text(),
            name: $this.find('title').text(),
            endpoint: $this.find('endpoint').text(),
            keywords: $.map($this.find('[term="keywords"]'), function (elem) {
              return $(elem).attr('label');
            }),
            updated: $this.find('updated').text(),
            description: $this.find('summary').text(),
            serviceType: $this.find('category[term="serviceType"]').attr('label'),
            annotation: $this.find('category[scheme="urn:X-GI-caas:component:taxonomy"]').attr('label'),
            parentID: $this.find('parentID').text()
          };
        });
        // Create a wrapper object for the query results and including:
        //
        //- **num_results**: Number of results returned by the query.
        //- **completed_in**: The time taken, in seconds, to execute the search.
        //- **query**: The actual query sent to the broker.
        //- **results**: An array of results objects detailed above.
        result_object = {
          num_results: results.length,
          completed_in: (+new Date() - start) / 1000,
          query: $.param(config),
          results: results
        };
        // Once we have finished converting the XML to JSON, resolve the deferred object.
        dfd.resolve(result_object);
        // If an inline callback function was provided, fire it now.
        if(UncertWeb.isFunction(success)) {
          success.call(this, result_object, "success");
        }
        // If the AJAX request was unsuccessful
      }).fail(function () {
        // Log the error to the console
        console.error('Search failed ' + arguments[0].responseText);
        // If an inline callback was provided, fire it now
        if(UncertWeb.isFunction(fail)) {
          fail.apply(this, arguments);
        }
      });

      // Return a deferred object straight away so the user is not blocked.
      return dfd;
    },

    // Alias function for `UncertWeb.broker.search('')` that returns all components in the broker.
    all: function (success, failure) {
      return this.search('', success, failure);
    }
  };

  // Component module
  // ----------------

  // Create the `UncertWeb.Component` module.
  UncertWeb.Component = function (opts) {
    // Setup public properties
    this.id = opts.id || UncertWeb.uid();
    this.name = opts.name || "";
    this.description = opts.description || "";
    this.annotation = opts.annotation || "";

    this.inputs = opts.inputs || [];
    this.outputs = opts.outputs || [];
  };

  // Workflow module
  // ---------------

  // Helper function that subscribes to the `workflow/update` event of child workflows and
  // propagates the event to the parent workflow. The result of this is that a user
  // only has to subscribe to the parent `workflow/update` event and will be informed even
  // when a child workflow is updated.
  wrapCallback = function (workflow) {
    workflow.subscribe('workflow/update', function (data) {
      this.publish('workflow/update', this);
    }, this);
  };

  // Create `UncertWeb.Workflow` module.
  UncertWeb.Workflow = function () {
    // Length property to help mimic array behaviour.
    this.length = 0;

    // Private properties
    var subscribers = {},
        id = UncertWeb.uid(),
        iterations;

    // Publish an event occuring on this workflow.
    this.publish = function (event, data) {
      // If this particular event has no subscribers, return immediately.
      if(!subscribers[event]) {
        return this;
      }

      var i = 0,
          // number of subscribers to this event.
          length = subscribers[event].length,
          subscription,
          // Arguments array to pass to the callback function.
          args = this.slice.call(arguments, 1);

      // Find all subscribers to this event and fire their specified callback function.
      // Passing in `data` as a parameter.
      for( ; i < length; i += 1) {
        subscription = subscribers[event][i];
        subscription.callback.apply(subscription.context, args);
      }

      // Return the workflow object for the chaining pattern.
      return this;
    };

    // Subscribe to a particular event on this workflow.
    this.subscribe = function (event, callback, context) {
      // Create a subscription object, stored by the private `subscribers` object.
      var subObj = {
        callback: callback,
        // Set the context of `this` during the callback to the specified `context` or `null` by default.
        context: context || null
      };
      // If this is the first subscriber to a particular event, initialise `Object.event` property to a new array.
      if (subscribers[event] === undefined) {
        subscribers[event] = [];
      }
      // Push the subscription object onto the stack.
      subscribers[event].push(subObj);
      // Return the workflow for the chaining pattern.
      return this;
    };

    // Unsubscribe from a particular event on this workflow.
    this.unsubscribe = function (event, callback) {
      // If there are no subscribers to this event, return immediately.
      if(!subscribers[event]) {
        return this;
      }
      var length = subscribers[event].length,
          i = 0;
      // For every subscriber to this event, check if the callback provided is registered,
      // and if so, remove it.
      for ( ; i < length; i += 1) {
        if(subscribers[event][i].callback === callback) {
          subscribers[event].splice(i, 1);
        }
      }
      // Return the workflow for the chaining pattern.
      return this;
    };

    // Get the unique ID of this workflow.
    this.getId = function () {
      return id;
    };

    // Get the number of iterations of this workflow
    this.getIterations = function () {
      return iterations;
    };

    // Set the number of iterations of this workflow
    this.setIterations = function (newIterations) {
      iterations = newIterations;
    };
  };

  // Create the `UncertWeb.Workflow` `prototype` object.
  UncertWeb.Workflow.prototype = {
    // Copy the slice/splice functions from the `Array` prototype to enable
    // Array-like behaviour in workflows.
    slice: [].slice,
    splice: [].splice,

    // Append a component, or array of components, to the workflow at a specified `index`.
    append: function (components, index) {
      // If only a single component was provided, wrap it in an array.
      components = UncertWeb.isArray(components) ? components : [components];
      var args = [],
          i = components.length - 1;

      // If no index is provided, set it to the position of length - 1.
      index = index === undefined ? this.length - 1 : index;

      // Insert the components at the specified index.
      this.splice.apply(this, [index + 1, 0].concat(components));

      // Search every component just added.
      for( ; i >= 0; i -= 1) {
        // If the component is a workflow, subscribe to the workflow/update event using the
        // `wrapCallback` helper function.
        if(UncertWeb.isWorkflow(components[i])) {
          wrapCallback.call(this, components[i]);
        }
      }
      // Publish some events to let observers know we have updated.
      this.publish('workflow/component/add', components);
      this.publish('workflow/update', this);

      // Return the workflow object for the chaining pattern.
      return this;
    },

    // Clear the workflow object of all components.
    clear: function () {
      // Use splice to do our dirty work.
      this.splice(0, this.length);
      // Publish some events to let observers know we have updated and cleared.
      this.publish('workflow/clear');
      this.publish('workflow/update');
      // Return the workflow object for the chaining pattern.
      return this;
    },

    // Remove the component at the specified index.
    remove: function (index) {
      var removed;
      // Use splice to remove the component.
      this.splice(index, 1);
      // Publish some events to let observers know whe have updated.
      this.publish('workflow/component/remove', removed);
      this.publish('workflow/update', this);

      // Return the workflow object for the chaining pattern.
      return this;
    }
  };


  // Encode module
  // --------------

  // Create the root Document node - used to create XML elements
  var doc = document.implementation.createDocument(null, null, null);
  var url = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  // Helper method to create XML elements
  // http://stackoverflow.com/questions/3191179/generate-xml-document-in-memory-with-javascript
  function XML() {
    var components,
        namespace,
        elementName,
        node,
        text,
        child,
        attributeIndex = 1,
        i = 1;

    // Namespace provided if second argument is string and first argument matches a url
    if(UncertWeb.isString(arguments[1]) && arguments[0].match(url)) {
      node = doc.createElementNS(arguments[0], arguments[1]);
      i += 1;
      attributeIndex += 1;
    } else {
      // no namespace
      node = doc.createElementNS("", arguments[0]);
    }

    if(UncertWeb.isObject(arguments[attributeIndex])) { // attributes object
      // increase i to exclude attributes from child nodes
      i += 1;
      var attributes = arguments[attributeIndex];
      for(var attr in attributes) {
        if (attributes.hasOwnProperty(attr)) {
          node.setAttribute(attr, attributes[attr]);
        }
      }
    }

    // Add every other argument as a child node
    for( ; i < arguments.length; i++) {
        child = arguments[i];
        if(typeof child == 'string') {
            child = doc.createTextNode(child);
        }
        node.appendChild(child);
    }
    return node;
  }

  // Helper function to generate a scriptTask node for a component
  function scriptTask(component) {
    return XML('scriptTask', {
      completionQuantity: 1,
      isForCompensation: false,
      name: component.getAnnotation(),
      startQuantity: 1,
      id: component.getId()
    });
  }

  // Create a subProcess element
  function subProcess(id, iterations) {
    // if iterations is undefined replace with the question mark syntax
    iterations = iterations || '?';
    return XML('subProcess', {
      completionQuantity: 1,
      id: id,
      isForCompensation: false,
      name: '[' + iterations + '] Multiple Instances (one for each environmental dataset)',
      startQuantity: 1,
      triggeredByEvent: false
    }, XML('multiInstanceLoopCharacteristics', {
      behavior: 'All',
      isSequential: false
    },  XML('loopDataInputRef', id + "_input"),
        XML('inputDataItem', {
          isCollection: false
        }),
        XML('outputDataItem', {
          isCollection: false
        })
      )
    );
  }

  // Create a startEvent element
  function startEvent(id) {
    return XML('startEvent', {
      id: id,
      isInterrupting: 'true',
      name: 'Start',
      parallelMultiple: false
    });
  }

  // Create an endEvent element
  function endEvent(id, isTermination) {
    var end = XML('endEvent', {
      id: id,
      name: "End"
    });

    // Is the ultimate endEvent (i.e. end of the workflow)
    if(isTermination) {
      end.appendChild(XML('terminateEventDefinition', {
        id: id + "_end_ED_1"
      }));
    }

    return end;
  }

  // Create a sequenceFlow element - models the connections to and from each component
  function sequenceFlow(from, to) {
    return XML('sequenceFlow', {
      id: from + "-" + to,
      sourceRef: from,
      targetRef: to
    });
  }

  // Create an itemDefinition element - used for each subProcess
  function itemDefinition(id) {
    return XML('itemDefinition', {
      id: id + "_multiInstanceItemType",
      isCollection: false,
      itemKind: "Information"
    });
  }

  // Encodes a workflow into BPMN
  function encodeWorkflow(workflow, appendTo, isNestedWorkflow) {
    isNestedWorkflow = isNestedWorkflow || false;

    // Add the start event
    var startID = workflow.getId() + "_start";
    appendTo.appendChild(startEvent(startID));

    // for each child of the workflow, create the relevant XML
    for (var i = 0; i < workflow.length; i++) {
      var child = workflow[i];
      if(UncertWeb.isComponent(child)) {
        appendTo.appendChild(scriptTask(child));
      } else if(UncertWeb.isWorkflow(child)) {
        // this is a subprocess
        var sp = subProcess(child.getId(), child.getIterations());
        encodeWorkflow(child, sp, true);
        appendTo.appendChild(sp);
      }
    }

    // Add the end event
    var endID = workflow.getId() + "_end";
    appendTo.appendChild(endEvent(endID, !isNestedWorkflow));

    // Add the sequence flow
    appendTo.appendChild(sequenceFlow(startID, workflow[0].getId()));

    // Assume workflow is in order of execution
    for ( i = 0; i < workflow.length - 1; i++) {
      var c = workflow[i];
      var end = workflow[i+1];
      appendTo.appendChild(sequenceFlow(c.getId(), end.getId()));
    }

    // Add end sequence
    appendTo.appendChild(sequenceFlow(workflow[workflow.length - 1].getId(), endID));
  }


  // Create the Uncertweb.Encode module
  UncertWeb.Encode = {
    asBPMN: function (workflow) {
      var bpmn = XML('definitions', {
        'xmlns'               : UncertWeb.namespaces.BPMN,
        'xmlns:bpmndi'        : UncertWeb.namespaces.BPMNDI,
        'xmlns:dc'            : UncertWeb.namespaces.DC,
        'xmlns:di'            : UncertWeb.namespaces.DI,
        'xmlns:g'             : UncertWeb.namespaces.G,
        'xmlns:tns'           : UncertWeb.namespaces.TNS,
        'xmlns:xsd'           : UncertWeb.namespaces.XSD,
        'xmlns:xsi'           : UncertWeb.namespaces.XSI,
        'exporter'            : 'UncertWeb JavaScript Client',
        'exporterVersion'     : '0.1',
        'id'                  : 'Definition',
        'name'                : '',
        'expressionLanguage'  : UncertWeb.namespaces.MVEL,
        'targetNamespace'     : UncertWeb.namespaces.TNS,
        'typeLanguage'        : UncertWeb.namespaces.JAVA,
        'xsi:schemaLocation'  : UncertWeb.namespaces.BPMN + ' http://bpmn.sourceforge.net/schemas/BPMN20.xsd'
      });

      // A workflow has been passed in
      if (workflow) {
        var process = XML('process', {
            isClosed: false,
            isExecutable: true,
            name: workflow.getId(),
            processType: 'Private'
          });

        encodeWorkflow(workflow, process);

        // create an itemDefinition for each nested workflow and attach it to the bpmn document
        for (var i = 0; i < workflow.length; i++) {
          if(UncertWeb.isWorkflow(workflow[i])) {
            bpmn.appendChild(itemDefinition(workflow[i].getId()));
          }
        }

        // attach the process to the bpmn document
        bpmn.appendChild(process);
      }

      return bpmn;
    }
  };

  // CaaS Module
  // -----------

  function encodeMetadata(metadata) {
    var caasMetadata = XML(
      UncertWeb.namespaces.CAAS,
      'caas:metadata',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:MD_Metadata',
        encodeISOLanguage(),
        encodeISOCharacterSet(),
        encodeISOContact(metadata.organisation),
        encodeISODateStamp(),
        encodeIdentificationInfo(metadata.title, metadata.description)
      )
    );
    return caasMetadata;
  }

  function encodeISOLanguage() {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:language',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:LanguageCode',
        {
          'codeList': 'http://www.isotc211.org/2005/resources/Codelist/ML_gmxCodelists.xml#LanguageCode',
          'codeListValue': 'eng'
        },
        "English"
      )
    );
  }

  function encodeISOCharacterSet() {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:characterSet',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:MD_CharacterSetCode',
        {
          'codeListValue': 'utf8',
          'codeList': 'http://www.isotc211.org/2005/resources/Codelist/gmxCodeLists.xml#MD_CharacterSetCode',
          'codeSpace': 'ISOTC211/19115'
        },
        'utf8'
      )
    );
  }

  function encodeISOContact(organisation) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:contact',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:CI_ResponsibleParty',
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:organisationName',
          encodeCharacterString(organisation)
        ),
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:role',
          XML(
            UncertWeb.namespaces.GMD,
            'gmd:CI_RoleCode',
            {
              'codeList': 'http://www.isotc211.org/2005/resources/Codelist/gmxCodeLists.xml#CI_RoleCode',
              'codeListValue': 'pointOfContact',
              'codeSpace': 'ISOTC211/19115'
            },
            'pointOfContact'
          )
        )
      )
    );
  }

  function encodeCharacterString (string) {
    return XML(
      UncertWeb.namespaces.GCO,
      'gco:CharacterString',
      string
    );
  }

  function encodeISODateStamp() {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:dateStamp',
      encodeDate()
    );
  }

  function encodeDate() {
    var date = new Date(),
        dateString;

    dateString = date.getFullYear() + '-' +
                 ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
                 ('0' + date.getDate()).slice(-2);
    return XML(
      UncertWeb.namespaces.GCO,
      'gco:Date',
      dateString
    );
  }

  function encodeIdentificationInfo(title, description) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:identificationInfo',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:MD_DataIdentification',
        encodeCitation(title),
        encodeAbstract(description),
        encodeISOLanguage()
      )
    );
  }

  function encodeCitation(title) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:citation',
      XML(
        UncertWeb.namespaces.GMD,
        'gmd:CI_Citation',
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:title',
          encodeCharacterString(title)
        ),
        XML(
          UncertWeb.namespaces.GMD,
          'gmd:date',
          XML(
            UncertWeb.namespaces.GMD,
            'gmd:CI_Date',
            XML(
              UncertWeb.namespaces.GMD,
              'gmd:date',
              encodeDate()
            ),
            XML(
              UncertWeb.namespaces.GMD,
              'gmd:dateType',
              XML(
                UncertWeb.namespaces.GMD,
                'gmd:CI_DateTypeCode',
                {
                  'codeList': 'http://www.isotc211.org/2005/resources/Codelist/gmxCodeLists.xml#CI_DateTypeCode',
                  'codeListValue': 'creation',
                  'codeSpace': 'ISOTC211/19115'
                },
                'creation'
              )
            )
          )
        )
      )
    );
  }

  function encodeAbstract(description) {
    return XML(
      UncertWeb.namespaces.GMD,
      'gmd:abstract',
      encodeCharacterString(description)
    );
  }

  // Helper function to encode a workflow + metadata into a CaaS bpmnCreateRequest element
  function encodePublishRequest(workflow, metadata) {
    var encodedWorkflow = UncertWeb.Encode.asBPMN(workflow);

    var request = XML(
      UncertWeb.namespaces.CAAS,
      'caas:bpmnCreateRequest',
      {
        'xmlns:gco':  UncertWeb.namespaces.GCO,
        'xmlns:gmd':  UncertWeb.namespaces.GMD,
        'xmlns:caas': UncertWeb.namespaces.CAAS,
        'xmlns:xsi':  UncertWeb.namespaces.XSI,
        'xsi:schemaLocation': UncertWeb.namespaces.CAAS + ' http://zeus.pin.unifi.it/schemas/GI-caas/1.0/caas2.xsd'
      },
      encodeMetadata(metadata),
      XML(
        UncertWeb.namespaces.CAAS,
        'caas:model',
        encodedWorkflow
      )
    );

    console.log(request);
    return (new XMLSerializer()).serializeToString(request);
  }

  UncertWeb.CaaS = {
    publish: function(workflow, metadata) {
      var $promise = $.Deferred(),
          startTime = +new Date(),
          results;

      // We need metadata
      if (metadata === undefined) {
        $promise.reject("Metadata is required");
        return $promise;
      }

      var $innerPromise = $.ajax({
        url: UncertWeb.options.caas_url,
        type: 'POST',
        contentType: 'text/xml',
        processData: false,
        data: encodePublishRequest(workflow, metadata)
      });

      $innerPromise.done(function (data) {
        var endTime = new Date();
        results = {
          data: data,
          completed_in: (+new Date() - startTime) / 1000
        };
        $promise.resolve(results);
      }).fail(function () {
        $promise.reject(arguments);
      });

      // return the promise straight away
      return $promise;
    }
  };

  // Make the UncertWeb object visible
  global.UncertWeb = UncertWeb;

// Make sure we have access to jQuery and the global object inside.
}(jQuery, this));