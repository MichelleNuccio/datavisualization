# Mapping IPv4 allocations with a Hilbert curve

## Step 1 — Dataset and scope

This project explores the distribution of registered IPv4 address blocks in numerical address space. It does not measure active hosts, users, devices, or traffic.

The visualization will use the five Regional Internet Registries (RIRs). IPv6 and autonomous system number records are outside the scope of this chart.

## Step 2 — Dataset documentation

**Dataset name:** RIR Delegated Statistics, with the extended format for ARIN.

**Producers:** AFRINIC, APNIC, ARIN, LACNIC, and RIPE NCC. These organizations administer Internet number resources in their respective service regions.

**Original purpose:** reporting the allocation and assignment of Internet number resources. These are administrative records, rather than measurements of Internet activity.

**Local inspection date:** October 16, 2026. The original download date has not yet been confirmed; the inspection date must not be presented as the download date.

**Format:** UTF-8/plain-text files with pipe-separated fields (`|`). The files also include headers, summary lines, and sometimes comments.

| Registry | Source URL | Snapshot date in file header | Resource records | IPv4 block records | Fields per resource record |
|---|---|---|---:|---:|---:|
| AFRINIC | https://ftp.afrinic.net/pub/stats/afrinic/delegated-afrinic-latest | 2026-10-09 | 10,015 | 5,531 | 7 |
| APNIC | https://ftp.apnic.net/stats/apnic/delegated-apnic-latest | 2026-10-10 | 89,457 | 58,265 | 7 |
| ARIN | https://ftp.arin.net/pub/stats/arin/delegated-arin-extended-latest | 2026-10-09 | 203,893 | 81,255 | 8 |
| LACNIC | https://ftp.lacnic.net/pub/stats/lacnic/delegated-lacnic-latest | 2026-10-08 | 48,376 | 20,421 | 7 |
| RIPE NCC | https://ftp.ripe.net/pub/stats/ripencc/delegated-ripencc-latest | 2026-10-09 | 167,497 | 100,652 | 7 |

Counts above were calculated from resource records in the local files, excluding comments, headers, and summaries. Across the five files there are **266,124 IPv4 block records**, including **4,012 ARIN reserved records**. Filtering to `allocated` and `assigned` leaves **262,112 records** before any duplicate or overlap checks.

The LACNIC header reports 50,073 resource records, while counting the actual resource rows produces 48,376. Its ASN summary reports 16,083, whereas the file contains 14,386 ASN rows. This discrepancy is outside the IPv4 chart scope but should be documented. Its IPv4 row count agrees with its summary.

**Geographic coverage:** the service regions of all five RIRs. Country codes represent registration information, not the physical location of every address.

**Temporal coverage:** snapshots from October 8–10, 2026. Non-missing IPv4 record dates range from December 13, 1982 to October 9, 2026. This is not a complete historical time series: dates associated with records should not be used to reconstruct historical ownership or activity without further investigation.

### Fields

| Field | Type | Meaning for this project |
|---|---|---|
| registry | Categorical | Registry publishing the record |
| cc | Categorical/geographic | Two-letter country code; may be missing |
| type | Categorical | Resource type: select `ipv4` |
| start | IPv4 address | First address in the block |
| value | Numerical | Number of addresses in an IPv4 block |
| date | Date | Record date in YYYYMMDD format; `00000000` means unknown |
| status | Categorical | For these IPv4 files: allocated, assigned, or reserved |
| opaque-id | Identifier | Additional ARIN field; not a human-readable organization name |

For an IPv4 record, the final address is `start + value - 1`. The `value` field is not a CIDR prefix length. Its meaning differs for IPv6 and ASN records, which is another reason to filter by resource type first.

### License and terms of use

The files are publicly accessible, but public access alone does not establish a common open license. The APNIC file includes conditions allowing download and use without guarantees of accuracy or liability. Terms for each registry and redistribution requirements still need to be verified before publication. Do not label the combined dataset CC0 or public domain without evidence.

## Step 3 — Initial exploration

### Important variables

Block size (`value`) controls how much numerical address space a record occupies. Registry and country provide categories for coloring and comparison. Status determines which records belong in a chart of allocated/assigned space.

### Initial descriptive statistics

These statistics include all IPv4 statuses, including ARIN reserved records; recompute for the final filtered chart.

| Registry | Minimum addresses/block | Maximum | Mean | Median |
|---|---:|---:|---:|---:|
| AFRINIC | 256 | 2,097,152 | 21,001.67 | 1,024 |
| APNIC | 64 | 16,777,216 | 15,255.77 | 1,024 |
| ARIN | 256 | 16,777,216 | 20,300.06 | 512 |
| LACNIC | 256 | 2,097,152 | 8,909.08 | 1,024 |
| RIPE NCC | 8 | 16,777,216 | 8,504.13 | 1,024 |

Means exceed medians in every file, suggesting a right-skewed block-size distribution: large blocks increase the mean substantially.

### Missing values and limitations

- ARIN has 4,012 IPv4 records with missing country and unknown date; these are reserved records.
- A blank area on the final chart means no qualifying record was represented there. It must not automatically be labeled unused or available.
- Registry classifications and reporting practices may differ; record counts alone do not measure address-space share.
- The five snapshots are not from exactly the same day. Check duplicates and overlapping intervals before interpreting the combined map.
- Some blocks contain fewer than 256 addresses. A /24 cell may contain multiple records; aggregation must preserve this information rather than silently assigning one record to the whole cell.
- These data cannot identify whether individual addresses are online.

## Step 4 — Questions

1. How is the registered IPv4 address space distributed among the five registries, measured by address count rather than record count?
2. Where do large continuous allocations and small interspersed allocations appear in numerical address space?
3. How do typical block sizes differ among registries?
4. Which countries account for the largest numbers of registered IPv4 addresses in this snapshot?

## Step 5 — Three possible visualizations

### A. Hilbert map [selected direction]

Show the IPv4 numerical address space as a square, colored by registry, with inspection of individual cells. Audience: students and readers interested in Internet infrastructure. Purpose: reveal where allocations sit and how they form patterns in address space.

Sketch to be drawn in the next step. Labels must explain the numerical layout, cell resolution, direction, and legend; conventional geographic axes would be misleading.

### B. Ranked bar chart

Show total allocated/assigned IPv4 addresses by registry, with exact values on hover. Audience: readers comparing the scale of registration across RIRs. Purpose: make quantities easier to compare than areas in a Hilbert map.

### C. Geographic map of IPv4 registrations

Show the total number of allocated or assigned IPv4 addresses by country of registration, using color intensity to represent address counts. Hovering over a country would reveal its name and total.

## Step 6 — Interactive chart

Implementation pending. Planned files:

- `hilbert.html`: page structure, title, explanation, legend, and source links.
- `hilbert.css`: layout and visual styling.
- `hilbert.js`: load/filter records, transform IPv4 addresses, calculate Hilbert coordinates, draw cells, and inspect cells.

Each logical code block will have a comment explaining its purpose. The existing `ip-map.html`, `ip-map.css`, and `ip-map.js` describe a separate city-based visualization.

## Guided workflow

1. Read and document the dataset — initial draft completed.
2. Draw three sketches and choose the Hilbert resolution and aggregation rule.
3. Build and preview the HTML/CSS layout.
4. Load and validate the IPv4 records.
5. Explain and implement the Hilbert transformation.
6. Add the legend and interactions.
7. Verify results, terms of use, and README; prepare the published chart for submission.
