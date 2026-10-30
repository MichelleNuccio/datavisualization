// 1. Find the page elements
const canvas = document.getElementById("hilbert-map");
const context = canvas.getContext("2d");
const mapStatus = document.getElementById("map-status");
const cellDetails = document.getElementById("cell-details");
const registryFilter = document.getElementById("registry-filter");

// 2. Locate the datasets relative to hilbert.html
const dataFolder = "./Assignment%2005/data/";

const files = [
  "delegated-afrinic-latest",
  "delegated-apnic-latest",
  "delegated-arin-extended-latest",
  "delegated-lacnic-latest",
  "delegated-ripencc-latest"
];

// 3. Define the registry colors and readable names
const colors = {
  afrinic: "#ffff00",
  apnic: "#0000ff",
  arin: "#00ffff",
  lacnic: "#00ff00",
  ripencc: "#ff00ff"
};

const registryNames = {
  afrinic: "AFRINIC",
  apnic: "APNIC",
  arin: "ARIN",
  lacnic: "LACNIC",
  ripencc: "RIPE NCC"
};

// 4. Define the logical grid and drawing resolution
const size = 256;
const cellPixels = 4;
const addressesPerCell = 65536;

canvas.width = size * cellPixels;
canvas.height = size * cellPixels;

// 5. Prepare shared data and formatting
const registries = Object.keys(colors);
const numberFormat = new Intl.NumberFormat("en-US");

let records = [];
let cells = [];
let cellAtPosition = [];
let ready = false;

// 6. Update the interface text to describe the filter accurately
document.querySelector('label[for="registry-filter"]').textContent =
  "Filter by registry";

const mapDescription = document.getElementById("map-description");

mapDescription.textContent =
  "256 × 256 cells · 65,536 addresses per /16 cell. " +
  "Position follows numerical address order, not geography. " +
  "All registries: color indicates the dominant registry. " +
  "Filtered view: colored cells contain addresses from the selected " +
  "registry, which may occupy only part of a cell. " +
  "Black cells are not necessarily unused space.";

// 7. Convert an IPv4 address into a number
function ipToNumber(ip) {
  const parts = ip.split(".").map(Number);

  // Validate the four address octets
  if (
    parts.length !== 4 ||
    parts.some(part =>
      !Number.isInteger(part) || part < 0 || part > 255
    )
  ) {
    throw new Error(`Invalid IPv4 address: ${ip}`);
  }

  return (
    parts[0] * 256 ** 3 +
    parts[1] * 256 ** 2 +
    parts[2] * 256 +
    parts[3]
  );
}

// 8. Convert a number into a readable IPv4 address
function numberToIp(number) {
  return [
    Math.floor(number / 256 ** 3),
    Math.floor(number / 256 ** 2) % 256,
    Math.floor(number / 256) % 256,
    number % 256
  ].join(".");
}

// 9. Read allocated or assigned IPv4 records from a file
function parseFile(text) {
  const parsedRecords = [];
  const lines = text.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip empty lines and comments
    if (line === "" || line.startsWith("#")) {
      continue;
    }

    const fields = line.split("|");

    // Skip headers, summaries, IPv6 records, and ASN records
    if (
      fields.length < 7 ||
      fields[2] !== "ipv4" ||
      fields[3] === "*"
    ) {
      continue;
    }

    // Exclude reserved records
    const status = fields[6];

    if (status !== "allocated" && status !== "assigned") {
      continue;
    }

    const registry = fields[0];
    const start = ipToNumber(fields[3]);
    const count = Number(fields[4]);

    // Validate the registry, block size, and address boundaries
    if (
      !registries.includes(registry) ||
      !Number.isInteger(count) ||
      count <= 0 ||
      start + count > 2 ** 32
    ) {
      throw new Error(`Invalid IPv4 record: ${line}`);
    }

    // Store each record with readable property names
    parsedRecords.push({
      registry: registry,
      country: fields[1],
      start: start,
      end: start + count - 1,
      count: count,
      date: fields[5],
      status: status
    });
  }

  return parsedRecords;
}

// 10. Prevent the same address from being counted more than once
function checkOverlaps() {
  const sortedRecords = [...records].sort(
    (a, b) => a.start - b.start
  );

  let previousEnd = -1;

  for (const record of sortedRecords) {
    if (record.start <= previousEnd) {
      throw new Error(
        `Overlapping records near ${numberToIp(record.start)}`
      );
    }

    previousEnd = record.end;
  }
}

