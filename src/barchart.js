class BarChart {
  constructor(selector, dataPath) {
    this.selector = selector;
    this.dataPath = dataPath;

    this.width = 500;
    this.height = 300;
    this.margin = { top: 20, right: 20, bottom: 50, left: 120 };
    this.maxLabelChars = 20;

    this.xEncodingMap = {
      "difficulty_asc": d => +d.difficulty,
      "try_count":      d => +d.try_count,
      "accepted_count": d => +d.accepted_count
    };

    this.xLabelMap = {
      "difficulty_asc": "정답률",
      "try_count":      "시도수",
      "accepted_count": "정답수"
    };

    this.svg = d3.select(this.selector)
      .append("svg")
      .attr("width",  this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  truncateLabel(fullLabel) {
    const maxChars = this.maxLabelChars;
    if (fullLabel.length <= maxChars) return fullLabel;

    const [id, ...rest] = fullLabel.split(" ");
    const name = rest.join(" ");
    const idPart = id;
    const availableForName = maxChars - (idPart.length + 1);
    if (availableForName <= 0) {
      return idPart;
    }
    const truncatedName = name.length <= availableForName
      ? name
      : name.slice(0, availableForName - 3) + "...";
    return `${idPart} ${truncatedName}`;
  }

  async update(selectedTag, xAttribute) {
    const data = await d3.csv(this.dataPath, d3.autoType);

    const xAccessor = this.xEncodingMap[xAttribute];
    const xLabel    = this.xLabelMap[xAttribute] || xAttribute;

    const filtered = data
      .filter(d => {
        const tags = d.tag.split(/\s*,\s*/);
        return tags.includes(selectedTag);
      })
      .sort((a, b) => xAccessor(b) - xAccessor(a))
      .slice(0, 10);

    const labels = filtered.map(d => `${d.problem_id} ${d.name}`);

    const xScale = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => xAccessor(d)) || 0])
      .range([0, this.width]);

    const yScale = d3.scaleBand()
      .domain(labels)
      .range([0, this.height])
      .padding(0.1);

    const bars = this.svg.selectAll(".bar")
      .data(filtered, d => d.problem_id);

    bars.exit()
      .transition()
      .duration(500)
      .attr("width", 0)
      .style("fill-opacity", 0)
      .remove();

    const enterBars = bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("y", d => yScale(`${d.problem_id} ${d.name}`))
      .attr("height", yScale.bandwidth())
      .attr("width", 0)
      .attr("fill", "#69b3a2");

    enterBars.append("title")
      .text(d => `${xLabel}: ${xAccessor(d)}`);

    enterBars.transition()
      .duration(800)
      .attr("width", d => xScale(xAccessor(d)));

    bars.transition()
      .duration(800)
      .attr("y", d => yScale(`${d.problem_id} ${d.name}`))
      .attr("height", yScale.bandwidth())
      .attr("width", d => xScale(xAccessor(d)))
      .selection()
      .selectAll("title")
      .text(d => `${xLabel}: ${xAccessor(d)}`);

    this.svg.selectAll(".x-axis, .y-axis").remove();

    this.svg.append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${this.height})`)
      .transition().duration(800)
      .call(d3.axisBottom(xScale).ticks(5));

    this.svg.append("g")
      .attr("class", "y-axis")
      .transition().duration(800)
      .call(
        d3.axisLeft(yScale)
          .tickFormat(fullLabel => this.truncateLabel(fullLabel))
      )
      .selectAll("text")
      .style("font-size", "12px");
  }
}
