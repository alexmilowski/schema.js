
function RDFaDocumentationGenerator() {
   this.elements = {};
   this.elements["class-heading"] = { name: "h3"};
   this.elements["property-heading"] = { name: "h3"};
   
}

RDFaDocumentationGenerator.prototype.apply = function(element) {
   var doc = Document.prototype.isPrototypeOf(element) ? element : element.ownerDocument;
   var defined = doc.data.getValues(element.baseURI,"dc:id");
   doc.data.graph.prefixes["schemajs"] = "http://www.milowski.com/schemajs/";
   var vocab = defined.length>0 ? defined[0] : element.baseURI;
   console.log("Processing vocabulary "+vocab);
   
   // Shorten the names for each class
   var descs = doc.getElementsByType("schema:Class");
   for (var i=0; i<descs.length; i++) {
      var name = null;
      if (descs[i].data.id.indexOf(vocab)==0) {
         name = descs[i].data.id.substring(vocab.length);
      } else {
         throw "Cannot shorten name "+descs[i].data.id+" from vocabulary "+vocab;
      }
      document.data.graph.add(descs[i].data.id,"schemajs:name",name);
   }
  
   // shorten the names for each property and adjust links
   var properties = doc.getElementsByType("schema:Property");
   for (var i=0; i<properties.length; i++) {
      var name = null;
      if (properties[i].data.id.indexOf(vocab)==0) {
         name = properties[i].data.id.substring(vocab.length);
      } else {
         throw "Cannot shorten name "+properties[i].data.id+" from vocabulary "+vocab;
      }
      document.data.graph.add(properties[i].data.id,"schemajs:name",name);
      
      // adjust links to local definitions
      properties[i].setAttribute("id",name);

      var heading = doc.createElement(this.elements["property-heading"].name);
      heading.appendChild(doc.createTextNode(name));
      if (properties[i].firstChild) {
         properties[i].insertBefore(heading,properties[i].firstChild);
      } else {
         properties[i].appendChild(heading);
      }

      var container = doc.createElement("div");
      container.className = "schema-property-definition";
      container.innerHTML = "<div class='schema-property-range'><h4>Values Expected</h4></div><div class='schema-property-domain'><h4>Used by Clases</h4></div><div class='clear'/>";
      properties[i].appendChild(container);
      
      var rangeContainer = container.firstChild;
      var domainContainer = container.firstChild.nextSibling;
      var processOrigins = function(originContainer,origins) {
         for (var j=0; j<origins.length; j++) {
            if (origins[j].origin.childNodes.length==0) {
               if (origins[j].value.indexOf(vocab)==0) {
                  var name = origins[j].value.substring(vocab.length);
                  origins[j].origin.appendChild(doc.createTextNode(name));
               } else {
                  var curie = doc.data.shorten(origins[j].value);
                  if (curie) {
                     origins[j].origin.appendChild(doc.createTextNode(curie));
                  }
               }
            }
            // check if the origin is not a link and then make it a link
            if (!origins[j].origin.href) {
               var name = doc.data.getValues(origins[j].value,"schemajs:name")[0];
               if (name) {
                  var link = doc.createElement("a");
                  link.href = "#"+name;
                  link.className = "schema-class schema-local";
                  link.appendChild(origins[j].origin.cloneNode(true));
                  origins[j].origin.parentNode.replaceChild(link,origins[j].origin);
                  origins[j].origin = link;
               }
            }
            originContainer.appendChild(origins[j].origin.cloneNode(true));
            originContainer.appendChild(doc.createElement("br"));
            origins[j].origin.parentNode.removeChild(origins[j].origin);
         }
      }
      processOrigins(rangeContainer,doc.data.getValueOrigins(properties[i].data.id,"schema:rangeIncludes"));
      processOrigins(domainContainer,doc.data.getValueOrigins(properties[i].data.id,"schema:domainIncludes"));
   }
   
   // Expand class documentation
   for (var i=0; i<descs.length; i++) {
      var name = doc.data.getValues(descs[i].data.id,"schemajs:name")[0];
      
      // set the id for local linking
      descs[i].setAttribute("id",name);
      
      var heading = doc.createElement(this.elements["class-heading"].name);
      var parentClasses = doc.data.getValueOrigins(descs[i].data.id,"schema:subClassOf");
      if (parentClasses.length==0) {
         // no subclass relationship so a simple heading
         heading.appendChild(doc.createTextNode(name));
      } else {
         heading.appendChild(doc.createTextNode(name+" : "));
         for (var p=0; p<parentClasses.length; p++) {
            if (p>0) {
               heading.appendChild(doc.createTextNode(", "));
            }
            if (parentClasses[p].origin.childNodes.length==0) {
               if (parentClasses[p].value.indexOf(vocab)==0) {
                  var name = parentClasses[p].value.substring(vocab.length);
                  parentClasses[p].origin.appendChild(doc.createTextNode(name));
               } else {
                  var curie = doc.data.shorten(parentClasses[p].value);
                  if (curie) {
                     parentClasses[p].origin.appendChild(doc.createTextNode(curie));
                  }
               }
            }
            if (!parentClasses[p].origin.href) {
               var name = doc.data.getValues(parentClasses[p].value,"schemajs:name")[0];
               if (name) {
                  var link = doc.createElement("a");
                  link.href = "#"+name;
                  link.className = "schema-class schema-local";
                  link.appendChild(parentClasses[p].origin.cloneNode(true));
                  parentClasses[p].origin.parentNode.replaceChild(link,parentClasses[p].origin);
                  parentClasses[p].origin = link;
               }
            }
            heading.appendChild(parentClasses[p].origin.cloneNode(true));
            parentClasses[p].origin.parentNode.removeChild(parentClasses[p].origin);
         }
      }
      if (descs[i].firstChild) {
         descs[i].insertBefore(heading,descs[i].firstChild);
      } else {
         descs[i].appendChild(heading);
      }
      var parentClasses = doc.data.getValues(descs[i].data.id,"schema:subClassOf");
      var properties = doc.data.getSubjects("schema:domainIncludes",descs[i].data.id);
      if (properties.length==0 && parentClasses.length==0) {
         continue;
      }
      
      var subclasses = doc.data.getSubjects("schema:subClassOf",descs[i].data.id);
      if (subclasses.length>0) {
         var subclassesContainer = doc.createElement("p");
         subclassesContainer.className = "schema-subclasses";
         subclassesContainer.appendChild(doc.createTextNode("Known subclasses: "));
         descs[i].appendChild(subclassesContainer);
         for (var s=0; s<subclasses.length; s++) {
            if (s>0) {
               subclassesContainer.appendChild(doc.createTextNode(", "));
            }
            if (subclasses[s].indexOf(vocab)==0) {
               var sname = subclasses[s].substring(vocab.length);
               var a = doc.createElement("a");
               a.setAttribute("href","#"+sname);
               a.innerHTML = sname;
               a.className = "schema-class schema-local";
               subclassesContainer.appendChild(a);
            } else {
               var span = doc.createElement("span");
               span.className = "schema-class schema-external";
               var type = doc.data.shorten(subclasses[s]);
               span.innerHTML = type ? type : subclasses[s];
               subclassesContainer.appendChild(span);
            }
         }
      }
      var usedBy = doc.data.getSubjects("schema:rangeIncludes",descs[i].data.id);
      if (usedBy.length>0) {
         var usedByContainer = doc.createElement("p");
         usedByContainer.className = "schema-used-by-property";
         usedByContainer.appendChild(doc.createTextNode("Used by: "));
         descs[i].appendChild(usedByContainer);
         for (var s=0; s<usedBy.length; s++) {
            if (s>0) {
               usedByContainer.appendChild(doc.createTextNode(", "));
            }
            if (usedBy[s].indexOf(vocab)==0) {
               var sname = usedBy[s].substring(vocab.length);
               var a = doc.createElement("a");
               a.setAttribute("href","#"+sname);
               a.innerHTML = sname;
               a.className = "schema-property schema-local";
               usedByContainer.appendChild(a);
            } else {
               var span = doc.createElement("span");
               span.className = "schema-property schema-external";
               var type = doc.data.shorten(usedBy[s]);
               span.innerHTML = type ? type : usedBy[s];
               usedByContainer.appendChild(span);
            }
         }
      }
      
      var table = doc.createElement("table");
      table.className = "schema-class-properties";
      table.innerHTML = "<thead><tr><th>Property</th><th>Value</th><th>Description</th></tr></thead><tbody/>";
      descs[i].appendChild(table);
      var tbody = table.tBodies[0];
      
      var propertiesTableBody = function(tbody,properties) {
         for (var p=0; p<properties.length; p++) {
            var name = document.data.getValues(properties[p],"schemajs:name");
            var desc = document.data.getValues(properties[p],"schema:description");
            var ranges = document.data.getValues(properties[p],"schema:rangeIncludes");
            var row = doc.createElement("tr");
            tbody.appendChild(row);
            var cell = doc.createElement("td");
            cell.innerHTML = "<a class='schema-property schema-local' href='#"+name+"'>"+name+"</a>";
            row.appendChild(cell);
            cell = doc.createElement("td");
            for (var j=0; ranges && j<ranges.length; j++) {
               if (j>0) {
                  cell.appendChild(doc.createElement("br"));
               }
               if (ranges[j].indexOf(vocab)==0) {
                  var rangeName = ranges[j].substring(vocab.length);
                  var a = doc.createElement("a");
                  a.setAttribute("href","#"+rangeName);
                  a.innerHTML = rangeName;
                  a.className = "schema-property schema-local";
                  cell.appendChild(a);
               } else {
                  var span = doc.createElement("span");
                  span.className = "schema-property schema-external";
                  var type = doc.data.shorten(ranges[j]);
                  span.innerHTML = type ? type : ranges[j];
                  cell.appendChild(span);
               }
            }
            row.appendChild(cell);
            cell = doc.createElement("td");
            cell.appendChild(doc.createTextNode(desc));
            row.appendChild(cell);
         }
      };
      propertiesTableBody(tbody,properties);
      var traceInheritence = function(table,classes) {
         for (var p=0; p<classes.length; p++) {
            var properties = doc.data.getSubjects("schema:domainIncludes",classes[p]);
            if (properties.length==0) {
               continue;
            }
            var name = doc.data.getValues(classes[p],"schemajs:name")[0];
            var tbody = doc.createElement("tbody");
            tbody.innerHTML = "<tr><th colspan='3'>Inherited from <a href='#"+name+"'>"+name+"</a></th></tr>";
            table.appendChild(tbody);
            propertiesTableBody(tbody,properties);
            var superClasses = doc.data.getSubjects(classes[p],"schema:subClassOf");
            if (superClasses.length>0) {
               traceInheritence(table,superClasses);
            }
         }
      }
      traceInheritence(table,parentClasses);
   }
}