// 11. Convert an address-space index into Hilbert coordinates
function hilbertPosition(index) {
  let x = 0;
  let y = 0;
  let remaining = index;

  // Build the position through increasingly large squares
  for (let scale = 1; scale < size; scale *= 2) {
    const rx = Math.floor(remaining / 2) % 2;
    const ry = (remaining % 2) ^ rx;

    // Rotate or reflect the square to connect the curve
    if (ry === 0) {
      if (rx === 1) {
        x = scale - 1 - x;
        y = scale - 1 - y;
      }

      const previousX = x;
      x = y;
      y = previousX;
    }

    // Move into the appropriate quadrant
    x += scale * rx;
    y += scale * ry;
    remaining = Math.floor(remaining / 4);
  }

  return { x, y };
}

// 12. Create cells and aggregate the address counts
function buildCells() {
  cells = [];
  cellAtPosition = new Array(size * size);

  // Create one cell for each /16 block
  for (let index = 0; index < size * size; index++) {
    const position = hilbertPosition(index);
    const counts = {};

    for (const registry of registries) {
      counts[registry] = 0;
    }

    cells.push({
      index: index,
      x: position.x,
      y: position.y,
      counts: counts,
      total: 0,
      dominantRegistry: null
    });

    // Link screen positions to address-space indices
    cellAtPosition[position.y * size + position.x] = index;
  }

  // Split each record across the cells it intersects
  for (const record of records) {
    const firstCell = Math.floor(record.start / addressesPerCell);
    const lastCell = Math.floor(record.end / addressesPerCell);

    for (let index = firstCell; index <= lastCell; index++) {
      const cellStart = index * addressesPerCell;
      const cellEnd = cellStart + addressesPerCell - 1;

      // Count only the addresses inside the current cell
      const overlapStart = Math.max(record.start, cellStart);
      const overlapEnd = Math.min(record.end, cellEnd);
      const count = overlapEnd - overlapStart + 1;

      cells[index].counts[record.registry] += count;
      cells[index].total += count;
    }
  }

  // Find the dominant registry for the unfiltered view
  // Ties follow the registry order used in the legend
  for (const cell of cells) {
    let largestCount = 0;

    for (const registry of registries) {
      if (cell.counts[registry] > largestCount) {
        largestCount = cell.counts[registry];
        cell.dominantRegistry = registry;
      }
    }
  }
}

// 13. Check whether a cell belongs in the current view
function isCellVisible(cell) {
  const selectedRegistry = registryFilter.value;

  if (selectedRegistry === "all") {
    return cell.total > 0;
  }

  return cell.counts[selectedRegistry] > 0;
}

// 14. Draw all registries or only the selected registry
function drawMap() {
  const selectedRegistry = registryFilter.value;

  // Paint the complete drawing surface black
  context.globalAlpha = 1;
  context.fillStyle = "#000000";
  context.fillRect(0, 0, canvas.width, canvas.height);

  let visibleCount = 0;

  for (const cell of cells) {
    // Leave excluded cells black
    if (!isCellVisible(cell)) {
      continue;
    }

    visibleCount += 1;

    // Use the selected registry's color in the filtered view
    const registry = selectedRegistry === "all"
      ? cell.dominantRegistry
      : selectedRegistry;

    context.fillStyle = colors[registry];

    // Fill each cell while leaving thin black borders
    context.fillRect(
      cell.x * cellPixels + 0.5,
      cell.y * cellPixels + 0.5,
      cellPixels - 1,
      cellPixels - 1
    );
  }

  // Describe what the current view shows
  if (selectedRegistry === "all") {
    mapStatus.textContent =
      `${numberFormat.format(records.length)} IPv4 records mapped. ` +
      `${numberFormat.format(visibleCount)} /16 cells contain records.`;
  } else {
    mapStatus.textContent =
      `${numberFormat.format(visibleCount)} /16 cells contain ` +
      `${registryNames[selectedRegistry]} addresses.`;
  }
}

