class RadarChart {
  margin = { top: 50, right: 50, bottom: 50, left: 50 };

  constructor(selector, width = 450, height = 450) {
    this.selector = selector;
    this.width = width - this.margin.left - this.margin.right;
    this.height = height - this.margin.top - this.margin.bottom;
    this.radius = Math.min(this.width, this.height) / 2;
    this.axesCount = 5;
    this.textOffset = 20;
  }

  initialize() {
    d3.select(this.selector).selectAll("svg").remove();

    const svg = d3
      .select(this.selector)
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom);

    this.svg = svg
      .append("g")
      .attr(
        "transform",
        `translate(${
          (this.width + this.margin.left + this.margin.right) / 2
        }, ${
          (this.height + this.margin.top + this.margin.bottom) / 2 + this.textOffset
        })`
      );
  }

  async update(userId) {
    const data = await d3.csv("user_tag_accuracy.csv", d3.autoType);

    const userRow = data.find(d => +d.id === +userId);
    if (!userRow) {
      d3.select(this.selector).selectAll("svg").remove();
      return;
    }

    const attributes = [
      { key: "Bruteforcing_rate", label: "Bruteforcing" },
      { key: "String_rate", label: "String" },
      { key: "Dyanmic Programming_rate", label: "DP" },
      { key: "Depth-first Search_rate", label: "DFS" },
      { key: "Breadth-first Search_rate", label: "BFS" }
    ];

    const radarData = attributes.map(attr => ({
      axis: attr.label,
      value: Math.max(0, Math.min(1, +userRow[attr.key]))
    }));

    this.initialize();

    const levels = 5;
    const axisGrid = this.svg.append("g").attr("class", "axisWrapper");

    axisGrid
      .selectAll(".gridCircle")
      .data(d3.range(1, levels + 1).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", d => (this.radius / levels) * d)
      .style("fill", "#CDCDCD")
      .style("stroke", "#CDCDCD")
      .style("fill-opacity", 0.1);

    const axis = axisGrid
      .selectAll(".axis")
      .data(radarData)
      .enter()
      .append("g")
      .attr("class", "axis");

    axis
      .append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) =>
        this.radius * Math.cos((i * 2 * Math.PI) / this.axesCount - Math.PI / 2)
      )
      .attr("y2", (d, i) =>
        this.radius * Math.sin((i * 2 * Math.PI) / this.axesCount - Math.PI / 2)
      )
      .style("stroke", "white")
      .style("stroke-width", "2px");

    axis
      .append("text")
      .attr("class", "legend")
      .text(d => d.axis)
      .attr("x", (d, i) =>
        (this.radius + 20) *
          Math.cos((i * 2 * Math.PI) / this.axesCount - Math.PI / 2)
      )
      .attr("y", (d, i) =>
        (this.radius + 20) *
          Math.sin((i * 2 * Math.PI) / this.axesCount - Math.PI / 2)
      )
      .style("font-size", "11px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em");

    const radarLine = d3
      .lineRadial()
      .radius(d => this.radius * d.value)
      .angle((d, i) => (i * 2 * Math.PI) / this.axesCount)
      .curve(d3.curveLinearClosed);

    const radarWrapper = this.svg.append("g").attr("class", "radarWrapper");

    const zeroData = radarData.map(d => ({ axis: d.axis, value: 0 }));
    const radarArea = radarWrapper
      .append("path")
      .datum(zeroData)
      .attr("class", "radarArea")
      .attr("d", radarLine)
      .style("fill", "#4CAF50")
      .style("fill-opacity", 0.5)
      .style("stroke-width", "2px")
      .style("stroke", "#4CAF50")
      .style("opacity", 0.7);

    radarArea
      .transition()
      .duration(800)
      .attrTween("d", () => {
        const interpolate = d3.interpolateArray(zeroData, radarData);
        return t => radarLine(interpolate(t));
      });

    radarWrapper
      .selectAll(".radarCircle")
      .data(radarData)
      .enter()
      .append("circle")
      .attr("class", "radarCircle")
      .attr("r", 4)
      .attr("cx", (d, i) =>
        this.radius * Math.cos((i * 2 * Math.PI) / this.axesCount - Math.PI / 2)
      )
      .attr("cy", (d, i) =>
        this.radius * Math.sin((i * 2 * Math.PI) / this.axesCount - Math.PI / 2)
      )
      .style("fill", "#4CAF50")
      .style("fill-opacity", 0.8);

    radarWrapper
      .selectAll(".radarValue")
      .data(radarData)
      .enter()
      .append("text")
      .attr("class", "radarValue")
      .attr("x", (d, i) =>
        this.radius * Math.cos((i * 2 * Math.PI) / this.axesCount - Math.PI / 2)
      )
      .attr("y", (d, i) =>
        this.radius * Math.sin((i * 2 * Math.PI) / this.axesCount - Math.PI / 2) +
        12
      )
      .text(d => d.value.toFixed(2))
      .style("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("fill", "#333");

    this.svg
      .append("text")
      .attr("x", -this.radius)
      .attr("y", -this.radius - this.textOffset - 10)
      .attr("text-anchor", "start")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`User ${userId}의 문제 유형별 정답률`);
  }
}
