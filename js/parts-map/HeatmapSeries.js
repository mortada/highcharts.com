
/**
 * Extend the default options with map options
 */
defaultOptions.plotOptions.heatmap = merge(defaultOptions.plotOptions.scatter, {
	animation: false,
	borderWidth: 0,
	nullColor: '#F8F8F8',
	dataLabels: {
		formatter: function () { // #2945
			return this.point.value;
		},
		verticalAlign: 'middle',
		crop: false,
		overflow: false,
		style: {
			color: 'white',
			fontWeight: 'bold',
			HcTextStroke: '1px rgba(0,0,0,0.5)'
		}
	},
	marker: null,
	tooltip: {
		pointFormat: '{point.x}, {point.y}: {point.value}<br/>'
	},
	states: {
		normal: {
			animation: true
		},
		hover: {
			brightness: 0.2
		}
	}
});

// The Heatmap series type
seriesTypes.heatmap = extendClass(seriesTypes.scatter, merge(colorSeriesMixin, {
	type: 'heatmap',
	pointArrayMap: ['y', 'value'],
	hasPointSpecificOptions: true,
	supportsDrilldown: true,
	getExtremesFromAll: true,
	init: function () {
		seriesTypes.scatter.prototype.init.apply(this, arguments);
		this.pointRange = this.options.colsize || 1;
		this.yAxis.axisPointRange = this.options.rowsize || 1; // general point range
	},
	translate: function () {
		var series = this,
			options = series.options,
			xAxis = series.xAxis,
			yAxis = series.yAxis;

		series.generatePoints();

		each(series.points, function (point) {
			var xPad = (options.colsize || 1) / 2,
				yPad = (options.rowsize || 1) / 2,
				x1 = Math.round(xAxis.len - xAxis.translate(point.x - xPad, 0, 1, 0, 1)),
				x2 = Math.round(xAxis.len - xAxis.translate(point.x + xPad, 0, 1, 0, 1)),
				y1 = Math.round(yAxis.translate(point.y - yPad, 0, 1, 0, 1)),
				y2 = Math.round(yAxis.translate(point.y + yPad, 0, 1, 0, 1));

			// Set plotX and plotY for use in K-D-Tree and more
			point.plotX = (x1 + x2) / 2;
			point.plotY = (y1 + y2) / 2;

			point.shapeType = 'rect';
			point.shapeArgs = {
				x: Math.min(x1, x2),
				y: Math.min(y1, y2),
				width: Math.abs(x2 - x1),
				height: Math.abs(y2 - y1)
			};
		});
		
		series.translateColors();

		// Make sure colors are updated on colorAxis update (#2893)
		if (this.chart.hasRendered) {
			each(series.points, function (point) {
				point.shapeArgs.fill = point.color;
			});
		}
	},
	drawPoints: seriesTypes.column.prototype.drawPoints,
	animate: noop,
	getBox: noop,
	drawLegendSymbol: LegendSymbolMixin.drawRectangle,

	getExtremes: function () {
		// Get the extremes from the value data
		Series.prototype.getExtremes.call(this, this.valueData);
		this.valueMin = this.dataMin;
		this.valueMax = this.dataMax;

		// Get the extremes from the y data
		Series.prototype.getExtremes.call(this);
	}
		
}));

