var svgm;
// stores all active intermediate objects
var marks=[];
// intermediate link between the data, d3, and its dropzones
var markcount=0;

var dataset = [];
var zonewidth=50;
//var n;
var allData=[];

var menus = {"rect":
							{"height":
								["linear","logarithmic"],
							"width":
								["linear","logarithmic"],
							"fill":
								["Pallet A","Pallet B","Pallet C"],
							"stroke":
								["Pallet A","Pallet B","Pallet C"]}, 
						"arc":
							{"angle":
								["linear","logarithmic"],
							"inner radius":
								["linear","logarithmic"],
							"outer radius":
								["linear","logarithmic"],
							"fill":
								["Pallet A","Pallet B","Pallet C"],
							"stroke":
								["Pallet A","Pallet B","Pallet C"]}};


var menulabels;
var extents;


function dataObjectsToColumn(objectArray,colname){
	var column=[];
	for(var i in objectArray) {
		column.push(objectArray[i][colname]);
	}
	return column;
}




$(document).ready(function(){
		
	//$.getJSON("./olympics.json",function(response){
	
	//Read in Data from CSV File
	d3.csv("./olympics.csv", function(response) {
		//console.log(response);
		
		//use d3 loader instead?
		for (var i in response) {
			allData[i]={};
			for(var attr in response[0]) {
				if(attr==="ISO Country code" || attr === "Country name" || attr === "Continent") {
					allData[i][attr] = response[i][attr];
				} else {
					allData[i][attr] = +response[i][attr]; //data holds number
				}
			}
		}
		
		//n=allData.length;
		console.log(allData);
		
		//populate list of columns
		for(var label in allData[0]) {
			var newelement=$("<li class=\"column\"></li>");
			newelement.text(label);
			newelement.appendTo($("#data ul"));
		}
		
		$(".column").draggable({
			start:function(event,ui){
				$(".menudiv").show(); //show available attribute encoders
			},
			stop:function(event,ui){
				$(".menudiv").hide(500); // necessary or drop won't register
			}
		})
		.draggable("option","helper","clone");
	});
	
	
		
  $(".mark").draggable()
						.draggable("option", "revert", "invalid")
						.draggable("option", "helper", "clone");

  $("#region").droppable({
			accept: ".mark",
			drop: function( event, ui ) {
				var x,y;
				var dragged=ui.draggable;
				var visarea = $("#vis");
				x=event.pageX - visarea.offset().left;
				y=event.pageY - visarea.offset().top;
				xmlns = "http://www.w3.org/2000/svg";
				
				if(dragged.hasClass("mark")) {
					var markID = $(dragged).attr("id").split("_")[1];
					svgm = d3.select("svg#vis");
	
					//dataset=[];
					//for(var i=0; i<n;i++) dataset.push(20);
					dataset = new Array(allData.length);
	
					createMarks(x,y,markcount,markID);

					//make a 1st level menu for each graph
					createMenus(markID,markcount);

					markcount++;					
				}
			}
	});

});






