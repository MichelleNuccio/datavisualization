d3.csv("internet-usage.csv").then(function(data) {

 // transform the numeric rows in numeric values
data.forEach(function(d) {
    d.year = +d.Year;
    d.usage = +d["Share of the population using the Internet"];
});

// from 2005 to 2025 (>=2005 and <=2025)
const dataYear = data.filter(function(d) {
  return +d.year >= 2005 && +d.year <= 2025;
});

// --------Finding data for each region--------

const dataNorthAmerica = dataYear.filter(function(d) {
  return d.Entity === "North America (WB)";
});

const dataEuropeCentralAsia = dataYear.filter(function(d) {
  return d.Entity === "Europe and Central Asia (WB)";
});

const dataEastAsiaPacific = dataYear.filter(function(d) {
  return d.Entity === "East Asia and Pacific (WB)";
});

const dataLatinAmericaCaribbean = dataYear.filter(function(d) {
  return d.Entity === "Latin America and Caribbean (WB)";
});

const dataWorld = dataYear.filter(function(d) {
  return d.Entity === "World";
});

const dataSouthAsia = dataYear.filter(function(d) {
  return d.Entity === "South Asia (WB)";
});

const dataMiddleEastNorthAfrica = dataYear.filter(function(d) {
  return d.Entity === "Middle East, North Africa, Afghanistan and Pakistan (WB)";
});

const dataSubAfrica = dataYear.filter(function(d) {
  return d.Entity === "Sub-Saharan Africa (WB)";
});

// dimensions for the chart
const width = 821;
const height = 288;

// creation of svg: Scalable Vector Graphics
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .style("font-family", "Lato, sans-serif")
  .style("font-size", "16px");

// The values selected come from the inspection of the original diagram
// they could also be 0, 300 and 0, 50 - i think
const x = d3.scaleLinear()
  .domain([2005, 2025])
  .range([40, width - 260]);

const y = d3.scaleLinear()
  .domain([0, 100])
  .range([height - 30, 20]);

// border
svg.append("rect")
  .attr("x", 40)
  .attr("y", 20)
  .attr("width", width - 260)
  .attr("height", height - 30)
  .attr("stroke", "none")
  .attr("fill", "none");

//---------vertical and horizontal axes--------

// horizontal ax
svg.append("g")
  .attr("transform", `translate(0, ${height - 30})`)
  .call(
    d3.axisBottom(x)
      .tickValues([2005, 2010, 2015, 2020, 2025])
      .tickFormat(d3.format("d"))
  );

//horizontal dashed lines
svg.append("g")
  .selectAll("line")
  .data([20, 40, 60, 80, 100])
  .join("line")
  .attr("x1", x(2005))
  .attr("x2", x(2025))
  .attr("y1", function(d) {
    return y(d);
  })
  .attr("y2", function(d) {
    return y(d);
  })
  .attr("stroke", "#dfdfdf")
  .attr("stroke-width", 1)
  .attr("stroke-dasharray", "4,4");

// vertical ax
svg.append("g")
  .attr("transform", "translate(40, 0)")
  .attr("stroke-width", 0)
  .call(
    d3.axisLeft(y)
      .tickValues([0, 20, 40, 60, 80, 100])
      .tickFormat(function(d) {
        return d + "%";
      })
  );


//---------Palette Colours---------

const palette = {
  NorthAmerica: "#6E3E92",
  EuropeCentralAsia: "#B23508",
  EastAsiaPacific: "#4D6A9C",
  LatinAmericaCaribbean: "#9A6D3A",
  World: "#A2559D",
  SouthAsia: "#8C3243",
  MiddleEastNorthAfrica: "#308C6A",
  SubAfrica: "#00295B"
};

// ---------Instruction to create the line chart---------

// How to connect the points - take the x and y coordinates from the data and create a line path
// x -> year | y -> usage
const line = d3.line()
  .x(function(d) {
    return x(d.year);
  })
  .y(function(d) {
    return y(d.usage);
  });

//---------Creation of lines for different regions---------

// NORTH AMERICA LINE
svg.append("path")
  .datum(dataNorthAmerica.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.NorthAmerica)
  .attr("stroke-width", 1.5);

// EUROPE AND CENTRAL ASIA LINE
svg.append("path")
  .datum(dataEuropeCentralAsia.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.EuropeCentralAsia)
  .attr("stroke-width", 1.5);

// EAST ASIA AND PACIFIC LINE
svg.append("path")
  .datum(dataEastAsiaPacific.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.EastAsiaPacific)
  .attr("stroke-width", 1.5);

// LATIN AMERICA AND CARIBBEAN LINE
svg.append("path")
  .datum(dataLatinAmericaCaribbean.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.LatinAmericaCaribbean)
  .attr("stroke-width", 1.5);

// WORLD LINE
svg.append("path")
  .datum(dataWorld.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.World)
  .attr("stroke-width", 1.5);

// SOUTH ASIA LINE
svg.append("path")
  .datum(dataSouthAsia.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.SouthAsia)
  .attr("stroke-width", 1.5);

// MIDDLE EAST AND NORTH AFRICA, AFGHANISTAN AND PAKISTAN LINE
svg.append("path")
  .datum(dataMiddleEastNorthAfrica.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.MiddleEastNorthAfrica)
  .attr("stroke-width", 1.5);

// SUB-SAHARAN AFRICA LINE
svg.append("path")
  .datum(dataSubAfrica.sort(function(a, b) {
    return a.year - b.year;
  }))
  .attr("d", line)
  .attr("fill", "none")
  .attr("stroke", palette.SubAfrica)
  .attr("stroke-width", 1.5);

//---------Dots for each line---------

// creation of tooltip for the dots
const tooltip = d3.select("body")
  .append("div")
  .style("position", "fixed")
  .style("display", "none") // initially hide the tooltip
  .style("pointer-events", "none")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("padding", "10px") // space between border and text
  .style("border-radius", "4px")
  .style("font-family", "Lato, sans-serif")
  .style("font-size", "13px")
  .style("white-space", "pre-line") // allow line breaks in the tooltip text
  .style("z-index", "1000"); // ensure the tooltip is on top of other elements

function drawDots(dataset, color) {
  const dots = svg.append("g") // creation of a group for the dots
    .selectAll("circle")
    .data(dataset) // join the dataset to the dots
    .join("circle")

    // set the position and size of the dots based on the data
    .attr("cx", function(d) {
      return x(d.year);
    })
    .attr("cy", function(d) {
      return y(d.usage);
    })

    // set the radius and fill color of the dots
    .attr("r", 2)
    .attr("fill", color);
  
  //mouse hover effect for the dots
  dots
    .on("mouseenter", function(event, d) {
      svg.selectAll("path, circle, text, line") // dim all other elements
        .style("opacity", 0.25); // dim all other elements when a dot is hovered

      d3.select(this) // highlight the hovered dot
        .style("opacity", 1) // make the hovered dot fully visible
        .attr("r", 6) // increase the size of the hovered dot
        .raise(); // bring the hovered dot to the front

      tooltip
        .style("display", "block") // show the tooltip when a dot is hovered
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY + 15) + "px")
        // position the tooltip near the cursor
        .text(
          d.Entity + "\n" +
          "Year: " + d.year + "\n" +
          "Internet Users: " + d.usage.toFixed(1) + "%"
        );
    })

    //mouse move effect for the dots
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.clientX + 15) + "px")
        .style("top", (event.clientY + 15) + "px");
    })
    .on("mouseleave", function() {
      svg.selectAll("path, circle, text, line")
        .style("opacity", null);

      d3.select(this).attr("r", 2);

      tooltip.style("display", "none");
    });
}