RDFaDocumentationGenerator.prototype.generateSummary = function(parent) {

   var container = parent.ownerDocument.createElement("div");
   container.className = "schema-summary";
   parent.appendChild(container);
   
   this.generateClassList(container);
   this.generatePropertyList(container);

}

RDFaDocumentationGenerator.prototype._generateList = function(parent,list,isClass) {
   var ul = parent.ownerDocument.createElement("ul");
   parent.appendChild(ul);
   for (var i=0; i<list.length; i++) {
      var li = parent.ownerDocument.createElement("li");
      var a = parent.ownerDocument.createElement("a");
      a.setAttribute("href","#"+list[i].name);
      a.className = isClass ? "schema-class schema-local" : "schema-property schema-local";
      a.appendChild(parent.ownerDocument.createTextNode(list[i].name));
      li.appendChild(a);
      if (list[i].description) {
         li.appendChild(parent.ownerDocument.createTextNode(" — "));
         var desc = parent.ownerDocument.createElement("span");
         desc.className = "schema-description";
         desc.appendChild(parent.ownerDocument.createTextNode(list[i].description));
         li.appendChild(desc);
      }
      ul.appendChild(li);
   }   
   
}

RDFaDocumentationGenerator.prototype.generateClassList = function(parent, options) {
   var descs = parent.ownerDocument.getElementsByType("schema:Class");
   var classes = [];
   for (var i=0; i<descs.length; i++) {
      classes.push({
         name: parent.ownerDocument.data.getValues(descs[i].data.id,"schemajs:name")[0],
         description: parent.ownerDocument.data.getValues(descs[i].data.id,"schema:description")[0]
      });
   }
   classes.sort(function (a,b) { return a.name.localeCompare(b.name)});
   var classesContainer = parent.ownerDocument.createElement("section");
   classesContainer.className = "schema-classes";
   classesContainer.innerHTML = "<h2>Classes</h2><div class='content'/>"
   if (options && options.insertBefore) {
      parent.parentNode.insertBefore(classesContainer,parent);
   } else if (options && options.replace) {
      parent.parentNode.replaceChild(classesContainer,parent)
   } else {
      parent.appendChild(classesContainer);
   }
   this._generateList(classesContainer.firstChild.nextSibling,classes,"schema-class schema-local");
}

RDFaDocumentationGenerator.prototype.generatePropertyList = function(parent,options) {
   var descs = parent.ownerDocument.getElementsByType("schema:Property");
   var properties = [];
   for (var i=0; i<descs.length; i++) {
      properties.push({
         name: parent.ownerDocument.data.getValues(descs[i].data.id,"schemajs:name")[0],
         description: parent.ownerDocument.data.getValues(descs[i].data.id,"schema:description")[0]
      });
   }
   properties.sort(function (a,b) { return a.name.localeCompare(b.name)});
   
   var propsContainer = parent.ownerDocument.createElement("section");
   propsContainer.className = "schema-properties";
   propsContainer.innerHTML = "<h2>Properties</h2><div class='content'/>"
   if (options && options.insertBefore) {
      parent.parentNode.insertBefore(propsContainer,parent);
   } else if (options && options.replace) {
      parent.parentNode.replaceChild(propsContainer,parent)
   } else {
      parent.appendChild(propsContainer);
   }
   this._generateList(propsContainer.firstChild.nextSibling,properties,"schema-property schema-local");
   
}


