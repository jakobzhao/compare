var leftMap = new maplibregl.Map({
  container: "left",
  style: "data/style.json",
  bounds: [
    [-71.191421, 42.22788], // Southwest corner of Boston metropolitan area
    [-70.748802, 42.707681], // Northeast corner of Boston metropolitan area
  ],
  attributionControl: false,
  minZoom: 7,
});

// the bounds for seattle city is [-122.335167, 47.608013], [-122.224433, 47.734145]

var rightMap = new maplibregl.Map({
  container: "right",
  style: "data/style.json",
  bounds: [
    [-71.191421, 42.22788], // Southwest corner of Boston metropolitan area
    [-70.748802, 42.707681], // Northeast corner of Boston metropolitan area
  ],
  minZoom: 7,
  customAttribution:
    "<a href='#' target='_blank'>Your copyright acknowledgement</a>",
});

// Data Sources
leftMap.on("load", () => {
  // Add a geojson sources.
  leftMap.addSource("pfoa_zipcode", {
    type: "geojson",
    data: "./data/merged_PFOA_ma_zipcodes.geojson",
  });

  leftMap.addSource("pfos_zipcode", {
    type: "geojson",
    data: "./data/merged_PFOS_ma_zipcodes.geojson",
  });

  leftMap.addSource("pfas_above_pnt", {
    type: "geojson",
    data: "./data/sdwis_17MAY2024_above.geojson",
  });

  leftMap.addSource("pfas_below_pnt", {
    type: "geojson",
    data: "./data/sdwis_17MAY2024_below.geojson",
  });

  leftMap.addLayer(
    {
      id: "pfoa_zipcode_layer",
      type: "line",
      source: "pfoa_zipcode",
      paint: {
        "line-opacity": 0.4,
        "line-color": "gray",
      },
    },
    "watername_ocean"
  );

  leftMap.addLayer(
    {
      id: "pfos_zipcode_layer",
      type: "line",
      source: "pfos_zipcode",
      paint: {
        "line-opacity": 0.4,
        "line-color": "gray",
      },
    },
    "watername_ocean"
  );

  leftMap.addLayer({
    id: "pfas_above_pnt_layer",
    type: "circle",
    source: "pfas_above_pnt",
    paint: {
      "circle-radius": 5,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "gray",
      "circle-stroke-opacity": 0.8,
      "circle-opacity": 0.8,
      "circle-color": "red",
    },
  });

  leftMap.addLayer({
    id: "pfas_below_pnt_layer",
    type: "circle",
    source: "pfas_below_pnt",
    paint: {
      "circle-radius": 5,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "gray",
      "circle-stroke-opacity": 0.8,
      "circle-opacity": 0.8,
      "circle-color": "green",
    },
  });

  // Initialize the heatmap layer with the default year
  // addHeatmapLayer(2023, "all", "sum");

  // Initialized heatmap legend
  // heatmap colorscale

  let colorScale = [
    "rgb(33, 102, 172)",
    "rgb(103, 169, 207)",
    "rgb(209, 229, 240)",
    "rgb(253, 219, 199)",
    "rgb(239, 138, 98)",
    "rgb(178, 24, 43)",
  ];

  // outline of city districts
  outlineOptions();

  // add tooltip for cliked feature
  displayAreaInformation();

  // adding popup for cliked point
  displayServicePointInfo();

  // organize layer z-index and which ones go on top of each other
  // leftMap.moveLayer("co_line_layer", "outage_heatmap");
});

// map containing equity matrix and all other data
rightMap.on("load", () => {
  // Add a geojson sources.
  rightMap.addSource("schools", {
    type: "geojson",
    data: "./data/mak12schools.geojson",
  });

  rightMap.addSource("census", {
    type: "geojson",
    data: "./data/ma_census_tract_median_income-merged.geojson",
  });

  rightMap.addLayer({
    id: "schools_layer",
    type: "circle",
    source: "schools",
    paint: {
      "circle-radius": 5,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "gray",
      "circle-stroke-opacity": 0.8,
      "circle-opacity": 0.8,
      "circle-color": "blue",
    },
  });

  rightMap.addLayer(
    {
      id: "census_layer",
      type: "line",
      source: "census",
      paint: {
        "line-opacity": 0.3,
        "line-color": "black",
      },
    },
    "watername_ocean"
  );

  // initiate
  let colorScale = chroma.scale("OrRd").colors(4);
  let legendValues = [10, 9, 6, 1];
  // plotMap("svi20_data", "env_health_disparity_rank", [
  //   [1, colorScale[0]],
  //   [6, colorScale[1]],
  //   [9, colorScale[2]],
  //   [10, colorScale[3]],
  // ]);
  updateLegendValues(legendValues, colorScale);
  // justiceOptions();
});

