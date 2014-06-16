This script provides the ability to document an RDF/RDFa/etc. schema with minimal markup and annotation using RDFa and the [schema.org](http://schema.org) Class and Property classes.  It will generate the rest of the markup within the browser that allows a user to navigate between classes while displaying all the properties for each class.

It relies on the [Green Turtle](https://github.com/alexmilowski/green-turtle) RDFa library to process the RDFa annotations.

# Using

The minimal invocation is:

    <script type="text/javascript" src="RDFa.js">//</script>
    <script type="text/javascript" src="schema.js">//</script>
    <script type="text/javascript">
    window.addEventListener("rdfa.loaded",function() {
       console.log("Processing schema...");
       var schemaProcessor = new RDFaDocumentationGenerator();
       schemaProcessor.apply(document.body);
       schemaProcessor.generateSummary(document.getElementById("schema.summary"));
    });
   </script>

The script does not automatically invoke itself and so you must first apply it to the element that contains the schema and ask it to generate various other information.  By default, the `apply()` method will complete all the internal references and expand out properties for each class.  The `generateSummary()` method adds a list of class and properties defined by the schema.

There is a minimal stylesheet provided that will format various bits but a user should consider adding further style information.

An example of its use is can be seen at [pantabular.org](http://pantabular.org/).
