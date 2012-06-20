(function () {

  UncertWeb.options.broker_url = "../lib/broker.php";

  // helper functions
  var generateComponent = function () {
    return new UncertWeb.Component({
      name: Date(),
      description: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium.',
      annotation: '[access:raster]'
    });
  };

  module('UncertWeb', {
    setup: function () {

    }
  });

  test("UncertWeb object", function() {
    equal(UncertWeb === undefined, false, "UncertWeb should not be undefined.");
  });

  test("_typeOf function", function () {
    equal(UncertWeb._typeOf === undefined, true, "_typeOf should be private");
  });

  test("isFunction method", function () {
    equal(UncertWeb.isFunction === undefined, false, "isFunction should not be undefined");
    equal(Object.prototype.toString.call(UncertWeb.isFunction), '[object Function]', "Should be of type function");
    ok(UncertWeb.isFunction(function () {}), "Works on empty function");
  });

  test("isArray method", function () {
    equal(UncertWeb.isArray === undefined, false, "isArray should not be undefined.");
    ok(UncertWeb.isFunction(UncertWeb.isArray), "Should be of type function");
    ok(UncertWeb.isArray([]), "Works on empty array.");
  });

  test("isObject method", function () {
    equal(UncertWeb.isObject === undefined, false, "isObject should not be undefined");
    ok(UncertWeb.isFunction(UncertWeb.isObject), "Should be of type function");
    ok(UncertWeb.isObject({}), "Works on empty object");
  });

  test("isNumber method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isNumber), "isNumber should exist and be a function");
    ok(UncertWeb.isNumber(12), "and should return true when it is passed a number");
    ok(!UncertWeb.isNumber("not a number"), "and false if it is not a number");
  });

  test("isString method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isString), "isString should exist and be a function");
    ok(UncertWeb.isString("test"), "and should return true when it is passed a string");
    ok(!UncertWeb.isString(12), "and false if it is not a string");
  });

  test("isWorkflow method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isWorkflow), "isWorkflow should exist and be a function");
    ok(UncertWeb.isWorkflow(new UncertWeb.Workflow()), "and return true when passed a workflow");
    ok(!UncertWeb.isWorkflow(function() {}), "and false when it is not");
  });

  test("isComponent method", function () {
    ok(UncertWeb.isFunction(UncertWeb.isComponent), "isWorkflow should exist and be a function");
    ok(UncertWeb.isComponent(new UncertWeb.Component({
      name: 'name',
      annotation: 'annotation'
    })), "and return true when passed a workflow");
    ok(!UncertWeb.isComponent(function() {}), "and false when it is not");
  });

  test("uid method", function () {
    var id = UncertWeb.uid(),
        limit = 1000000, // generate a lot of unique IDs!
        duplicate = false,
        ids = [],
        currID = 0,
        i = 0;
    ok(id, "uid should return an ID");
    for(i = 0; i < limit; i++) {
      currID = UncertWeb.uid();
      // test last one
      if(ids[i - 1] === currID) {
        duplicate = true;
        break;
      }
      ids.push(currID);
    }
    equal(ids.length, limit, "it should have generated " + limit + " ids");
    ok(!duplicate, "And no duplicates should be generated");
  });

  module('Workflow', {
    setup: function () {
      this.workflow1 = new UncertWeb.Workflow();
      this.workflow2 = new UncertWeb.Workflow();
      this.workflow1clone = this.workflow1;
      this.component1 = generateComponent();
      this.component2 = generateComponent();
      this.component3 = generateComponent();
      this.callback_with_data = function (data) {
        equal(this.workflow1, data, "... and pass the workflow object as data");
      };
      this.callback = function () {
        ok(true, "Adding a component should fire the workflow/update event");
      };
    },

    teardown: function () {
      // UncertWeb.clear();  // clear callbacks
    }
  });

  test("Workflow object", function  () {
    equal(UncertWeb.Workflow === undefined, false, "Workflow should not be undefined.");
  });

  test("Workflow constructor function", function () {
    ok(UncertWeb.isObject(this.workflow1), "Workflow should be an object.");
    ok(this.workflow1 !== this.workflow2, "Two workflow objects should not be equal");
    ok(this.workflow1 === this.workflow1clone, "Two identical objects should be equal");
  });

  test("Workflow length property", function () {
    equal(this.workflow1.length === undefined, false, "Should exist");
    ok(this.workflow1.length === 0, "Should be 0 for an empty workflow.");
  });

  test("Workflow access using [] notation", function () {
    equal(this.workflow1[0], undefined, "Empty Workflow should have no components");

    // add a component
    this.workflow1.append(this.component1);

    equal(this.workflow1[0], this.component1, "Adding a component makes it accessible at workflow[0]");

  });

  test("append function", function () {
    expect(15);

    ok(this.workflow1.append, "append method should exist");
    raises(function () {
      this.workflow1.append();
    }, "append requires a parameter");

    raises(function () {
      this.workflow1.append({});
    }, "append only accepts a Component as input");

    // valid add component;
    var ret_value = this.workflow1.append(this.component1);

    equal(this.workflow1.length, 1, "Adding a component increases the length of workflow");

    equal(ret_value === this.workflow1, true, "The result of append should be the workflow");

    // fill up workflow
    this.workflow1.append(this.component1).append(this.component1);

    // add to the end
    this.workflow1.append(this.component2);

    equal(this.component2 === this.workflow1[this.workflow1.length - 1], true, "Append should add the component to the end of the list");
    equal(this.component2 === this.workflow1[0], false, "Append should not add to the start of the list");

    ok(this.workflow1.append(this.component1, 2), "append accepts a second argument");
    raises(function () {
      this.workflow1.append(this.component1, {});
    }, "append second argument should be numeric");

    // start with clean workflow
    this.workflow1.clear();

    // add c then c2
    this.workflow1.append(this.component1).append(this.component2);
    // insert middle after position 0
    this.workflow1.append(this.component3, 0);

    equal(this.workflow1[1] === this.component3, true, "Component at position 1 should be c3");
    equal(this.workflow1[0] === this.component1, true, "Component at position 0 should be c");
    equal(this.workflow1[2] === this.component2, true, "Component at position 2 should be c2");

    // clear it down
    this.workflow1.clear();
    this.workflow1.append([this.component1, this.component2, this.component3]);

    equal(this.workflow1.length, 3, "Append should work on arrays of components");
    ok(this.component1 === this.workflow1[0], "Component at position 0 should be c");
    ok(this.component3 === this.workflow1[2], "Component at position 2 should be c3");

  });

  test("Append workflow", function () {

    ok(this.workflow1.append(this.workflow2), "Append should allow workflows to be appended");
    equal(this.workflow1[0], this.workflow2, "Workflows are accessible just like components");
    ok(this.workflow1.append(this.component1), "Workflows should be able to accept mixed content");
    equal(this.workflow1.length, 2, "Workflows as children count to parent length");
    ok(this.workflow1[0].append(this.component1), "Workflows as children can be appended to");

  });

  test("Append callbacks", function () {
    expect(2);
    // register callbacks
    this.workflow1.subscribe('workflow/update', this.callback);
    this.workflow1.subscribe('workflow/update', this.callback_with_data, this);

    // // append sommit
    this.workflow1.append(this.component1);
  });

  test("Append to child callbacks", function () {
    expect(2);
    // // register callbacks
    this.workflow1.subscribe('workflow/update', this.callback_with_data, this);

    this.workflow1.append(this.workflow2);
    // append a component to the child workflow
    this.workflow1[0].append(this.component2);
  });

  test("remove method", function () {
    ok(this.workflow1.remove, "Remove method should exist");
    raises(function () {
      this.workflow1.remove();
    }, "remove requires a parameter");
    raises(function () {
      this.workflow1.remove({});
    }, "remove expects a numeric input");
    raises(function () {
      this.workflow1.remove(0);
    }, "remove fails if an index is out of bounds");

    // add a component
    this.workflow1.append(this.component1);

    // remove it
    var ret_value = this.workflow1.remove(0);

    equal(this.workflow1.length, 0, "Removing a component decreases the length");
    equal(this.workflow1 === ret_value, true, "remove returns the workflow object");
    equal(this.workflow1[0], undefined, "Accessing a removed component is not possible");

    // add 5 more components
    this.workflow1.append([this.component1, this.component2, this.component3, this.component1, this.component2]);

    // remove a component from the middle
    this.workflow1.remove(2);

    equal(this.workflow1.length, 4, "remove should decrease the length when a component is removed from the middle");
    equal(this.workflow1[4], undefined, "remove should shift all elements down");

    // remove them all
    this.workflow1.remove(0).remove(0).remove(0).remove(0);

    equal(this.workflow1.length, 0, "Removing all components should result in length 0");
    equal(this.workflow1[0], undefined, "Removing all elements means nothing is accessible");

    raises(function () {
      this.workflow1.remove(0);
    }, "remove on an empty workflow should throw an exception");

  });

  test("Remove method events", function () {
    expect(4);
    // register callbacks
    this.workflow1.subscribe('workflow/update', this.callback);
    this.workflow1.subscribe('workflow/update', this.callback_with_data, this);

    // append sommit
    this.workflow1.append(this.component1).remove(0);
  });

  test("clear method", function () {
    expect(5);

    ok(this.workflow1.clear, "clear method should exist");
    equal(this.workflow1.clear() === this.workflow1, true, "clear method should return the workflow");
    ok(this.workflow1.clear(), "clear should work on an empty workflow");

    // add some components then clear
    this.workflow1.append([this.component1, this.component2, this.component3]).clear();

    equal(this.workflow1.length, 0, "Clearing should set length to 0");
    equal(this.workflow1[0], undefined, "After clearing no components should be left");

  });

  test("Clear method event", function () {
    expect(2);

    // register callback
    this.workflow1.subscribe('workflow/update', this.callback);

    // append sommit
    this.workflow1.append(this.component1).clear();
  });

  test("Unsubscribe method", function () {
    expect(1);
    // add subscription
    this.workflow1.subscribe('workflow/update', this.callback, this.workflow1);
    // test is working (will expect an assertion)
    this.workflow1.append(this.workflow2);
    // unsubscribe
    this.workflow1.unsubscribe('workflow/update', this.callback);
    // test it has been unsubscribed (shouldn't be another assertion)
    this.workflow1.clear();
  });

  test("getId method", function () {
    ok(this.workflow1.getId(), "Workflows should have an ID accessible at getId");
    ok(this.workflow1.getId() !== this.workflow2.getId(), "and they should not be the same as another workflow");
  });


  module('Component', {

    setup: function () {
      var all = {
          name: 'name',
          description: 'description',
          annotation: 'annotation'
        };


        this.missing_description = {
          name: 'name',
          annotation: 'annotation'
        };

        this.missing_annotation = {
          name: 'name',
          description: 'description'
        };


        this.missing_type = {
          description: 'description',
          annotation: 'annotation',
          name: 'name'
        };

        this.wrong_type = {
          name: 'name',
          description: 'description',
          annotation: 'annotation'
        };

        this.missing_name = {
          description: 'description',
          annotation: 'annotation'
        };

        this.component1 = new UncertWeb.Component(all);
        this.component2 = new UncertWeb.Component(all);
        this.component1clone = this.component1;

    }
  });

  test("Component object", function () {
    equal(UncertWeb.Component === undefined, false, "Component should not be undefined.");
  });

  test("Component constructor function", function () {
    expect(7);

    ok(UncertWeb.isObject(this.component1), "Component should be an object");
    ok(this.component2 !== this.component1, "Two Component objects should not be equal");
    ok(this.component1clone === this.component1, "Two identical Component objects should be equal");

    // optional properties
    ok(this.component1, "Component with all properties should construct");
    ok(new UncertWeb.Component(this.missing_description), "Description is optional");

    // mandatory properties
    raises(function () {
      new UncertWeb.Component(this.missing_name);
    }, "Missing a name property should raise an exception");

    raises(function () {
      new UncertWeb.Component(this.missing_annotation);
    }, "Missing an annotation property should raise an exception");
  });

  test("Component properties", function () {

    // name property
    equal(this.component1.name, undefined, "Name property should be private");
    equal(this.component1.getName(), 'name', "Name property should be accessible via getName()");

    // description property
    equal(this.component1.description, undefined, "description property should be private");
    equal(this.component1.getDescription(), 'description', "description property should be accesible via getDescription()");

    // annotation property
    equal(this.component1.annotation, undefined, "annotation property should be private");
    equal(this.component1.getAnnotation(), 'annotation', "annotation property should be accessible via getAnnotation()");

    equal(this.component1._id, undefined, "_id property should be private");
    ok(this.component1.getId(), "But it should be accessible via the getId method");
  });

  module("Broker");

  test("Broker interface", function () {
    ok(UncertWeb.isObject(UncertWeb.broker), "Broker object should exist");
    ok(UncertWeb.isFunction(UncertWeb.broker.search), "and it should have a search function");
    ok(UncertWeb.isFunction(UncertWeb.broker.all), "and it should have an all function");
  });

  // test that the all function returns something
  test("Broker callback", function () {
    var expected_time = 3;
    expect(6);
    stop(); // pause the test
    UncertWeb.broker.all().done(function (data) {
      ok(data, "The search should return something");
      ok(UncertWeb.isNumber(data.num_results), "with a number of results");

      ok(data.completed_in, "it should also incude a time taken for the search");
      ok(data.completed_in < expected_time, "and it should return within " + expected_time + " seconds");

      ok(data.query, "it should also contain the query string sent to the broker");

      ok(UncertWeb.isArray(data.results), "but most importantly it should contain the results array");

      start();
    });
  });

  test("Broker results", function () {
    stop();

    UncertWeb.broker.all().done(function (data) {
      expect(data.num_results * 4);
      $.each(data.results, function (index, elem) {
        ok(elem.annotation, "results should have an annotation");
        ok(elem.title, "and a title");
        ok(elem.summary, "and a summary");
        ok(elem.id, "and an ID");
      });
      start();
    });
  });

  test("No results", function () {
    expect(3);
    var not_in_broker = "NOT_IN_THE_BROKER";
    stop();

    UncertWeb.broker.search(not_in_broker).done(function (data) {
      equal(data.results.length, 0, "searching for a term not in the broker should return an empty result set");
      equal(data.num_results, 0, "as reflected in the num_results property");
      ok(data.results, "but the results array should exist nonetheless");
      start();
    });
  });

  test('Override search config', function() {
    stop(2);
    expect(2);

    UncertWeb.broker.search("e").done(function (results) {
      ok(results.num_results > 1, "Searching for 'e' returns more than 1 result");
      start(1);
    });

    UncertWeb.broker.search("e", {
      ct: 1
    }).done(function (results) {
      equal(results.num_results, 1, "Unless you override the search parameters");
      start(1);
    });
  });

  test("Inline callbacks", function () {
    stop(3);
    expect(5);


    UncertWeb.broker.all(function (data) {
      ok(true, "inline callbacks should work");
      ok(data, "and have access to the data");
      ok(UncertWeb.isArray(data.results), "with a results array");
      start();
    });

    UncertWeb.broker.search("e", {}, function (data) {
      ok(true, "Inline callbacks work when config parameters sent");
      start();
    });



    UncertWeb.broker.search("e", {
      fail: true
    },
    function(){ /* success callback */ },
    function (status) {
      ok(true, "Inline fail callback also works");
      start();
    });
  });

  test("Broker performance", function () {

    var i = 0,
        iterations = 10,
        expected_time = 3,
        dfds = [],
        length,
        assert = function (data) {
          ok(data.completed_in < expected_time, "asynchronous requests should return in a reasonable time " + data.completed_in);
          start();
        };
    // stop until we hear start a certain number of times
    stop(iterations);
    expect(iterations);

    for( ; i < iterations; i += 1) {
      UncertWeb.broker.search('habitat').done(assert);
    }

  });

  module("Encode", {
    // setup
    setup: function () {
      this.encoder = UncertWeb.Encode;

    }
  });

  test("Encode module", function () {
    ok(UncertWeb.Encode, "The Encode module should exist in the UncertWeb object");
    ok(UncertWeb.isObject(UncertWeb.Encode), "and it should be an object literal");
    ok(UncertWeb.Encode.asBPMN, "and it should be able to encode as BPMN");
    ok(UncertWeb.isFunction(UncertWeb.Encode.asBPMN), "using a function");
  });

  test("BPMN encoding", function () {
    var bpmn = UncertWeb.Encode.asBPMN(),
        $bpmn = $(bpmn);

    ok(bpmn, "asBPMN should always return something");
    ok($bpmn.length > 0, "and it should be valid XML");

  });

  test("BPMN definition element", function () {

    var bpmn = UncertWeb.Encode.asBPMN(),
    $bpmn = $(bpmn);


    equal($bpmn.prop('tagName'), 'definitions', 'The root element should be definitions');
    equal($bpmn.children().length, 0, "but it should not have any children");

    // namespaces
    equal("http://www.omg.org/spec/BPMN/20100524/MODEL", $bpmn.attr('xmlns'), "and it should have an xmlns attribute");
    equal("http://www.omg.org/spec/BPMN/20100524/DI", $bpmn.attr('xmlns:bpmndi'), "and an xmlns:bpmndi attribute");
    equal("http://www.omg.org/spec/DD/20100524/DC", $bpmn.attr('xmlns:dc'), "and an xmlns:dc attribute");
    equal("http://www.omg.org/spec/DD/20100524/DI", $bpmn.attr('xmlns:di'), "and an xmlns:di attribute");
    equal("http://www.jboss.org/drools/flow/gpd", $bpmn.attr('xmlns:g'), "and an xmlns:g attribute");
    equal("http://www.jboss.org/drools", $bpmn.attr('xmlns:tns'), "and an xmlns:tns attribute");
    equal("http://www.w3.org/2001/XMLSchema", $bpmn.attr('xmlns:xsd'), "and an xmlns:xsd attribute");
    equal("http://www.w3.org/2001/XMLSchema-instance", $bpmn.attr('xmlns:xsi'), "and an xmlns:xsi attribute");
    equal("http://www.jboss.org/drools", bpmn.getAttribute('targetNamespace'), "and a target namespace");


    // other attributes
    equal("UncertWeb JavaScript Client", $bpmn.attr('exporter'), "The exporter should be UncertWeb JavaScript Client");
    // Have to use javascript instead of jQuery as it doesn't handle camel-cased attribute names
    ok(bpmn.getAttribute('exporterVersion'), "the exporter should have a version number");
    equal("Definition", $bpmn.attr('id'), "and it should have an ID of Definition");
    equal("", $bpmn.attr('name'), "and a name (that is blank?)");
    equal("http://www.mvel.org/2.0", bpmn.getAttribute('expressionLanguage'), "and use MVEL as the expression language");
    equal("http://www.java.com/javaTypes", bpmn.getAttribute('typeLanguage'), "and a type language");
    equal("", bpmn.getAttributeNS("xsi", "schemaLocation"), "and a schema location");

  });


  test("BPMN generation of simple workflow", function () {
    var w = new UncertWeb.Workflow(),
        c = generateComponent(),
        c2 = generateComponent();


    // add component to workflow
    w.append([c, c2]);

    var bpmn = UncertWeb.Encode.asBPMN(w),
    $bpmn = $(bpmn),
    $process = $(bpmn).children('process').eq(0),
    process = $process.get(0),
    $tasks = $process.children('scriptTask');
    // console.log(new XMLSerializer().serializeToString(bpmn));


    equal($bpmn.children('process').length, 1, "There should be a single process element representing the workflow");

    var isClosed = process.getAttribute('isClosed');
    ok(isClosed, "it should have a isClosed attribute");
    equal(isClosed, 'false', 'and it should be false');

    var isExecutable = process.getAttribute('isExecutable');
    ok(isExecutable, "it should also have an isExecutable attribute");
    equal(isExecutable, "true", "which is set to true");

    var name = process.getAttribute('name');
    ok(name, "it should also have a name");
    equal(w.getId(), name, "that is the same as the workflow ID");

    var processType = process.getAttribute('processType');
    ok(processType, "it should also have a processType");
    equal(processType, "Private", "that is private");

    equal($tasks.length, w.length, "The process should have a scriptTask node for each component");

    var task = $tasks.get(0);

    var completionQuantity = task.getAttribute('completionQuantity');
    ok(completionQuantity, 'and it should have a completionQuantity attribute');
    equal(completionQuantity, 1, 'that should equal 1');

    var isForCompensation = task.getAttribute('isForCompensation');
    ok(isForCompensation, "and it should have an isForCompensation attribute");
    equal(isForCompensation, 'false', "which is set to false");

    var taskName = task.getAttribute('name');
    ok(taskName, "it should have a name attribute");
    equal(taskName, c.getAnnotation(), 'that is set to the component annotation');

    var startQuantity = task.getAttribute('startQuantity');
    ok(startQuantity, "it should also have a startQuantity attribute");
    equal(startQuantity, "1", "that is equal to 1");

    var taskID = task.getAttribute('id');
    ok(taskID, "it should also have an ID attribute");
    equal(taskID, c.getId(), 'that is equal to the component ID');

    // Start and end events
    var $start = $process.children('startEvent'),
        start = $start.get(0);
    equal($start.length, 1, "A workflow should have a start event");

    var startID = $start.attr('id');
    ok(startID, "and it should have an ID");
    equal(startID, w.getId() + "_start", "that is equal to the workflow ID and _start");

    var startIsInterrupting = start.getAttribute('isInterrupting');
    ok(startIsInterrupting, "and it should have an isInterrupting attribute");
    equal(startIsInterrupting, "true", "that is set to true");

    var startName = start.getAttribute('name');
    ok(startName, "and it should have a name");
    equal(startName, "Start", "that is equal to Start");

    var startParellel = start.getAttribute('parellelMultiple');
    ok(startParellel, "it should also have a parallelMultiple attribute");
    equal(startParellel, "false", "that is false");

    var $end = $process.children('endEvent');
    equal($end.length, 1, "A workflow should have a single end event");

    var endID = $end.attr('id');
    ok(endID, "and it should have an ID attribute");
    equal(endID, w.getId() + "_end", "and it should be equal to the workflow ID + _end");

    var endName = $end.attr('name');
    ok(endName, "and it should have a name attribute");
    equal(endName, "End", "that is equal to End");

    var ed = $end.find('terminateEventDefinition');
    ok(ed, "An end event should have a terminateEventDefinition child");
    ok(ed.attr('id'), 'with an ID attribute');

    // Sequence flow
    var $sequences = $process.find('sequenceFlow');
    ok($sequences.length, "A workflow should have at least 1 sequenceFlow element");
    equal($sequences.length, w.length + 1, "actually it should have 1 for each child plus 1 to start");

    var startSeq = $sequences.filter(function (index) {
      return this.getAttribute('sourceRef') == startID;
    });

    var endSeq = $sequences.filter(function (index) {
      return this.getAttribute('targetRef') == endID;
    });

    ok(startSeq.length == 1, "There should be a single sequenceFlow from the start event");

    ok(endSeq.length == 1, "and a single sequenceFlow going to the end event");

    ok(startSeq.get(0).getAttribute('targetRef') != endID, "The start event cannot route to the end event");

    for (var i = 0; i < w.length; i++) {
      var id = w[i].getId();
      ok($bpmn.find('sequenceFlow[sourceRef="'+id+'"]').length == 1, "there should be a sourceRef for each component");
      ok($bpmn.find('sequenceFlow[targetRef="'+id+'"]').length == 1, "there should also be a targetRef for each component");
    }
  });


  test('BPMN generation of nested workflows', function() {
    var w1 = new UncertWeb.Workflow(),
        c1 = generateComponent();
        w2 = new UncertWeb.Workflow(),
        c2 = generateComponent();

    w1.append([c1, w2]);
    w2.append(c2);

    var bpmn = UncertWeb.Encode.asBPMN(w1),
    $bpmn = $(bpmn),
    $process = $(bpmn).children('process').eq(0),
    process = $process.get(0),
    $tasks = $process.children('scriptTask'),
    $subProcesses = $process.children('subProcess');

    equal($tasks.length, 1, "Nested workflows should not create scriptTask elements");
    equal($subProcesses.length, 1, "but they should create a subProcess element");

    var $sp = $subProcesses.eq(0),
        sp = $sp.get(0);

    ok(sp.getAttribute('completionQuantity'), "A subProcess should have a completionQuantity attribute");
    equal(sp.getAttribute('completionQuantity'), "1", "that is equal to 1");

    ok($sp.attr('id'), 'it should also have an ID');
    equal($sp.attr('id'), w2.getId(), 'that is equal to the nested workflow ID');

    ok(sp.getAttribute('isForCompensation'), "it should also have an isForCompensation attribute");
    equal(sp.getAttribute('isForCompensation'), 'false', 'that is equal to false');

    ok($sp.attr('name'), 'it should also have a name attribute');
    // TODO implement names here...

    ok(sp.getAttribute('startQuantity'), "it should also have a startQuantity attribute");
    equal(sp.getAttribute('startQuantity'), '1', 'that is equal to 1');

    ok(sp.getAttribute('triggeredByEvent'), 'it should also have a triggeredByEvent attribute');
    equal(sp.getAttribute('triggeredByEvent'), 'false', 'that is equal to false');

    var nestedEnd = $sp.find('endEvent');
    ok(nestedEnd.children().length === 0, "A nested end event does not have a terminateEventDefinition child");

    var $loopChars = $sp.find('multiInstanceLoopCharacteristics').eq(0),
        loopChars = $loopChars.get(0);
    ok($loopChars.length, "A subProcess should have a multiInstanceLoopCharacteristics child");

    ok(loopChars.getAttribute('behaviour'), "A multiInstanceLoopCharacteristics should have a behaviour attribute");
    equal(loopChars.getAttribute('behaviour'), 'All', 'that is equal to All');

    ok(loopChars.getAttribute('isSequential'), 'it should also have an isSequential attribute');
    equal(loopChars.getAttribute('isSequential'), 'false', 'that is equal to false');

    var ldir = $loopChars.find('loopDataInputRef').eq(0);
    ok(ldir.length, "it should have a loopDataInputRef child");
    equal(ldir.text(), w2.getId() + "_input", "whose value is equal to the nested workflow ID + _input");

    var idi = $loopChars.find('inputDataItem').eq(0);
    ok(idi.length, "and an inputDataItem child");
    ok(idi.get(0).getAttribute('isCollection'), "which has an isCollection attribute");
    equal(idi.get(0).getAttribute('isCollection'), "false", "whose value is false");

    var odi = $loopChars.find('outputDataItem').eq(0);
    ok(odi.length, "and an outputDataItem child");
    ok(odi.get(0).getAttribute('isCollection'), "which has an isCollection attribute");
    equal(odi.get(0).getAttribute('isCollection'), "false", "whose value is false");

  });

  test('eHabitat BPMN example', function() {
    var workflow = new UncertWeb.Workflow(),
        nestedWorkflow1 = new UncertWeb.Workflow(),
        nestedWorkflow2 = new UncertWeb.Workflow();

    // build the first MC block
    var wcsAccess = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[access:raster] WCS Access Broker'
    });

    var utsToRealisations = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[processing:datamanipulation:montecarlorealization] UTS to realizations'
    });

    var multiplexer = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[utils:multiplexerU] Multiplexer'
    });

    nestedWorkflow1.append([wcsAccess, utsToRealisations, multiplexer]);
    workflow.append(nestedWorkflow1);

    // Attach scriptTasks
    var scrambler = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[utils:scrambler] List Scrambler'
    });

    var wcsT = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[publish:raster] WCS-T'
    });

    workflow.append([scrambler, wcsT]);

    // Build second nested workflow
    var eHabitat = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[processing:geoprocessing:thematic:gpc:ehabitat] eHabitat'
    });

    nestedWorkflow2.append(eHabitat);

    workflow.append(nestedWorkflow2);

    // Add the remaining tasks
    var demultiplexer = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[utils:demultiplexer] Demultiplexer'
    });

    var utsExtraction = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: 'processing:datamanipulation:statisticsextraction] UTS Statistics Extraction'
    });

    var wcsPublisher = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[publisher:raster] WCS-T Publisher'
    });

    var wcsGenerator = new UncertWeb.Component({
      name: new Date(),
      description: 'test',
      annotation: '[access:raster] WCS Url generator'
    });

    workflow.append([demultiplexer, utsExtraction, wcsPublisher, wcsGenerator]);

    // create the BPMN
    var bpmn = UncertWeb.Encode.asBPMN(workflow),
        $bpmn = $(bpmn);

    console.log(bpmn);

    ok(bpmn, "It should at least do something!");
    equal($bpmn.find('process').length, 1, "There should be 1 process element");
    equal($bpmn.find('scriptTask').length, 10, "There should be 10 scriptTask elements");
    equal($bpmn.find('subProcess').length, 2, "There should be 2 subProcess elements");
    equal($bpmn.find('sequenceFlow').length, 15, "There should be 15 sequenceFlow elements");
    equal($bpmn.find('startEvent').length, 3, "There should be 3 startEvent elements");
    equal($bpmn.find('endEvent').length, 3, "There should be 3 endEvent elements");
    equal($bpmn.find('itemDefinition').length, 2, "There should be 2 itemDefinition elements");

  });


  module('CaaS');

  test("CaaS interface", function () {
    ok(UncertWeb.CaaS, "CaaS should exist");
    ok(UncertWeb.CaaS.publish, "and it should have a publish property");
    ok(UncertWeb.isFunction(UncertWeb.CaaS.publish), "... that is a function");
  });

  test("CaaS result", function () {
    var promise = UncertWeb.CaaS.publish();
    var values = ["SUCCESS", "FAILURE"];

    stop();
    expect(8);

    promise.done(function (result) {
      console.log(result);
      ok(result, "It should return something");
      ok(UncertWeb.isObject(result), "that is an object");
      ok(result.status, "that has a status property");
      ok($.inArray(result.status, values) > -1, "that is either SUCCESS or FAILURE");
      ok(result.message, "it should also have a message property");
      ok(UncertWeb.isArray(result.message), "that is an array");
      ok(result.message.length > 0, "with at least 1 message");
      ok(result.status === "FAILURE" && result.model === undefined, "it shouldn't have a model property if it was a failure");
      start();
    });


    // for (var i = 0; i < result.message.length; i++) {
    //   ok(UncertWeb.isString(result.message[i]), "all messages should be a string");
    // }
  });

  // test("CaaS communication", function () {
  //   stop(1);
  //   expect(1);
  //   UncertWeb.CaaS.publish()
  // });

}());