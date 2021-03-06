import { getDataRange } from './charts-util'
import Util from '../util/util'
import { mesureText } from './charts-util'

function dataCombine(series) {
    return series.reduce(function(a, b) {
        return (a.data ? a.data : a).concat(b.data);
    }, []);
}

export function calCategoriesData(categories, opts, config) {
    let result = {
        angle: 0,
        xAxisHeight: config.xAxisHeight
    };
    let { eachSpacing } = getXAxisPoints(categories, opts, config);

    // get max length of categories text
    let categoriesTextLenth = categories.map((item) => {
        return mesureText(item);
    });

    let maxTextLength = Math.max.apply(this, categoriesTextLenth);

    if ( maxTextLength + 2 * config.xAxisTextPadding > eachSpacing) {
        result.angle = 45 * Math.PI / 180;
        result.xAxisHeight = 2 * config.xAxisTextPadding + maxTextLength * Math.sin(result.angle) + config.padding;
    }

    return result;
}

export function getPieDataPoints(series, process = 1) {
    var count = 0;
    var _start_ = 0;
    series.forEach(function(item) {
        count += item.data;
    });
    series.forEach(function(item) {
        item._proportion_ = item.data / count * process;
    });
    series.forEach(function(item) {
        item._start_ = _start_;
        _start_ += 2 * item._proportion_ * Math.PI;
    });

    return series;
}

export function getPieTextMaxLength(series) {
    series = getPieDataPoints(series);
    let maxLength = 0;
    series.forEach((item) => {
        let text = item.format ? item.format(+item._proportion_.toFixed(2)) : `${Util.toFixed(item._proportion_ * 100)}%`;
        maxLength = Math.max(maxLength, mesureText(text));
    });

    return maxLength;
}

export function fixColumeData(points, eachSpacing, columnLen, index, config) {
    return points.map(function(item) {
        item.width = (eachSpacing - 2 * config.columePadding) / columnLen;
        item.width = Math.min(item.width, 15);
        item.x += (index + 0.5 - (columnLen) / 2) * item.width;

        return item;
    });
}

export function getXAxisPoints(categories, opts, config) {
    let yAxisTotalWidth = config.yAxisWidth + config.yAxisTitleWidth;
    let spacingValid = opts.width - 2 * config.padding - yAxisTotalWidth;
    let eachSpacing = spacingValid / categories.length;

    let xAxisPoints = [];
    let startX = config.padding + yAxisTotalWidth;
    let endX = opts.width - config.padding;
    categories.forEach(function(item, index) {
        xAxisPoints.push(startX + index * eachSpacing);
    });
    xAxisPoints.push(endX);

    return { xAxisPoints, startX, endX, eachSpacing };
}

export function getDataPoints(data, minRange, maxRange, xAxisPoints, eachSpacing, opts, config, process = 1) {
    let points = [];
    let validHeight = opts.height - 2 * config.padding - config.xAxisHeight - config.legendHeight;
    data.forEach(function(item, index) {
        let point = {};
        point.x = xAxisPoints[index] + Math.round(eachSpacing / 2);
        let height = validHeight * (item - minRange) / (maxRange - minRange);
        height *= process;
        point.y = opts.height - config.xAxisHeight - config.legendHeight - Math.round(height) - config.padding;
        points.push(point);
    });

    return points;
}

export function getYAxisTextList(series, opts, config) {
    let data = dataCombine(series);
    let minData = typeof opts.yAxis.min === 'number' ? opts.yAxis.min : Math.min.apply(this, data);
    let maxData = Math.max.apply(this, data);

    // fix issue https://github.com/xiaolin3303/wx-charts/issues/9
    if (minData === maxData) {
        let rangeSpan = maxData || 1;
        minData -= rangeSpan;
        maxData += rangeSpan;
    }

    let dataRange = getDataRange(minData, maxData);
    let minRange = dataRange.minRange;
    let maxRange = dataRange.maxRange;

    let range = [];
    let eachRange = (maxRange - minRange) / config.yAxisSplit;

    for (var i = 0; i <= config.yAxisSplit; i++) {
        range.push(minRange + eachRange * i);
    }
    return range.reverse();
}

export function calYAxisData(series, opts, config) {
    let ranges = getYAxisTextList(series, opts, config);
    let yAxisWidth = config.yAxisWidth;
    let rangesFormat = ranges.map(function(item) {
        item = Util.toFixed(item, 2);
        item = opts.yAxis.format ? opts.yAxis.format(Number(item)) : item;
        yAxisWidth = Math.max(yAxisWidth, mesureText(item) + 5);
        return item;
    });

    return { rangesFormat, ranges, yAxisWidth };
}