rightMap.on("click", "options_layer", (e) => {
  // highlight layer
  addOutline(rightMap, e.features[0].geometry);
  addOutline(leftMap, e.features[0].geometry);
  // enable tooltips
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  const tooltipList = [...tooltipTriggerList].map(
    (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
  );

  let featureData = e.features[0].properties;
  populateTractInformation(featureData);
});

rightMap.on("mousemove", "options_layer", (e) => {
  rightMap.getCanvas().style.cursor = "pointer";
});

rightMap.on("mouseleave", "options_layer", (e) => {
  rightMap.getCanvas().style.cursor = "";
});

leftMap.on("mousemove", "outage_point", (e) => {
  leftMap.getCanvas().style.cursor = "pointer";
});

leftMap.on("mouseleave", "outage_point", (e) => {
  leftMap.getCanvas().style.cursor = "";
});

function plotMap(source, property, breaks) {
  if (!(source in rightMap.style.sourceCaches)) {
    console.log("Could not find proper source.");
  }
  if (rightMap.getLayer("options_layer")) {
    rightMap.removeLayer("options_layer");
  }

  // Add following layer with indicated source & property
  rightMap.addLayer(
    {
      id: "options_layer",
      type: "fill",
      source: source,
      paint: {
        "fill-color": {
          property: property,
          stops: breaks,
          default: "gray",
        },
        "fill-opacity": [
          "case",
          ["!=", ["get", property], null], // If property is not null
          0.4, // Use the default fill-opacity
          0.7, // If property is null, use a different fill-opacity
        ],
      },
    },
    "watername_ocean"
  );
}

function leftMapPlotLine(source) {
  let fill_paint = null;
  let line_paint = null;
  if (!(source in leftMap.style.sourceCaches)) {
    console.log("Could not find proper source.");
  }
  if (leftMap.getLayer("co_line_layer")) {
    leftMap.removeLayer("co_line_layer");
  }

  if (leftMap.getLayer("co_fill")) {
    leftMap.removeLayer("co_fill");
  }
  if (source === "wireless_priority_area") {
    fill_paint = {
      "fill-color": "#F79489",
      "fill-opacity": 0.3,
    };
    line_paint = {
      "line-color": "#F79489",
      "line-width": 1,
    };
  } else if (source === "landuse") {
    fill_paint = {
      "fill-opacity": 0.7,
      "fill-color": [
        "match",
        ["get", "CLASS_DESC"],
        "Multi-Family",
        "#B1C381",
        "Neighborhood Residential",
        "#B1C381",
        "Master Planned Community",
        "#B1C381",
        "Manufacturing/Industrial",
        "#F79489", //  "#9BB8CD",
        "Commercial/Mixed Use",
        "#F79489",
        "Industrial and Maritime",
        "#F79489",
        "Seattle Mixed",
        "#EEC759",
        "Downtown",
        "#EEC759",
        "Multi-Family/Residential-Commercial",
        "#EEC759",
        "Major Institutions",
        "#ffffff",
        "#ffffff", // Default color for unmatched values
      ],
    };
    line_paint = {
      "line-color": "darkgray",
      "line-width": 1,
      "line-opacity": 0.2,
    };
  } else {
    fill_paint = {
      "fill-color": "darkgray",
      "fill-opacity": 0.2,
    };

    line_paint = {
      "line-color": "darkgray",
      "line-width": 1.2,
    };
  }

  leftMap.addLayer(
    {
      id: "co_fill",
      type: "fill",
      source: source,
      paint: fill_paint,
    },
    "outage_heatmap"
  );

  leftMap.addLayer(
    {
      id: "co_line_layer",
      type: "line",
      source: source,
      paint: line_paint,
    },
    "outage_heatmap"
  );
}

function leftMapPlotPoint(source) {
  if (!(source in leftMap.style.sourceCaches)) {
    console.log("Could not find proper source.");
  }
  if (leftMap.getLayer("co_line_layer")) {
    leftMap.removeLayer("co_line_layer");
  }

  if (leftMap.getLayer("co_fill")) {
    leftMap.removeLayer("co_fill");
  }

  let statusColorScale = {
    Completed: "#91cf60",
    "High Priority": "#d73027",
    "Medium Priority": "#fc8d59",
    "Low Priority": "#fee08b",
  };

  leftMap.addLayer({
    id: "co_line_layer",
    type: "circle",
    source: source,
    paint: {
      "circle-radius": 5,
      "circle-stroke-width": 0.5,
      "circle-stroke-color": "gray",
      "circle-stroke-opacity": 0.8,
      "circle-opacity": 0.8,

      "circle-color": [
        "match",
        ["get", "Status"],
        "Completed",
        statusColorScale["Completed"],
        "High",
        statusColorScale["High Priority"],
        "Medium",
        statusColorScale["Medium Priority"],
        "N/A",
        statusColorScale["Low Priority"],
        "#ffffff", // Default color for unmatched values
      ],
    },
  });
}

function updateLegendValues(rangeArray, gradientColors) {
  let length = rangeArray.length;
  let colorsDiv = document.createElement("div");
  colorsDiv.id = "legend-color-bar";
  colorsDiv.classList.add("row", "colors", "ms-3");
  colorsDiv.style.background = `linear-gradient(to right, ${gradientColors.join(
    ", "
  )})`;
  let labelsDiv = document.createElement("div");
  labelsDiv.id = "label-equity-matrix";
  labelsDiv.classList.add("labels", "ms-1");
  gradientColors.forEach((color, index) => {
    let labelDiv = document.createElement("div");
    labelDiv.classList.add("label");
    labelDiv.textContent = rangeArray[length - index - 1];
    labelsDiv.appendChild(labelDiv);
  });

  // Insert the color legend below the selected radio button
  let selectedRadioButton = document.querySelector(
    'input[name="population_category"]:checked'
  );
  selectedRadioButton.parentNode.appendChild(colorsDiv);
  selectedRadioButton.parentNode.appendChild(labelsDiv);
}

function addOutageTypeLegend(gradientColors, type) {
  let legend = document.createElement("div");
  legend.id = "outage-legend";
  legend.classList.add("row", "colors", "ms-3");
  legend.style.background = `linear-gradient(to right, ${gradientColors.join(
    ", "
  )})`;

  // Add text labels below the color bar
  let legendLabels = document.createElement("div");
  legendLabels.id = "outage-type-label";
  legendLabels.classList.add("d-flex", "justify-content-between");

  let lowLabel = document.createElement("div");
  lowLabel.textContent = type == "frequency" ? "Less" : "Shorter";
  legendLabels.appendChild(lowLabel);

  let highLabel = document.createElement("div");
  highLabel.textContent = type == "frequency" ? "More" : "Longer";
  legendLabels.appendChild(highLabel);

  legend.appendChild(legendLabels);

  // insert legend below the selected radio button
  let selectedRadioButton = document.querySelector(
    'input[name="outage_type"]:checked'
  );
  let label = document.querySelector(
    'label[for="' + selectedRadioButton.id + '"]'
  );
  label.parentNode.insertBefore(legend, label.nextSibling);
}

// Function to remove color legend
function removeColorLegend() {
  let existingColorLegend = document.getElementById("legend-color-bar");
  let existingLabelLegend = document.getElementById("label-equity-matrix");
  if (existingColorLegend) existingColorLegend.remove();
  if (existingLabelLegend) existingLabelLegend.remove();
}

function outlineOptions() {
  let radioButtons = document.getElementsByName("city_outlines");
  radioButtons.forEach(function (radioButton) {
    radioButton.addEventListener("change", function () {
      let selectedProperty = this.value;
      if (selectedProperty == "cc") {
        leftMapPlotLine("cc_districts");
      } else if (selectedProperty == "nh") {
        leftMapPlotLine("neighborhoods_outline");
      } else if (selectedProperty == "ct") {
        leftMapPlotLine("censusTract");
      } else if (selectedProperty == "wpa") {
        leftMapPlotLine("wireless_priority_area");
      } else if (selectedProperty == "uas") {
        leftMapPlotPoint("ua_status");
      } else if (selectedProperty == "lu") {
        leftMapPlotLine("landuse");
      }
    });
  });
}

// Synchronize map movements from map1 to map2
rightMap.on("moveend", function () {
  var center1 = rightMap.getCenter();
  var zoom1 = rightMap.getZoom();
  var bearing1 = rightMap.getBearing();
  var pitch1 = rightMap.getPitch();

  try {
    leftMap.jumpTo({
      center: center1,
      zoom: zoom1,
      bearing: bearing1,
      pitch: pitch1,
    });
  } catch (error) {}
});

// Synchronize map movements from map2 to map1
leftMap.on("moveend", function () {
  var center2 = leftMap.getCenter();
  var zoom2 = leftMap.getZoom();
  var bearing2 = leftMap.getBearing();
  var pitch2 = leftMap.getPitch();

  try {
    rightMap.jumpTo({
      center: center2,
      zoom: zoom2,
      bearing: bearing2,
      pitch: pitch2,
    });
  } catch (error) {}
});

leftMap.once("data", (e) => {
  if (e.sourceId === "outage_loc" && e.isSourceLoaded) {
    $("#loader").fadeOut("slow");
  }
});

// slider bar change on slide
function updateYearLabel() {
  let yearLabel = document.getElementById("yearLabel");
  let yearSlider = document.getElementById("yearSlider");
  yearLabel.innerHTML = yearSlider.value;
}

// function add heatmap layer
function addHeatmapLayer(year, month, outage_type) {
  let data_path = "data/outage_condensed_" + year + ".geojson";
  let heatmap_ramp = null,
    heatmap_weight = null,
    min_zoom = null,
    max_zoom = null,
    circle_colors = null,
    heatmap_intensify = null;
  if (month != "all") {
    data_path =
      "data/year_month_data/outage_condensed_" +
      year +
      "_" +
      month +
      ".geojson";
  }

  // data loading bar
  if (!leftMap.getSource("outage_loc")) {
    $("#loader").show();

    leftMap.addSource("outage_loc", {
      type: "geojson",
      data: data_path,
    });

    leftMap.on("data", (e) => {
      // $("#loader").show();
      if (e.sourceId == "outage_loc" && e.isSourceLoaded) {
        // $("#loader").show();
        $("#loader").fadeOut("slow");
        // $("#loader").hide();
      }
    });
  }

  // $("#loader").show();

  if (outage_type == "sum") {
    heatmap_ramp = [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(33,102,172,0)",
      0.2,
      "rgb(103,169,207)",
      0.4,
      "rgb(209,229,240)",
      0.6,
      "rgb(253,219,199)",
      0.8,
      "rgb(239,138,98)",
      1,
      "rgb(178,24,43)",
    ];

    heatmap_weight = [
      "interpolate",
      ["linear"],
      ["get", outage_type],
      0,
      0,
      100,
      1,
    ];

    heatmap_intensify = {
      stops: [
        [11, 1.5],
        [12, 1.5],
        [13, 1],
        [15, 0.8],
        [25, 0.75],
      ],
    };
    min_zoom = ["interpolate", ["linear"], ["get", outage_type], 1, 1, 6, 3];
    max_zoom = ["interpolate", ["linear"], ["get", outage_type], 1, 5, 6, 15];

    circle_colors = [
      "interpolate",
      ["linear"],
      ["get", outage_type],
      0,
      "rgba(33,102,172,0)",
      3,
      "rgb(103,169,207)",
      5,
      "rgb(209,229,240)",
      10,
      "rgb(253,219,199)",
      15,
      "rgb(239,138,98)",
      200,
      "rgb(178,24,43)",
    ];
  } else {
    //color can be found from https://colorbrewer2.org/#type=diverging&scheme=PRGn&n=6
    heatmap_ramp = [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(255,255,255,0)",
      0.2,
      "#ffffb2",
      0.4,
      "#fecc5c",
      0.6,
      "#fd8d3c",
      0.8,
      "#f03b20",
      1,
      "#bd0026",
    ];

    circle_colors = [
      "interpolate",
      ["linear"],
      ["get", outage_type],
      0,
      "rgba(255, 255, 255, 0)",
      200,
      "#ffffb2",
      500,
      "#fecc5c",
      1000,
      "#fd8d3c",
      2000,
      "#f03b20",
      3000,
      "#bd0026",
    ];

    heatmap_weight = [
      "interpolate",
      ["linear"],
      ["get", outage_type],
      0,
      0,
      2000,
      0.5,
      3000,
      1,
    ];

    // heatmap_intensify = {
    //   stops: [
    //     [11, 0.2],
    //     [13, 0.5],
    //     [18, 1],
    //   ],
    // };

    heatmap_intensify = {
      stops: [
        [11, 0.1],
        [12, 0.1],
        [13, 0.3],
        [15, 0.7],
        [25, 0.9],
      ],
    };

    min_zoom = [
      "interpolate",
      ["linear"],
      ["get", outage_type],
      1,
      1,
      1000,
      2,
      3000,
      3,
    ];
    max_zoom = [
      "interpolate",
      ["linear"],
      ["get", outage_type],
      1,
      5,
      1000,
      8,
      3000,
      15,
    ];
  }

  // get radio button value to decide if frequency or duration
  leftMap.addLayer(
    {
      id: "outage_point",
      type: "circle",
      source: "outage_loc",
      minzoom: 14,
      paint: {
        // Size circle radius by earthquake magnitude and zoom level
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["zoom"],
          13,
          min_zoom,
          20,
          max_zoom,
        ],
        "circle-color": circle_colors,
        "circle-stroke-color": "darkgray",
        "circle-stroke-width": 1,
        "circle-stroke-opacity": 1,
        // Transition from heatmap to circle layer by zoom level
        "circle-opacity": {
          stops: [
            [14, 0],
            [18, 1],
          ],
        },
      },
      filter: ["!=", ["get", "time_of_day"], ""],
    },
    "watername_ocean"
  );

  leftMap.addLayer(
    {
      id: "outage_heatmap",
      type: "heatmap",
      source: "outage_loc",
      maxzoom: 21,
      paint: {
        // Increase the heatmap weight based on frequency and property magnitude
        "heatmap-weight": heatmap_weight,
        // Increase the heatmap color weight weight by zoom level
        // heatmap-intensity is a multiplier on top of heatmap-weight
        "heatmap-intensity": heatmap_intensify,
        // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
        // Begin color ramp at 0-stop with a 0-transparancy color
        // to create a blur-like effect.
        "heatmap-color": heatmap_ramp,
        // Adjust the heatmap radius by zoom level
        "heatmap-radius": {
          stops: [
            [7, 1],
            [9, 5],
            [11, 8],
            [13, 30],
            [14, 50],
            [15, 100],
            [16, 130],
            [17, 180],
            [18, 250],
          ],
        },
        // Transition from heatmap to circle layer by zoom level
        "heatmap-opacity": {
          default: 1,
          stops: [
            [9, 0.9],
            [12, 0.7],
            [15, 0.6],
            [18, 0],
          ],
        },
      },
      filter: ["!=", ["get", "time_of_day"], ""],
    },
    "outage_point"
  );
}