var createMenus=function(markID,markcount) {
	console.log(markID);
	
	var menudivs=[];
	menulabels=d3.keys(menus[markID]);
	
	var menuitem;
	console.log(menulabels);
	
	for (var divnum=0; divnum<menulabels.length; divnum++) {
		menuitem=$("<div class=\"menudiv"+divnum+" menudiv\" id=\"menudiv_"+markcount+"_"+divnum+"\" style=\"position:absolute;\">"+menulabels[divnum]+ "</div>");
		
		menudivs.push(menuitem);
		menuitem.appendTo($("body"));
		menuitem.hide();
		
		//move menu item to rect
		var myid = menuitem.attr("id");
		var marknum = myid.split("_")[1];
		var menuindex = myid.split("_")[2];
		var markgroup = d3.select(".mark"+marknum);		
		//var attachedmarks = markgroup.selectAll("rect");
		var cleantrans = markgroup.attr("transform").substring(10).split(")")[0].split(",");
		var minx = +cleantrans[0];
		var maxy = +cleantrans[1];
		var visarea = $("#vis");
		 
		menuitem.css("left",(minx+visarea.offset().left)+"px");
		menuitem.css("top",maxy+visarea.offset().top+120+menuindex*20+"px");
		
		menuitem.droppable({
		
			accept: ".column",
			drop: function(event,ui){
				// TODO take default behavior
			},
			activate:function(event,ui){ },
			over:function(event,ui){
				var mytext = d3.select(this);
				var myid = mytext.attr("id");
				var marknum = myid.split("_")[1];
				var menuindex = myid.split("_")[2];
				mytext.classed("hoverselected",true);
				// reveal next level
				$(".optiondiv").hide();
				$(".optiondiv_"+marknum+"_"+menuindex).show();
			},
			out:function(event,ui){
				var mytext = d3.select(this);
				mytext.classed("hoverselected",false);
				//hide other elements
			}
			
		});
		
		menuitem.droppable("option","tolerance","pointer");
		
		// make a 2nd level menu for each 1st level menu
		var optionslist = menus[markID][menulabels[divnum]];
		for(var optionnum=0; optionnum<optionslist.length; optionnum++) {
			option=$("<div class=\"optiondiv_"+markcount+"_"+divnum+" optiondiv\" id=\"optiondiv_"+markcount+"_"+divnum+"_"+optionnum+"\" style=\"position:absolute;\">"+optionslist[optionnum]+ "</div>");
			option.appendTo($("body"));
			option.hide();

			var myid = option.attr("id");
			var marknum = myid.split("_")[1];
			var menuindex = myid.split("_")[2];
			var myparent = d3.select("#menudiv_"+marknum+"_"+menuindex);
			var parentX = +(myparent.style("left").split("px")[0]);
			var parentY = +(myparent.style("top").split("px")[0]);
			var visarea = $("#vis");
			
			option.css("left",(parentX+zonewidth*2)+"px");
			option.css("top",parentY+optionnum*20+"px");
			
			option.droppable({
				accept: ".column",
				drop:dropSubMenu,
				activate:function(event,ui){},
				deactivate:function(event,ui){
					$(this).hide(500);
				},
				over:function(event,ui){}
			});
			
			option.droppable("option","tolerance","touch");
		}
	}
}





var createMarks=function(x,y,markcount,type) {
	
	switch(type) {
		
		case "rect":
			var rectcont = svgm.append("g")
			.classed("mark"+markcount,true)
			.attr("transform", "translate(" + x + "," + y + ")")
			.attr("fill","steelblue")
			.attr("stroke","#ccc")
			.attr("stroke-width","2");
	
			rectcont.selectAll("rect")
			.data(dataset)
			.enter()
			.append("rect")
			.attr("height",100)
			.attr("width",50)
			.attr("x",0)
			.attr("y",0)	
			.classed("realmark",true)
			.classed("tempmark",true);
			break;
		
		case "arc":
			var donut = d3.layout.pie(),
			arc = d3.svg.arc().innerRadius(0).outerRadius(50);
	
			var arcscont=svgm.append("g")
				.data([dataset])
				.attr("class","mark"+markcount)
				.attr("transform", "translate(" + x + "," + y + ")")
				.attr("stroke","#ccc")
				.classed("tempmark",true)
				.attr("stroke-width","2");
			
			var arcs=arcscont
				.selectAll(".mark"+markcount+" g.arc")
				.data(donut)
				.enter().append("g")		
				.attr("class", "arc");
				
			arcs.append("path")
				.attr("fill", "steelblue")
				.attr("d", arc)
				.classed("realmark",true);
			break;
	}
}






