'use strict';
// London Crime Dashboard by Nandor Persanyi
/**
 * @ngdoc function
 * @name londoncrimeApp.controller:LondonController
 * @description
 * # LondonController
 * Controller of the londoncrimeApp
 */
angular.module('londoncrimeApp')
.controller('LondonController', function ($rootScope,$scope,$state,$timeout,mapData,crimeData) {

    $scope.crimeData = crimeData;
    $scope.selectedBorough = {};
    $scope.selectedBoroughTitle = 'London';
    $scope.selectedBorough.name = 'London';
    var boroughSelected = false;
    var firstBoroughSelected = false;

    // Map Logic >>>
    // Set map directive config object
    $scope.map = {
        center: [51.515741, -0.115339],
        zoom: 10,
        options: function() {
            return {
                streetViewControl: false,
                scrollwheel: false
            }
        },
        events:{
            idle: function(e, p, map, points) {
                $scope.$broadcast('mapLoadedEvent', true);
            }
        }
    };
    // Set geopolygoncustom directive config object
    $scope.boroughs = {
        geojson:mapData,
        options: function(geometry, properties, map, i) {
            return {
                fillColor: '#002699',
                strokeWeight: 1,
                strokeColor: '#e6e600'
            }
        },
        events: {
            mouseover: function(e, p, map, polygons) {
                $scope.selectedBoroughTitle = p.properties.NAME;
                $scope.$apply();

                if($scope.selectedBorough.name !== p.properties.NAME) {
                    p.setOptions({
                        fillColor: '#001966'
                    })
                }
            },
            mouseout: function(e, p, map, polygons) {
                if(!boroughSelected){
                    $scope.selectedBoroughTitle = 'London';
                } else {
                    $scope.selectedBoroughTitle = $scope.selectedBorough.name;
                }
                if($scope.selectedBorough.name !== p.properties.NAME){
                    $scope.$apply();
                    p.setOptions({
                        fillColor: '#002699'
                    })
                }
            },
            click: function(e, p, map, polygons) {
                if($scope.selectedBorough.name === 'London'){
                    boroughSelected = true;
                    mapLoadBorough(p,map);
                } else {
                    polygons.forEach(function(arrayElement,index) {
                        if(arrayElement.properties.NAME === $scope.selectedBorough.name){
                            arrayElement.polygons.forEach(function(subArrayElement,subIndex) {
                                subArrayElement.setOptions({
                                    fillColor: '#002699'
                                });
                            });
                        }
                    });
                    boroughSelected = true;
                    $scope.crimeType = null;
                    mapLoadBorough(p,map);
                }
            }
        }
    };
    // Set points directive config object
    $scope.points = {
        coords: [],
        properties:[],
        options: function(coords, properties, i, map) {
            return {
                draggable: false,
                crimePoint: properties[i],
                icon: 'images/metropolitan_police_service.png'
            }
        },
        events: {
            click: function(e, point, map, points) {
                $scope.crimeType = point.crimePoint.CrimeType;
                $scope.crimeLocation = point.crimePoint.CrimeLocation;
                $scope.crimeOutcome = switchOutcome(point.crimePoint.CrimeOutcome);
                $scope.$apply();
            }
        }
    };
    // Load borough after selecting it on the map
    function mapLoadBorough(p,map){
        $scope.selectedBorough.name = p.properties.NAME;
        $scope.$apply();

        p.setOptions({
            fillColor: 'transparent'
        });
        map.setOptions({
            center: p.properties.CENTER
        });
        if(!firstBoroughSelected)
            map.setOptions({
                zoom: 12
            });
        firstBoroughSelected = true;
        if($state.current.name === 'summary')
            $state.go("borough-crimes");
    };
    // <<< Map Logic


    //Charts Logic >>>

    //Crossfilter Logic >>
    //Crossfilter printer for debugging
    function print_filter(filter){
        var f=eval(filter);
        if (typeof(f.length) != "undefined") {}else{}
        if (typeof(f.top) != "undefined") {f=f.top(Infinity);}else{}
        if (typeof(f.dimension) != "undefined") {f=f.dimension(function(d) { return "";}).top(Infinity);}else{}
        console.log(filter+"("+f.length+") = "+JSON.stringify(f).replace("[","[\n\t").replace(/}\,/g,"},\n\t").replace("]","\n]"));
    }

    //Create Crossfilter instance
    $rootScope.crimeNdx = crossfilter($scope.crimeData);
    //Size of Crossfilter Object -->

    //<-- Size of Crossfilter Object
    //Crossfilter Logic Functions >>
    function dimensionConstructor(driver){
        var driver = driver;
        return $rootScope.crimeNdx.dimension(function(d) { return d[driver]; });
    }
    function groupDimensionVal(driverDimension){
        return driverDimension.group().reduceCount(function(d) {return d;});
    }
    //After filtering on the charts sometimes negative values appear in the graphs, it looks like these are infinitesimal negative numbers, which probably happen because of a glitch caused by floating point numbers not canceling out perfectly, the following function solves this issue by snapping really low values to zero
    function snap_to_zero(source_group) {
        return {
            all:function () {
                return source_group.all().map(function(d) {
                    return {key: d.key,
                        value: (Math.abs(d.value)<1e-6) ? 0 : d.value};
                });
            }
        };
    }
    function sortGroup(groupDimension) {
        var domain = [];
        groupDimension.top(Infinity).forEach(function(d) {
            domain[domain.length] = d.key;
        });
        return domain;
    }
    function switchIdentified(d){
        switch(d) {
            case 0:
                return 'Suspect identified';
            case 1:
                return 'No suspect identified';
            default:
                return '';
        }
    }
    function switchOutcome(d){
        switch(d) {
            case 0:
                return 'Awaiting court outcome';
            case 1:
                return 'Court case unable to proceed';
            case 2:
                return 'Court result unavailable';
            case 3:
                return 'Defendant found not guilty';
            case 4:
                return 'Defendant sent to Crown Court';
            case 5:
                return 'Local resolution';
            case 6:
                return 'No suspect identified';
            case 7:
                return 'Offender deprived of property';
            case 8:
                return 'Offender fined';
            case 9:
                return 'Offender given a caution';
            case 10:
                return 'Offender given a drugs possession warning';
            case 11:
                return 'Offender given absolute discharge';
            case 12:
                return 'Offender given community sentence';
            case 13:
                return 'Offender given conditional discharge';
            case 14:
                return 'Offender given penalty notice';
            case 15:
                return 'Offender given suspended prison sentence';
            case 16:
                return 'Offender ordered to pay compensation';
            case 17:
                return 'Offender otherwise dealt with';
            case 18:
                return 'Offender sent to prison';
            case 19:
                return 'Suspect charged as part of another case';
            case 20:
                return 'Under investigation';
            default:
                return '';
        }
    }

    //<< Crossfilter Logic

    //Chart constructor
    $scope.createChart = function(chartType,chartId,chartKey,width,height,xScale,xScaleSort,xScaleDomain,centerBar,event,eventFunc,tickNum,tickSwitchFunc,renderletFunc,switchTitle){
        if(chartType === 'bar'){
            var chart  = dc.barChart(chartId);
        } else if(chartType === 'pie'){
            var chart  = dc.pieChart(chartId);
        }
        var chartDimension = new dimensionConstructor(chartKey);

        var chartVar = chart
            .width(width)
            .height(height)
            .dimension(chartDimension)
            .group(snap_to_zero(groupDimensionVal(chartDimension)));
        if(xScale === 'ordinal' && !xScaleSort){
            chartVar
                .x(d3.scale.ordinal())
                .xUnits(dc.units.ordinal)
                .renderHorizontalGridLines(true);
        } else if(xScale === 'ordinal' && xScaleSort){
            chartVar
                .x(d3.scale.ordinal().domain(sortGroup(groupDimensionVal(chartDimension))))
                .xUnits(dc.units.ordinal)
                .renderHorizontalGridLines(true);
        } else if(xScale === 'linear'){
            chartVar
                .x(d3.scale.linear().domain([xScaleDomain[0],xScaleDomain[1]]))
                .renderHorizontalGridLines(true)
                .mouseZoomable(false);
        }
        if(switchTitle === 'switchOutcome')
            chartVar.title(function (d){ return switchOutcome(d.key) + ': ' + d.value; });
        if(switchTitle === 'switchIdentified'){
            chartVar.label(function (d){ return switchIdentified(d.key); });
            chartVar.title(function (d){ return switchIdentified(d.key) + ': ' + d.value; });
        }
        chartType === 'pie' ? chartVar.innerRadius(30) : chartVar.yAxisLabel(yAxisLabel).elasticY(true);
        if(centerBar) 
            chartVar.centerBar(true);
        if(event) 
            chartVar.on(event, eventFunc);
        if(tickSwitchFunc === 'switchOutcome') 
            chartVar.xAxis().ticks(tickNum).tickFormat(switchOutcome);
        if(renderletFunc)
            chartVar.renderlet(positionLabels);

        this.getChartObj = function(){
            return chartVar;
        };
        this.getChartDimension = function(){
            return chartDimension;
        };
        this.disposeChartDimension = function(){
            chartDimension.dispose();
        };
    }
    //<< Chart Constructor

    //Reseting Filters >>
    $scope.resetChartFilter = function(chartInst){
        //Change eval!!!
        var chartObj = eval(chartInst);
        chartObj.getChartObj().filterAll();
        dc.redrawAll();
    };
    $scope.resetFilters = function(){
        dc.filterAll();
        dc.redrawAll();
    };
    //<< Reseting Filters

    //Chart reStyling >>
    var yAxisLabel = 'Number of Offences';
    $scope.alignChart = function(chartId,moveX,moveY,brush){
        var chartBody = d3.transform(d3.select(chartId +' .chart-body').attr("transform")),
            chartBodyX = chartBody.translate[0] + moveX,
            chartBodyY = chartBody.translate[1] + moveY;
        d3.select(chartId +' .chart-body').attr("transform","translate("+chartBodyX+","+chartBodyY+")");
        var chartAxisXy = d3.transform(d3.select(chartId +' .axis.x').attr("transform")),
            chartAxisXyX = chartAxisXy.translate[0] + moveX,
            chartAxisXyY = chartAxisXy.translate[1] + moveY;
        d3.select(chartId +' .axis.x').attr("transform","translate("+chartAxisXyX+","+chartAxisXyY+")");
        var chartAxisXx = d3.transform(d3.select(chartId +' .axis.y').attr("transform")),
            chartAxisXxX = chartAxisXx.translate[0] + moveX,
            chartAxisXxY = chartAxisXx.translate[1] + moveY;
        d3.select(chartId +' .axis.y').attr("transform","translate("+chartAxisXxX+","+chartAxisXxY+")");
        if(brush){
            var chartAxisBrush = d3.transform(d3.select(chartId +' .brush').attr("transform")),
                chartAxisBrushX = chartAxisBrush.translate[0] + moveX,
                chartAxisBrushY = chartAxisBrush.translate[1] + moveY;
            d3.select(chartId +' .brush').attr("transform","translate("+chartAxisBrushX+","+chartAxisBrushY+")");
        }
    }
    function positionLabels(chart){
        chart.selectAll("g.x text")
            .attr('transform', "rotate(90)")
            .attr('dx', '7')
            .attr('dy', '-6');
    }
    //<< Chart reStyling

    // Go to child state
    $state.go('summary');
});