drawDots(dataNorthAmerica, palette.NorthAmerica);
drawDots(dataEuropeCentralAsia, palette.EuropeCentralAsia);
drawDots(dataEastAsiaPacific, palette.EastAsiaPacific);
drawDots(dataLatinAmericaCaribbean, palette.LatinAmericaCaribbean);
drawDots(dataWorld, palette.World);
drawDots(dataSouthAsia, palette.SouthAsia);
drawDots(dataMiddleEastNorthAfrica, palette.MiddleEastNorthAfrica);
drawDots(dataSubAfrica, palette.SubAfrica);

//----------Legend----------

function drawLabel(dataset, label, color) {
  // Trova il punto dell'ultimo anno disponibile
  const ultimo = dataset.reduce(function(a, b) {
    return a.year > b.year ? a : b;
  });

  svg.append("text")
    .attr("x", x(ultimo.year) + 12)
    .attr("y", y(ultimo.usage))
    .attr("dy", "0.35em")
    .style("font-family", "Lato, sans-serif")
    .style("font-size", "10px")
    .attr("fill", color)
    .text(label);
}

drawLabel(dataNorthAmerica, "North America (WB)", palette.NorthAmerica);
drawLabel(dataEuropeCentralAsia, "Europe and Central Asia (WB)", palette.EuropeCentralAsia);
drawLabel(dataEastAsiaPacific, "East Asia and Pacific (WB)", palette.EastAsiaPacific);
drawLabel(dataLatinAmericaCaribbean, "Latin America and Caribbean (WB)", palette.LatinAmericaCaribbean);
drawLabel(dataWorld, "World", palette.World);
drawLabel(dataSouthAsia, "South Asia (WB)", palette.SouthAsia);
drawLabel(dataMiddleEastNorthAfrica, "MENA, Afghanistan and Pakistan (WB)", palette.MiddleEastNorthAfrica);
drawLabel(dataSubAfrica, "Sub-Saharan Africa (WB)", palette.SubAfrica);

});