// Function to update the heatmap layer
function updateHeatmapLayer(year, month, value) {
  let selectedYear = parseInt(year, 10);
  if (month != "all") {
    month = parseInt(month, 10);
  }
  // Remove the existing heatmap layer and source
  if (leftMap.getLayer("outage_heatmap")) {
    leftMap.removeLayer("outage_heatmap");
  }

  if (leftMap.getLayer("outage_point")) {
    leftMap.removeLayer("outage_point");
  }

  if (leftMap.getSource("outage_loc")) {
    leftMap.removeSource("outage_loc");
  }

  addHeatmapLayer(selectedYear, month, value);
}

// display area information for before map
// function displayAreaInformation() {
//   leftMap.on("click", "svi_data", (e) => {
//     let featureData = e.features[0].properties;
//     addOutline(leftMap, e.features[0].geometry);
//     addOutline(rightMap, e.features[0].geometry);
//     // show tract information
//     populateTractInformation(featureData);
//   });
// }

function displayAreaInformation() {
  leftMap.on("click", (e) => {
    // Check if the clicked feature is a service point
    const features = leftMap.queryRenderedFeatures(e.point, {
      layers: ["outage_point"],
    });
    if (features.length > 0) {
      // If it's a service point, stop further event handling
      return;
    }

    // Handle click event for svi_data layer
    const sviFeatures = leftMap.queryRenderedFeatures(e.point, {
      layers: ["svi_data"],
    });
    if (sviFeatures.length > 0) {
      let featureData = sviFeatures[0].properties;
      addOutline(leftMap, sviFeatures[0].geometry);
      addOutline(rightMap, sviFeatures[0].geometry);
      // Show tract information
      populateTractInformation(featureData);
    }
  });
}