// 15. Show the inspected cell's range and address counts
function showCellDetails(cell) {
  const selectedRegistry = registryFilter.value;
  const start = cell.index * addressesPerCell;
  const end = start + addressesPerCell - 1;

  const lines = [
    `Block: ${numberToIp(start)}/16`,
    `From: ${numberToIp(start)}`,
    `To: ${numberToIp(end)}`
  ];

  // Show the selected registry's exact contribution
  if (selectedRegistry !== "all") {
    const count = cell.counts[selectedRegistry];
    const percentage = count / addressesPerCell * 100;

    lines.push(
      "",
      `Selected: ${registryNames[selectedRegistry]}`,
      `Addresses: ${numberFormat.format(count)}`,
      `Share of /16 cell: ${percentage.toFixed(2)}%`
    );
  }

  // Show total coverage across all registries
  const coverage = cell.total / addressesPerCell * 100;

  lines.push(
    "",
    `Total registered: ${numberFormat.format(cell.total)}`,
    `Total cell coverage: ${coverage.toFixed(2)}%`,
    "",
    "Addresses by registry:"
  );

  // Preserve all contributions so mixed cells remain understandable
  for (const registry of registries) {
    lines.push(
      `${registryNames[registry]}: ` +
      numberFormat.format(cell.counts[registry])
    );
  }

  // Identify the numerical sequence endpoints
  if (cell.index === 0) {
    lines.push("", "Start of the IPv4 address sequence.");
  }

  if (cell.index === size * size - 1) {
    lines.push("", "End of the IPv4 address sequence.");
  }

  cellDetails.textContent = lines.join("\n");
}

// 16. Find the cell under the pointer
function inspectCell(event) {
  if (!ready) return;

  const bounds = canvas.getBoundingClientRect();
  const style = getComputedStyle(canvas);

  // Remove the canvas borders from the displayed dimensions
  const leftBorder = parseFloat(style.borderLeftWidth) || 0;
  const rightBorder = parseFloat(style.borderRightWidth) || 0;
  const topBorder = parseFloat(style.borderTopWidth) || 0;
  const bottomBorder = parseFloat(style.borderBottomWidth) || 0;

  const displayWidth = bounds.width - leftBorder - rightBorder;
  const displayHeight = bounds.height - topBorder - bottomBorder;

  if (displayWidth <= 0 || displayHeight <= 0) return;

  // Convert pointer coordinates into logical grid coordinates
  const localX = event.clientX - bounds.left - leftBorder;
  const localY = event.clientY - bounds.top - topBorder;

  const x = Math.floor(localX / displayWidth * size);
  const y = Math.floor(localY / displayHeight * size);

  if (x < 0 || x >= size || y < 0 || y >= size) {
    return;
  }

  const index = cellAtPosition[y * size + x];
  const cell = cells[index];

  // Do not show registry details for hidden cells
  if (!isCellVisible(cell)) {
    cellDetails.textContent = registryFilter.value === "all"
      ? "No allocated or assigned records in this cell."
      : "No addresses from the selected registry in this cell.";

    return;
  }

  showCellDetails(cell);
}

// 17. Support hovering and tapping
canvas.addEventListener("pointermove", inspectCell);
canvas.addEventListener("click", inspectCell);

// 18. Redraw and reset the details when the filter changes
registryFilter.addEventListener("change", () => {
  if (!ready) return;

  drawMap();

  cellDetails.textContent =
    "Hover over or tap a colored cell to inspect it.";
});

// 19. Load and validate the datasets before drawing
async function loadData() {
  records = [];
  ready = false;
  registryFilter.disabled = true;
  mapStatus.textContent = "Loading IPv4 records…";

  try {
    // Load one dataset at a time from Assignment 05/data
    for (const file of files) {
      const response = await fetch(`${dataFolder}${file}`);

      if (!response.ok) {
        throw new Error(`${file}: HTTP ${response.status}`);
      }

      const text = await response.text();
      const fileRecords = parseFile(text);

      for (const record of fileRecords) {
        records.push(record);
      }
    }

    // Stop if no qualifying records were found
    if (records.length === 0) {
      throw new Error("No allocated or assigned IPv4 records found");
    }

    // Prevent double counting before aggregating the records
    checkOverlaps();
    buildCells();
    drawMap();

    // Enable interaction after the map is ready
    ready = true;
    registryFilter.disabled = false;

    cellDetails.textContent =
      "Hover over or tap a colored cell to inspect it.";

  } catch (error) {
    // Clear the full canvas if loading or validation fails
    context.clearRect(0, 0, canvas.width, canvas.height);
    ready = false;
    registryFilter.disabled = true;

    mapStatus.textContent =
      `Unable to build the map: ${error.message}.`;

    console.error(error);
  }
}

// 20. Start the visualization
loadData();