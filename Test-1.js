// JavaScript source code
function liquidFillGaugeDefaultSettings() {
    return {
        minValue: 0, // The gauge minimum value.
        maxValue: 100, // The gauge maximum value.
        circleThickness: 0.05, // The outer circle thickness as a percentage of it's radius.
        circleFillGap: 0.05, // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
        circleColor: "#178BCA", // The color of the outer circle.
        waveHeight: 0.05, // The wave height as a percentage of the radius of the wave circle.
        waveCount: 1, // The number of full waves per width of the wave circle.
        waveRiseTime: 1000, // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
        waveAnimateTime: 18000, // The amount of time in milliseconds for a full wave to enter the wave circle.
        waveRise: true, // Control if the wave should rise from 0 to it's full height, or start at it's full height.
        waveHeightScaling: true, // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
        waveAnimate: true, // Controls if the wave scrolls or is static.
        waveColor: "#178BCA", // The color of the fill wave.
        waveOffset: 0, // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
        textVertPosition: .5, // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
        textSize: 1, // The relative height of the text to display in the wave circle. 1 = 50%
        valueCountUp: true, // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
        displayPercent: true, // If true, a % symbol is displayed after the value.
        textColor: "#045681", // The color of the value text when the wave does not overlap it.
        waveTextColor: "#A4DBf8" // The color of the value text when the wave overlaps it.
    };
}