function updateFilter() {
  // get selected time of day
  // get selected causation
  let timeOfDay = document.getElementById("time_of_day").value;
  let causationIndex = 0;

  let causations = document.querySelectorAll(".dropdown-item");
  let buttonText = document.getElementById("causationButton").innerHTML;
  causations.forEach(function (causation) {
    let selectedIndex = parseInt(causation.getAttribute("data-index"));
    if (buttonText == causation.innerHTML) {
      causationIndex = selectedIndex;
    }
  });

  let timeOfDayFilter = ["==", ["get", "time_of_day"], timeOfDay];
  if (timeOfDay == "all") {
    timeOfDayFilter = ["!=", ["get", "time_of_day"], timeOfDay];
  }
  console.log(timeOfDayFilter);

  let causationFilter;
  if (causationIndex == 1) {
    causationFilter = ["!=", ["at", 0, ["array", ["get", "causation"]]], "1"];
  } else {
    causationFilter = [
      "==",
      ["at", causationIndex - 2, ["array", ["get", "causation"]]],
      "1",
    ];
  }

  // update map filter
  filter = ["all", timeOfDayFilter, causationFilter];

  leftMap.setFilter("outage_heatmap", filter);
  leftMap.setFilter("outage_point", filter);
}

function displayServicePointInfo() {
  leftMap.on("click", "outage_point", (e) => {
    // dropdownValues is the lookup table in misc.js
    let causationString = e.features[0].properties.causation;
    let causationIndex = JSON.parse(causationString.replace(/"/g, ""));
    let causation_desc = "";
    let causation_count = 0;
    const causationCount = causationIndex
      .reduce((result, value, i) => {
        if (value !== 0) {
          result.push(`${dropdownValues[i + 1]} (${value})`);
          causation_desc = dropdownValues[i + 1];
          causation_count += value;
        }
        return result;
      }, [])
      .join(", ");

    console.log(causationCount);
    let bbox = [
      [e.point.x - 20, e.point.y - 20],
      [e.point.x + 20, e.point.y + 20],
    ];
    const coordinates = e.features[0].geometry.coordinates.slice();
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    let duration = e.features[0].properties.duration;
    let timeOfDay = e.features[0].properties.time_of_day;
    let description = `<p style="font-size:small"><strong>Causation:</strong> ${causationCount}<br>
          <strong>Frequency:</strong> ${causation_count}  <i>times</i> <br>
          <strong>Time of Day:</strong> ${timeOfDay} <br>
          <strong>Duration: </strong>${duration.toLocaleString()} <i>secs</i></p>
          <hr>
          <p style="font-size:small; font-style: italic; color:gray"> <strong>Causation</strong>, identified by the SCL operator, shows why each power outage occurred with the indicated frequencies in parantheses. <strong>Frequency</strong> counts the total outages at this location. <strong>Time of day</strong> notes when they happened. <strong>Duration</strong> sums up the total resolution time for all outages here, indicating the cumulative outage duration in the selected period</p>`;
    new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(description)
      .setMaxWidth("350px")
      .addTo(leftMap);
  });

  leftMap.on("mouseenter", "outage_point", () => {
    leftMap.getCanvas().style.cursor = "pointer";
  });
  // Change it back to a pointer when it leaves.
  leftMap.on("mouseleave", "outage_point", () => {
    leftMap.getCanvas().style.cursor = "";
  });
}

function outageType(radioButtons) {
  for (let i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      return radioButtons[i].value;
    }
  }
  return null;
}

function addOutline(map, geometry) {
  if (map.getLayer("highlighted_layer")) {
    map.removeLayer("highlighted_layer");
  }

  // Remove outline from previously highlighted features
  if (map.getSource("highlighted_source")) {
    map.removeSource("highlighted_source");
  }

  map.addSource("highlighted_source", {
    type: "geojson",
    data: {
      type: "Feature",
      geometry: geometry,
    },
  });

  map.addLayer({
    id: "highlighted_layer",
    type: "line",
    source: "highlighted_source",
    paint: {
      "line-color": "yellow", //#00dfff
      "line-width": 3,
      // 'line-opacity': 0.75
    },
  });
}

function clearHighlight() {
  // Check if the highlighted layer exists and remove it
  if (leftMap.getLayer("highlighted_layer")) {
    leftMap.removeLayer("highlighted_layer");
  }
  // Check if the highlighted source exists and remove it
  if (leftMap.getSource("highlighted_source")) {
    leftMap.removeSource("highlighted_source");
  }

  // Check if the highlighted layer exists and remove it
  if (rightMap.getLayer("highlighted_layer")) {
    rightMap.removeLayer("highlighted_layer");
  }
  // Check if the highlighted source exists and remove it
  if (rightMap.getSource("highlighted_source")) {
    rightMap.removeSource("highlighted_source");
  }
}

leftMap.on("click", (e) => {
  // Query the map for features at the clicked point across all layers
  var features = leftMap.queryRenderedFeatures(e.point);

  // If no features are found, clear the highlight and return
  if (features[0].source === "carto") {
    clearHighlight();
    return;
  }
});

rightMap.on("click", (e) => {
  // Query the map for features at the clicked point across all layers
  var features = rightMap.queryRenderedFeatures(e.point);

  // If no features are found, clear the highlight and return
  // if (!features.length) {
  //   clearHighlight();
  //   return;
  // }
  if (features[0].source === "carto") {
    clearHighlight();
    return;
  }
});

function populateTractInformation(featureData) {
  // populate information in div
  document.getElementById("c-tract-name").textContent = featureData["NAMELSAD"];
  document.getElementById("population").textContent =
    featureData["Total.population"].toLocaleString();
  document.getElementById("life-expectancy").textContent =
    featureData["Life.expectancy..years."];
  document.getElementById("households").textContent =
    featureData["Households"].toLocaleString();

  // Update progress bar also [need to optimize]
  document.getElementById("a-native-indian").style.width =
    featureData["Percent.American.Indian...Alaska.Native"] * 100 + "%";
  document.getElementById("a-native-indian").title =
    "American Indian/Alaska Native:" +
    featureData["Percent.American.Indian...Alaska.Native"] * 100 +
    "%";
  document.getElementById("a-asian").style.width =
    featureData["Percent.Asian"] * 100 + "%";
  document.getElementById("a-asian").title =
    "Asian: " + featureData["Percent.Asian"] * 100 + "%";
  document.getElementById("a-black").style.width =
    featureData["Percent.Black.or.African.American.alone"] * 100 + "%";
  document.getElementById("a-black").title =
    "Black/African American: " +
    featureData["Percent.Black.or.African.American.alone"] * 100 +
    "%";
  document.getElementById("a-latino").style.width =
    featureData["Percent.Hispanic.or.Latino"] * 100 + "%";
  document.getElementById("a-latino").title =
    "Hispanic or Latino: " +
    featureData["Percent.Hispanic.or.Latino"] * 100 +
    "%";
  document.getElementById("a-native-pacific").style.width =
    featureData["Percent.Native.Hawaiian.or.Pacific"] * 100 + "%";
  document.getElementById("a-native-pacific").title =
    "Native Hawaiian/Pacific Islander: " +
    featureData["Percent.Native.Hawaiian.or.Pacific"] * 100 +
    "%";
  document.getElementById("a-white").style.width =
    featureData["Percent.White"] * 100 + "%";
  document.getElementById("a-white").title =
    "White: " + featureData["Percent.White"] * 100 + "%";
  document.getElementById("a-other").style.width =
    featureData["Percent.other.races"] * 100 + "%";
  document.getElementById("a-other").title =
    "Other: " + featureData["Percent.other.races"] * 100 + "%";
}
