class HeatmapChart {
  constructor(selector, dataPath) {
    this.selector = selector;
    this.dataPath = dataPath;

    this.margin = { top: 30, right: 80, bottom: 30, left: 80 };
    this.width = 600;
    this.height = 240;

    this.tagInfo = [
      { key: "Bruteforcing",          label: "Bruteforcing" },
      { key: "String",                label: "String" },
      { key: "Dyanmic Programming",   label: "DP" },
      { key: "Depth-first Search",    label: "DFS" },
      { key: "Breadth-first Search",  label: "BFS" }
    ];
    this.tags = this.tagInfo.map(d => d.label);

    this.months = Array.from({ length: 12 }, (_, i) => String(i + 1));

    this.svg = d3
      .select(this.selector)
      .attr("width",  this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    this.xScale = d3
      .scaleBand()
      .domain(this.months)
      .range([0, this.width])
      .padding(0.05);

    this.yScale = d3
      .scaleBand()
      .domain(this.tags)
      .range([0, this.height])
      .padding(0.05);

    this.colorScale = d3
      .scaleSequential(d3.interpolateRgb("#ffffff", "#006400"))
      .domain([0, 80]);

    this.legendGroup = this.svg.append("g")
      .attr("class", "legendGroup")
      .attr("transform", `translate(${this.width + 20}, 0)`);
  }

  async update(userId) {
    const data = await d3.csv(this.dataPath, d3.autoType);
    const userRow = data.find(d => +d.id === +userId);
    if (!userRow) {
      this.svg.selectAll("*").remove();
      return;
    }

    const heatmapData = [];
    this.tagInfo.forEach(info => {
      for (let m = 1; m <= 12; m++) {
        const keyName = `${info.key}_${m}`;
        const cnt     = +userRow[keyName] || 0;
        heatmapData.push({
          tagLabel: info.label,
          month:    String(m),
          value:    cnt
        });
      }
    });

    this.svg.selectAll(".x-axis").remove();
    this.svg.selectAll(".y-axis").remove();
    this.svg.selectAll(".heatcell").remove();
    this.svg.selectAll(".cell-label").remove();

    const xAxis = d3.axisTop(this.xScale);
    this.svg
      .append("g")
      .attr("class", "x-axis")
      .call(xAxis)
      .selectAll("text")
      .style("font-size", "12px");

    const yAxis = d3.axisLeft(this.yScale);
    this.svg
      .append("g")
      .attr("class", "y-axis")
      .call(yAxis)
      .selectAll("text")
      .style("font-size", "12px");

    const cells = this.svg
      .selectAll(".heatcell")
      .data(heatmapData, d => d.tagLabel + ":" + d.month);

    cells.exit().remove();

    const cellsEnter = cells
      .enter()
      .append("rect")
      .attr("class", "heatcell")
      .attr("x", d => this.xScale(d.month))
      .attr("y", d => this.yScale(d.tagLabel))
      .attr("width", this.xScale.bandwidth())
      .attr("height", this.yScale.bandwidth())
      .style("fill", "#fff");

    cellsEnter
      .merge(cells)
      .transition()
      .duration(500)
      .style("fill", d => this.colorScale(d.value));

    const labels = this.svg
      .selectAll(".cell-label")
      .data(heatmapData, d => d.tagLabel + ":" + d.month);

    labels.exit().remove();

    labels
      .enter()
      .append("text")
      .attr("class", "cell-label")
      .attr("x", d => this.xScale(d.month) + this.xScale.bandwidth() / 2)
      .attr("y", d => this.yScale(d.tagLabel) + this.yScale.bandwidth() / 2 + 4)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#000")
      .style("opacity", 0.6)
      .text(d => d.value)
      .merge(labels)
      .transition()
      .duration(500)
      .text(d => d.value);

    this.legendGroup.selectAll("*").remove();

    const defs = this.svg.append("defs");
    const gradientId = "heatmap-vertical-gradient";

    const linearGradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    const stops = 10;
    d3.range(stops + 1).forEach(i => {
      const t   = i / stops;
      const val = t * 80;
      linearGradient
        .append("stop")
        .attr("offset", `${t * 100}%`)
        .attr("stop-color", this.colorScale(val));
    });

    const legendWidth  = 20;
    const legendHeight = this.height;

    this.legendGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", `url(#${gradientId})`);

    const legendScale = d3
      .scaleLinear()
      .domain([0, 80])
      .range([legendHeight, 0]);

    const legendAxis = d3
      .axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format("d"));

    this.legendGroup
      .append("g")
      .attr("class", "legend-axis")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll("text")
      .style("font-size", "10px");
  }
}