var dropSubMenu=function(event,ui){
	//switch based on parent menu type
	var option = $(this);
	var myid = option.attr("id");
	var s = myid.split("_");
	
	//high-level mark, first-level menu, second-level menu option
	var marknum = s[1], menuindex = s[2], optionindex = s[3];
	var myparent = d3.select("#menudiv_"+marknum+"_"+menuindex);
	
	console.log("DROP "  + menulabels[menuindex]+" "+option.text());
	
	var parameter = menulabels[menuindex]; //second-level menu option
	var colname = ui.draggable.text(); //column name of data
	
	var datacolumn = dataObjectsToColumn(allData,colname);
	var extents = d3.extent(datacolumn); 

	var yscale;
	var colorscale;

	//Set scales to either linear or logarithmic
	var scaleselection = option.text();
	switch(scaleselection) {
		case "linear":
			yscale = d3.scale.linear()
				.domain(extents)
				.range([0, 100]);
			break;
		
		case "logarithmic":
			if(extents[0]<=0) extents[0]=1; //how to deal with zeroes?
			yscale = d3.scale.log()
				.domain(extents)
				.range([0, 100]);
			break;
		
		default: 
			var palletselection = option.text().split(" ")[1];
			switch(palletselection) {
				case "A": 
					colorscale=d3.scale.category20().domain(datacolumn);
					break;
				case "B":
					colorscale=d3.scale.category20b().domain(datacolumn);
					break;
				case "C":
					colorscale=d3.scale.category20c().domain(datacolumn);
					break;
			}
	}
			

	console.log("dropped "+ colname + " on mark"+marknum);	
	var attachedmarks = d3.selectAll(".mark"+marknum+" .realmark");
	
	var nodeType;
	d3.select(".mark"+marknum+" .realmark").each(function(d,i){nodeType=this.nodeName;}); // better way?
	
	var logextra = 0;
	svgm = d3.select("svg#vis");
	console.log(attachedmarks);
	
	
	
	
	/*if(nodeType==="rect"){
		var marks=svgm.selectAll(".mark"+marknum+" .realmark")
			.data(allData)
	}
	else if(nodeType==="path") {
		var marks=svgm.selectAll("g.mark"+marknum)
			.data([allData])	
	}
	
	
	if(scaleselection==="logarithmic") marks.classed("logX",true);
	if(marks.classed("logX")) logextra=1; // fixes 0 values */
	
	
	
	
/*	if(nodeType==="path")
	{
	}
	else if(nodeType==="rect")
	{
		marks.enter()
		.append("rect")
		.attr("stroke-width","2")
		.attr("class","mark"+marknum)
		.attr("fill","steelblue")
		.attr("stroke","#ccc");
	}	*/
	
	
	logextra = scaleselection==="logarithmic" ? 1 : 0;
	
	switch(nodeType) {
		case "rect":
			
			var marks=svgm.selectAll(".mark"+marknum+" .realmark")
										.data(allData);
										
			switch(parameter) {
				case "height":
					marks.transition()
						.attr("height",function(d,i){return yscale(d[colname]+logextra);})
						.attr("width",20)
						.attr("x",function(d,i){return i*20;})
						.attr("y",function(d,i){return 100-yscale(d[colname]+logextra);});
					break;
					
				case "width":
					marks.transition()
						.attr("width",function(d,i){return yscale(d[colname]+logextra);})
						.attr("height",20)
						.attr("x",function(d,i){return 0;})	
						.attr("y",function(d,i){return i*20;});
					break;
				
				case "fill":
					marks.attr("fill",function(d,i){return colorscale(d[colname]);})		
					break;
					
				case "stroke":
					marks.attr("stroke",function(d,i){return colorscale(d[colname]);})
					break;
			}
	
		case "path":
			
			var arc = d3.svg.arc();
			var marks=svgm.selectAll("g.mark"+marknum)
										.data([allData]);
			
			switch(parameter) {
				case "angle":
					marks.transition()
						.attr("height",function(d,i){return yscale(d[colname]+logextra);})
						.attr("width",20)
						.attr("x",function(d,i){return i*20;})
						.attr("y",function(d,i){return 100-yscale(d[colname]+logextra);});
					break;
					
				case "inner radius":
					arc.outerRadius(100);
					arc.innerRadius(function(d,i){
						return yscale(datacolumn[i]+logextra);
					});
					marks.selectAll("path").transition()
						.attr("d", arc); 						
					break;
				
				case "outer radius":
					arc.innerRadius(0);
					arc.outerRadius(function(d,i){
						return yscale(datacolumn[i]+logextra);
					});
					marks.selectAll("path").transition()
						.attr("d", arc); 			
					break;
					
				case "fill":
					marks.attr("fill",function(d,i){return colorscale(d[colname]);})
					break;
					
				case "stroke":
					marks.attr("stroke",function(d,i){return colorscale(d[colname]);})
					break;
			}
	}
	
	marks.exit().remove();

}



