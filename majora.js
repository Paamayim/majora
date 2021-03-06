var fs = require('fs');
var d3 = require('d3');
var tinycolor = require('tinycolor2');
var xmldom = require('xmldom');

var startDate = new Date("Jan 1 2015")
var now = new Date()
var w = 1440, // Width of SVG.
    h = 900, // Height of SVG.
    r0 = 200, // Radius of inner circle.
    r1 = Math.min(w, h) / 2 - 10, // Radius of outer circle.
    r2=(r1-r0)/13, // Radius delta of days.
    rl = r1 - 5, // Radial distance of labels.
    months = [ // Name array for month labels.
     "Jan","Feb","Mar","Apr",
     "May","Jun","Jul","Aug",
     "Sep","Oct","Nov","Dec"
    ],
    monthColors = [
        "#661111",
        "#440011",
        "#ff8800",
        "#881122",
        "#ffff44",
        "#226600",
        "#33dd33",
        "#006644",
        "#112266",
        "#336688",
        "#443366",
        "#221133"
    ],
    days = repeatArray([
     "Sun",
     "Mon",
     "Tue",
     "Wed",
     "Thu",
     "Fri",
     "Sat",
    ], 37),
    startAngle = 0,
    endAngle = 2 * Math.PI * 7/8, // ~300 degrees
    dates=[]; // Array to hold 1 yr of dates.
    var endDate = new Date(startDate); // End date, incremented later.
    vis = d3.select("body") // SVG area to send output to.
      .append("svg:svg")
      .attr("width", w)
      .attr("height", h)
;
// Calculate the end date.
endDate.setFullYear(endDate.getFullYear()+1);
endDate.setDate(endDate.getDate()-1);

function repeatArray(arr, count) {
  var ln = arr.length;
  var b = new Array();
  for(i=0; i<count; i++) {
    b.push(arr[i%ln]);
  }
  return b;
}

var expiredColors = monthColors.map(function(c) {
    return tinycolor(c).desaturate(90).toString()
})


var getDayIndex = function(d) {
    if (d instanceof Date) {
        var date = d.getDate() - 1;
        var day = d.getDay();
        return (day - date + 35) % 7 + date;
    }

    return d;
}

var getAngle = function(d, offset) {
    offset = offset || 0
    return (getDayIndex(d)+offset)/37*(endAngle-startAngle)+startAngle;
}

var toDeg = function(rad) {
    return rad * 180 / Math.PI;
}

// Define the arc parameters for the individual days.
var arc = d3.svg.arc()
    .startAngle(function(d) { return getAngle(d); })
    .endAngle(function(d) { return getAngle(d, 1); })
    //.endAngle(function(d) { return (d.getMonth()+1)*Math.PI/6; })
    .innerRadius(function(d) { return r0+(12 - d.getMonth())*r2; })
    .outerRadius(function(d) { return r0+(12 - d.getMonth()-1)*r2; })
;
// Generate an array for each day of the year.
for (
    var d = new Date(startDate);
    d <= endDate;
    d.setDate(d.getDate()+1)
) dates.push(new Date(d));
// Draw faint arcs for each day (weekends filled, else outlined).
vis.append("svg:rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("stroke", "#000000")
    .attr("fill", "#000000")

vis.selectAll("g.AllDays")
    .data(dates)
    .enter().append("svg:g")
        .attr("class", "AllDays")
        .attr("transform", "translate(" + (w/2) + "," + (h/2) + ")")
    .append("svg:path")
        .attr("stroke", function(d, i) {
            return((d.getTime() < now.getTime()
                ? monthColors
                : monthColors)
                [d.getMonth()]);
            })
        .attr("fill", function(d, i) {
            return((d.getTime() < now.getTime()
                ? monthColors
                : expiredColors)
                [d.getMonth()]);
//            return (d.getTime() < now.getTime())?"#cccccc":"#ffffff";
         })
        .attr("d", arc)
;


vis.selectAll(".DayLabel")
    .data(dates)
    .enter().append("svg:text")
        .attr("transform", function(d) {
            var angle = Math.PI/2 - getAngle(d, 0.5);
            var r = (11 - d.getMonth() + 0.3) * r2 + r0
            return "translate("
                +(w/2+(r*Math.cos(angle)))
                +","
                +(h/2-(r*Math.sin(angle)))
                +") rotate("+toDeg(getAngle(d, 0.5))+")";
        })
        .attr("text-anchor", "middle")
        .attr("style"," font-style: normal; font-size: 6pt;")
        .attr("text-antialiasing","true")
        .attr("fill", function(d, i) {
            return((d.getTime() < now.getTime())
                ? monthColors[d.getMonth()]
                : "#000000");
            })
        .text(function(d){return d.getDate();})

vis.selectAll(".DOWLabel")
    .data(days)
    .enter().append("svg:text")
        .attr("class", "DOWLabel")
        .attr("transform", function(d,i) {
            var angle = Math.PI/2 - getAngle(i, 0.5);
            return "translate("
                +(w/2+(rl*Math.cos(angle)))
                +","
                +(h/2-(rl*Math.sin(angle)))
                +") rotate("+toDeg(getAngle(i, 0.5))+")";
         })
        .attr("text-anchor", "middle")
        .attr("style","font-size: 8pt; font-style: normal")
        .attr("text-antialiasing","true")
        .attr("fill", "#fff")
        .text(function(d,i){return d;})

// Add the central label.
vis.selectAll(".lbl")
    .data([
        "-" +
            ((((endDate.getTime() - now.getTime()) / 1000 / 3600)|0) + 24) +
            " Hours Remain-"
    ])
    .enter().append("svg:text")
    .attr("class","lbl")
    .attr("text-anchor", "middle")
    .attr("style"," font-weight: bold; font-size: 150%")
    .attr("fill", "#fff")
    .attr("transform", "translate(" + (w/2) + "," + (h/2) + ")")
    .attr("dy", 5)
    .text(function(d,i){return d;})
;
var svg = d3.select("svg")
    .attr("version", 1.1)
    .attr("xmlns", "http://www.w3.org/2000/svg");

function dom_string_lower(ds){
    // from http://stackoverflow.com/questions/20693235/get-lowercase-tag-names-with-xmldom-xmlserializer-in-node-js/20704228
    var cd = {}, //var to backup cdata contents
        i = 0,//key integer to cdata token
        tk = String(new Date().getTime());//cdata to restore

    //backup cdata and attributes, after replace string by tokens
    ds = ds.replace(/\<!\[CDATA\[.*?\]\]\>|[=]["'].*?["']/g, function(a){
        var k = tk + "_" + (++i);
        cd[k] = a;
        return k;
    });

    //to lower xml/html tags
    ds = ds.replace(/\<([A-Z\/])+([=]| |\>)/g, function(a, b){
        return String(a).toLowerCase();
    });

    //restore cdata contents
    for(var k in cd){
        ds = ds.replace(k, cd[k]);
    }

    cd = null;//Clean variable
    return ds;
}

var svgXML = (new xmldom.XMLSerializer()).serializeToString(svg[0][0]);
fs.writeFile('/tmp/majora.svg', dom_string_lower(svgXML));