function loadLiquidFillGauge(elementId, value, config) {
    if (config == null) config = liquidFillGaugeDefaultSettings();

    var gauge = d3.select("#" + elementId);
    var radius = Math.min(parseInt(gauge.style("width")), parseInt(gauge.style("height"))) / 2;
    var locationX = parseInt(gauge.style("width")) / 2 - radius;
    var locationY = parseInt(gauge.style("height")) / 2 - radius;
    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;

    var waveHeightScale;
    if (config.waveHeightScaling) {
        waveHeightScale = d3.scale.linear()
            .range([0, config.waveHeight, 0])
            .domain([0, 50, 100]);
    } else {
        waveHeightScale = d3.scale.linear()
            .range([config.waveHeight, config.waveHeight])
            .domain([0, 100]);
    }

    var textPixels = (config.textSize * radius / 2);
    var textFinalValue = parseFloat(value).toFixed(2);
    var textStartValue = config.valueCountUp ? config.minValue : textFinalValue;
    var percentText = config.displayPercent ? "%" : "";
    var circleThickness = config.circleThickness * radius;
    var circleFillGap = config.circleFillGap * radius;
    var fillCircleMargin = circleThickness + circleFillGap;
    var fillCircleRadius = radius - fillCircleMargin;
    var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);

    var waveLength = fillCircleRadius * 2 / config.waveCount;
    var waveClipCount = 1 + config.waveCount;
    var waveClipWidth = waveLength * waveClipCount;

    // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
    var textRounder = function (value) { return Math.round(value); };
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function (value) { return parseFloat(value).toFixed(1); };
    }
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function (value) { return parseFloat(value).toFixed(2); };
    }

    // Data for building the clip wave area.
    var data = [];
    for (var i = 0; i <= 40 * waveClipCount; i++) {
        data.push({ x: i / (40 * waveClipCount), y: (i / (40)) });
    }

    // Scales for drawing the outer circle.
    var gaugeCircleX = d3.scale.linear().range([0, 2 * Math.PI]).domain([0, 1]);
    var gaugeCircleY = d3.scale.linear().range([0, radius]).domain([0, radius]);

    // Scales for controlling the size of the clipping path.
    var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
    var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);

    // Scales for controlling the position of the clipping path.
    var waveRiseScale = d3.scale.linear()
        // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
        // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
        // circle at 100%.
        .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
        .domain([0, 1]);
    var waveAnimateScale = d3.scale.linear()
        .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
        .domain([0, 1]);

    // Scale for controlling the position of the text within the gauge.
    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin + fillCircleRadius * 2, (fillCircleMargin + textPixels * 0.7)])
        .domain([0, 1]);

    // Center the gauge within the parent SVG.
    var gaugeGroup = gauge.append("g")
        .attr('transform', 'translate(' + locationX + ',' + locationY + ')');

    // Draw the outer circle.
    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius - circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform', 'translate(' + radius + ',' + radius + ')');

    // Text where the wave does not overlap.
    var text1 = gaugeGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // The clipping wave area.
    var clipArea = d3.svg.area()
        .x(function (d) { return waveScaleX(d.x); })
        .y0(function (d) { return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI)); })
        .y1(function (d) { return (fillCircleRadius * 2 + waveHeight); });
    var waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + elementId);
    var wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea)
        .attr("T", 0);

    // The inner circle with the clipping wave attached.
    var fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(#clipWave" + elementId + ")");
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", config.waveColor);

    // Text where the wave does overlap.
    var text2 = fillCircleGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');

    // Make the value count up.
    if (config.valueCountUp) {
        var textTween = function () {
            var i = d3.interpolate(this.textContent, textFinalValue);
            return function (t) { this.textContent = textRounder(i(t)) + percentText; }
        };
        text1.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
        text2.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
    }

    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    var waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    if (config.waveRise) {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')')
            .transition()
            .duration(config.waveRiseTime)
            .attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
            .each("start", function () { wave.attr('transform', 'translate(1,0)'); }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
    } else {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
    }

    if (config.waveAnimate) animateWave();

    function animateWave() {
        wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
        wave.transition()
            .duration(config.waveAnimateTime * (1 - wave.attr('T')))
            .ease('linear')
            .attr('transform', 'translate(' + waveAnimateScale(1) + ',0)')
            .attr('T', 1)
            .each('end', function () {
                wave.attr('T', 0);
                animateWave(config.waveAnimateTime);
            });
    }

    function GaugeUpdater() {
        this.update = function (value) {
            var newFinalValue = parseFloat(value).toFixed(2);
            var textRounderUpdater = function (value) { return Math.round(value); };
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function (value) { return parseFloat(value).toFixed(1); };
            }
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function (value) { return parseFloat(value).toFixed(2); };
            }

            var textTween = function () {
                var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
                return function (t) { this.textContent = textRounderUpdater(i(t)) + percentText; }
            };

            text1.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);
            text2.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);

            var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;
            var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
            var waveRiseScale = d3.scale.linear()
                // The clipping area size is the height of the fill circle + the wave height, so we position the clip wave
                // such that the it will overlap the fill circle at all when at 0%, and will totally cover the fill
                // circle at 100%.
                .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
                .domain([0, 1]);
            var newHeight = waveRiseScale(fillPercent);
            var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
            var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);
            var newClipArea;
            if (config.waveHeightScaling) {
                newClipArea = d3.svg.area()
                    .x(function (d) { return waveScaleX(d.x); })
                    .y0(function (d) { return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI)); })
                    .y1(function (d) { return (fillCircleRadius * 2 + waveHeight); });
            } else {
                newClipArea = clipArea;
            }

            var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0;
            wave.transition()
                .duration(0)
                .transition()
                .duration(config.waveAnimate ? (config.waveAnimateTime * (1 - wave.attr('T'))) : (config.waveRiseTime))
                .ease('linear')
                .attr('d', newClipArea)
                .attr('transform', 'translate(' + newWavePosition + ',0)')
                .attr('T', '1')
                .each("end", function () {
                    if (config.waveAnimate) {
                        wave.attr('transform', 'translate(' + waveAnimateScale(0) + ',0)');
                        animateWave(config.waveAnimateTime);
                    }
                });
            waveGroup.transition()
                .duration(config.waveRiseTime)
                .attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')')
        }
    }

    return new GaugeUpdater();

}

function BindDynamichtmlforcharts() {
    DynamicHTML = '<svg id="fillgauge1" width="97%" height="250" onclick="gauge1.update(NewValue());"></svg>' +
        '<svg id="fillgauge2" width="19%" height="200" onclick="gauge2.update(NewValue());"></svg>' +
        '<svg id="fillgauge3" width="19%" height="200" onclick="gauge3.update(NewValue());"></svg>' +

        '<svg id="fillgauge4" width="19%" height="200" onclick="gauge4.update(NewValue());"></svg>' +
        '<svg id="fillgauge5" width="19%" height="200" onclick="gauge5.update(NewValue());"></svg>' +
        '<svg id="fillgauge6" width="19%" height="200" onclick="gauge6.update(NewValue());"></svg>';
    $('#ChartType').html(DynamicHTML);
    return true;
}
function invokecircularchart() {
    BindDynamichtmlforcharts()
    var gauge1 = loadLiquidFillGauge("fillgauge1", 55);
    var config1 = liquidFillGaugeDefaultSettings();
    config1.circleColor = "#FF7777";
    config1.textColor = "#FF4444";
    config1.waveTextColor = "#FFAAAA";
    config1.waveColor = "#FFDDDD";
    config1.circleThickness = 0.2;
    config1.textVertPosition = 0.2;
    config1.waveAnimateTime = 1000;
    var gauge2 = loadLiquidFillGauge("fillgauge2", 30, config1);
    var config2 = liquidFillGaugeDefaultSettings();
    config2.circleColor = "#D4AB6A";
    config2.textColor = "#553300";
    config2.waveTextColor = "#805615";
    config2.waveColor = "#AA7D39";
    config2.circleThickness = 0.1;
    config2.circleFillGap = 0.2;
    config2.textVertPosition = 0.8;
    config2.waveAnimateTime = 2000;
    config2.waveHeight = 0.3;
    config2.waveCount = 1;
    var gauge3 = loadLiquidFillGauge("fillgauge3", 60.1, config2);
    var config3 = liquidFillGaugeDefaultSettings();
    config3.textVertPosition = 0.8;
    config3.waveAnimateTime = 5000;
    config3.waveHeight = 0.15;
    config3.waveAnimate = false;
    config3.waveOffset = 0.25;
    config3.valueCountUp = false;
    config3.displayPercent = false;
    var gauge4 = loadLiquidFillGauge("fillgauge4", 50, config3);
    var config4 = liquidFillGaugeDefaultSettings();
    config4.circleThickness = 0.15;
    config4.circleColor = "#808015";
    config4.textColor = "#555500";
    config4.waveTextColor = "#FFFFAA";
    config4.waveColor = "#AAAA39";
    config4.textVertPosition = 0.8;
    config4.waveAnimateTime = 1000;
    config4.waveHeight = 0.05;
    config4.waveAnimate = true;
    config4.waveRise = false;
    config4.waveHeightScaling = false;
    config4.waveOffset = 0.25;
    config4.textSize = 0.75;
    config4.waveCount = 3;
    var gauge5 = loadLiquidFillGauge("fillgauge5", 60.44, config4);
    var config5 = liquidFillGaugeDefaultSettings();
    config5.circleThickness = 0.4;
    config5.circleColor = "#6DA398";
    config5.textColor = "#0E5144";
    config5.waveTextColor = "#6DA398";
    config5.waveColor = "#246D5F";
    config5.textVertPosition = 0.52;
    config5.waveAnimateTime = 5000;
    config5.waveHeight = 0;
    config5.waveAnimate = false;
    config5.waveCount = 2;
    config5.waveOffset = 0.25;
    config5.textSize = 1.2;
    config5.minValue = 30;
    config5.maxValue = 150
    config5.displayPercent = false;
    var gauge6 = loadLiquidFillGauge("fillgauge6", 120, config5);

}
function selectchartype(typeofchart) {
    if (typeofchart == "Fluidchart") {
        invokecircularchart();
    }
    else if (typeofchart == "barchart") {
        $('#ChartType').html(" ")
    }
}
function selectmenu(id) {
    if (id == "protfolio") {
        //Do something
        BindProtfolio()
    }
    else if (id == "profile") {
        //     do something
        BindProfile();
    }
    else if (id = "home") {
        BindHomePage();
       // BindBirchRPackage()
        //Do something else
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function BindHomePage() {
    $('#ContentDiv').hide(1000)
    await sleep(1000);
    $('#ContentDiv').html(" ")
    DynamicHTML = '<div class="col-lg-12 custompadding irc_mi">'+

//        <!--<img src="C:\Users\aksha\OneDrive\Documents\Purdue\E - learning\Visualizations\picture.jpg" />-->
  '</div>'+
        ' <div class="bg-text">'+
        '   <img class="mainimage" src="https://akshaykurapaty.github.io/picture.jpg" />' +
        '  <h4 style = "font-family:nunito sans,Helvetica,sans-serif;">I\'M AKSHAY KURAPATY</h4>' +
        '   <p style="color:#FFFFFF;font-size:small;font-family:nunito sans,Helvetica,sans-serif;font-weight:bolder">Data Scientist / Consultant / Programmer</p>' +
        '</div>'
    $('#ContentDiv').html(DynamicHTML)
    $('#ContentDiv').show(1000)
}

async function BindProfile() {
    try {
        $('#ContentDiv').hide(1000)
        await sleep(1000);
        $('#ContentDiv').html(" ")
        Dynamichtml = '<div class="col-lg-4" style="margin-top:2%">'+
            '<img class="subimage" style="border-radius: 50%;" src="https://akshaykurapaty.github.io/PP.jpg"/>' +
        '        </div>' +
            '           <div class="col-lg-1"></div>' +
            '          <div class="col-lg-6" style="margin-top:5%; text-align:justify;font-family:sans-serif;font-weight:600">' +
            '             <p style="word-wrap: break-word;">' +
            '                Hi I\'m <a> Akshay Kurapaty</a>, I graduated as a computer science engineer from one of India\'s leading engineering institutes.My fascination with technology that has transformed lives over the years and the fact that technology evolves from a quest to meet social and business needs stands obvious to me.My proclivity towards understanding analytics began when, for my UG Project, I worked on data - mining algorithms and proposed a thesis on their usability for constructing predictive models.'+
            '       </p>' +
            '          <p>' +
            '             After my graduation, I worked for <a>3 years</a> as a Data Scientist at <a href="https://www2.deloitte.com/us/en.html">Deloitte</a>, which enthused me for the tremendous prospects offered, from being able to work with global clients and to receive mentoring from some of elite leaders in the industry. I was a part of the <a>advanced analytics team </a> built from a hand-picked group, which performs complex analytics and builds predictive models to solve business problems. However, as I advanced through my career across challenging assignments, I  believed that a classroom training would help me broaden my skillset to propel my career in this field.' +
            '    </p>' +
            '       <p>' +
            '          Right now, I am pursuing Master\'s Degree in <a href="https://krannert.purdue.edu/masters/programs/business-analytics-and-information-management/">Business Analytics</a> at <a href="https://www.purdue.edu/">Purdue University</a>. This Degree will help me understand what kind of parameters to probe for based on the business case at hand whereas, business centric course strcture will hone my business perspective.' +
            ' </p>' +
            '</div>' +
            '<div class="col-lg-1">' +

            '</div>' 
        $('#ContentDiv').html(Dynamichtml);
        $('#ContentDiv').show(1000)
    }
    catch (e) {
        console.log("An exception occured : "+e)
    }
}

async function BindProtfolio() {
    $('#ContentDiv').hide(1000)
    await sleep(1000);
    $('#ContentDiv').html(" ")
    Dynamichtml = "";
    Dynamichtml = '        <div class="col-lg-12">'+
    ' <div style = "margin-left:7%">' +
        '     <div class="col-lg-3 custompadding customflip" style="margin-top:1%">' +
        '        <div class="flip-card">' +
        '           <div class="flip-card-inner">' +
        '              <div class="flip-card-front">' +
        '                 <img src="C:\\Users\\aksha\\OneDrive\\Documents\\Purdue\\E - learning\\Visualizations\\airpollution.jpg" style="width:100%;height:100%" alt="Avatar">' +
        '                    <div class="centered" style="color:white;font-weight:700">Investigation of PM2.5 (Regression techniques)</div>' +
        '               </div>' +
        '              <div class="flip-card-back">' +
        '                 <h3>Investigation of PM2.5</h3>' +
        '                <p>Determine factors that affect pollution index</p>' +
        '               <button id="multipleregression" style="background-color:black"><i class="fa fa-search"></i>Explore</button>' +
        '          </div>' +
        '     </div>' +
        '</div>' +
        ' </div>' +
        ' <div class="col-lg-1"></div>' +
    ' <div class="col-lg-3 custompadding customflip" style="margin-top:1%">'+
        '    <div class="flip-card">' +
        '    <div class="flip-card">' +
        '       <div class="flip-card-inner">' +
        '          <div class="flip-card-front">' +
        '             <img src="C:\\Users\\aksha\\OneDrive\\Documents\\Purdue\\E - learning\\Visualizations\\textimage.jpg" style="width:100%;height:100%" alt="Avatar">' +
        '                <div class="centered" style="color:white;font-weight:700">Ad classification using Text and Image</div>' +
        '       </div>' +
        '          <div class="flip-card-back">' +
        '             <h3>Ad Classification on Craigslist</h3>' +
        '            <p>NLP Models and  Convolutional Neural Networks</p>' +
        '           <button style="background-color:black"><i class="fa fa-search"></i>Explore</button>' +
        '      </div>' +
        ' </div>' +
        ' </div>' +
        ' </div>' +
        ' </div>' +
        '<div class="col-lg-1"></div>' +
        ' <div class="col-lg-3 custompadding customflip" style="margin-top:1%">' +
        '    <div class="flip-card">' +
        '       <div class="flip-card-inner">' +
        '          <div class="flip-card-front">' +
        '             <img src="C:\\Users\\aksha\\OneDrive\\Documents\\Purdue\\E - learning\\Visualizations\\R.jpg" style="width:100%;height:100%" alt="Avatar">' +
        '                <div class="centered" style="color:white;font-weight:700">R-Package for Birch Clustering</div>' +
        '   </div>' +
        '          <div class="flip-card-back">' +
        '             <h3>Birch Clustering Package for R</h3>' +
        '            <p>Used Reccursive balanced Trees to create a clustering algorithm in R</p>' +
        '           <button id="Birch" style="background-color:black"><i class="fa fa-search"></i>Explore</button>' +
        '      </div>' +
        ' </div>' +
        '</div' +
        '</div>' +
        ' </div>' +
               ' </div>'
        $('#ContentDiv').html(Dynamichtml);
    $('#ContentDiv').show(1000)
    await sleep(1000);
    $('#multipleregression').bind("click", function (params) {
        BindMulitpleregression()
    })
    $('#Birch').bind("click", function (params) {
        BindBirchRPackage();

    })

    
}

function BindMulitpleregression() {
    $('#ContentDiv').hide(1000);
    $('#ContentDiv').html("")
    Dynamichtml = ""
    Dynamichtml += '<div class="col-lg-12">'
    Dynamichtml += '<div class="col-lg-1"></div><div class="col-lg-10"><h2 style="text-align:center;font-weight:800">Analysis of Factors influencing PM2.5 level in air</h2></div><div class="col-lg-1"></div></div>'
    Dynamichtml += "</div>"
    Dynamichtml += '<div class="col-lg-12"><div class="col-lg-1"></div><div class="col-lg-10" style="text-align:justify;font-family:sans-serif;font-weight:600">'
    Dynamichtml += '<p><a>Abstract:</a> Air quality is the most severe pollution problem in China due to the rapid industrialization and increasing energy consumption. In Beijing, the PM 2.5 can be higher than 500 in winter, which means the air is toxic for human, especially for children with a relatively vulnerable immune system. Moreover, PM 2.5 is a cross-country problem. It is not limited by borders and is a global issue. Studying the other factors that influence air quality index would help us understand the reason in more detail.</p>'+
    '<p>This project aims at analyzing how air quality(PM 2.5) can be affected by several weather factors, such as temperature, humanity, wind direction, etc in metropolitan area.The dataset used in this project is PM 2.5 data collected from Beijing, China in three - year period.</p>'+
        '<p><a>Results:</a> It is found that PM 2.5 is usually higher in winter, but lower in summer.Moreover, analysis noticed that the PM 2.5 varies in different period of one day.We hope we can find the underlying relationship among these weather factors and provide a direction for future study to effectively solve the high PM 2.5 issue for metropolitan area with similar population and energy consumption.</p>'
   
    Dynamichtml += '</div><div class="col-lg-1"></div></div>'
    Dynamichtml += '<div class="col-lg-12"> <div class="col-lg-1"></div>'+
    '<div class="col-lg-10" style="text-align:justify;font-family:sans-serif;font-weight:600"><p><a>Technologies Used:</a> Python, Scikit-learn, Numpy, Pandas</p>'+
    '<p><a>Data Science concepts Used:</a> Imputation, Linear Regression, Multiple Regression, Subset Selection</p></div>'
    Dynamichtml += '<div class="col-lg-1"></div></div>'
    Dynamichtml += '<div class="col-lg-12"><div class="col-lg-1"></div><div class="col-lg-10"><button id =""><a href="https://github.com/akshaykurapaty/Multiple-Regression" target="_blank" style="color:black"><i class="fa fa-github"></i>Github</a></button></div><div class="col-lg-1"></div></div>'
    $('#ContentDiv').html(Dynamichtml);
    $('#ContentDiv').show(1000)
}

function BindBirchRPackage() {
    $("ContentDiv").hide(1000);
    $('#ContentDiv').html(" ")
    Dynamichtml=""
    Dynamichtml += '<div class="col-lg-12">'
    Dynamichtml += '<div class="col-lg-1"></div><div class="col-lg-10"><h2 style="text-align:center;font-weight:800">Birch Clustering Package for R</h2></div><div class="col-lg-1"></div></div>'
    Dynamichtml += "</div>"
    Dynamichtml += '<div class="col-lg-12"><div class="col-lg-1"></div><div class="col-lg-10" style="text-align:justify;font-family:sans-serif;font-weight:600">'
    Dynamichtml += '<p><a>Abstract:</a> Machine learning models are classified into supervised or unsupervised learning. Clustering is a unsupervised machine learning technique that involves grouping similar data points together. Performing cluster analysis is computationally expensive operation. As the clustering deals with unsupervised data, achieving the right cluster groups need multiple data scans to yield optimal solution. In the world where working with gigabytes of data is a norm, there is a dire need to develop algorithms that would yield accurate results with few data scans, that in turn reduces the computational effort. BIRCHR package developed for R is one such algorithm, which uses hierarchical tree-based algorithms to get the clusters. The key challenge in the implementation of this package was to design a work around mechanism to implement trees, as pointers are not supported in R. We used two dimensional lists in collaboration with a recursive algorithm to design self-organizing B-Tree, that always maintains the clusters at the leaf nodes and keeps all the leaf nodes at the same level.</p>' +
        '<p><a>Results:</a> The clusters formed from the BirchR package are compared with the clusters formed from Birch algorithm from scikit learn library in python. The results proved to be completely similar with the results yielded from python. The cluster analysis has been performed on the cars dataset which is by default available in R and imported to Python to validate the accuracy of clusters.</p>'

    Dynamichtml += '</div><div class="col-lg-1"></div></div>'
    Dynamichtml += '<div class="col-lg-12"> <div class="col-lg-1"></div>' +
        '<div class="col-lg-10" style="text-align:justify;font-family:sans-serif;font-weight:600"><p><a>Technologies Used:</a> R</p>' +
        '<p><a>Data Science concepts Used: </a>Heirarchial Clustering, 2-D Lists, Tree Data Structure, Recursive Algorithm</p></div>'
    Dynamichtml += '<div class="col-lg-1"></div></div>'
    Dynamichtml += '<div class="col-lg-12"><div class="col-lg-1"></div><div class="col-lg-10"><button id =""><a href="https://github.com/akshaykurapaty/BIRCHR-Package" target="_blank" style="color:black"><i class="fa fa-github"></i>Github</a></button><button style="margin-left:10px" id ="viewpdf"><a style="color:black"><i class="fa fa-file"></i>View Documentation</a></button></div><div class="col-lg-1"></div></div>'
    Dynamichtml += '<div id="pdfviewer" class="col-lg-12" style="display:none;padding-top:10px"><object data="https://raw.githubusercontent.com/akshaykurapaty/BIRCHR-Package/0f9c4b7b7cb5d6de2a5d96dc6774145bb779c5b0/BirchR%20Package%20Paper.pdf" style = "width:100%; height:100%;" frameborder = "1" ></object></div>';
    $('#ContentDiv').html(Dynamichtml);
    $('#ContentDiv').show(1000)
    $('#viewpdf').bind("click", function (params) {

        $('#pdfviewer').show(10)
    })

}