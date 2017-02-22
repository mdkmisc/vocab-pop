var d3 = require('d3');
import _ from 'supergroup';

let maxNodesPerRow = 5; // actual rows will have twice this to make room for stubs
                        // though not using stubs right now (they're for wayppoints,
                        // which are for drawing edges between nodes)
let rowsBetweenLayers = 1;
export default function makeElements(sg, domnode,) {
  let nodesInLayers = [0,0,0]; // counter for nodes in each layer
  let nodes = _.flatten(sg.map(sc=>sc.getChildren().map(voc=>{
                    if (voc.records.length !== 1) throw new Error('should be one record exactly');
                    let counts = {};
                    ['rc','src','drc','dsrc']
                          .filter(fld=>voc.aggregate(_.sum,fld))
                          .forEach(fld=>counts[fld] = voc.aggregate(_.sum,fld));

                    let biggest = _.isEmpty(counts) ?
                          'norecs' : _.last(_.sortBy(_.toPairs(counts), 1))[0];

                    let id = voc.namePath(','),
                        caption = voc.toString(), // + ' ' + biggest,
                        layer = ({'C': 0, 'S': 1, 'X': 2})[sc.toString()],
                        parent = ['Classification','Standard','Source'][layer],
                        biggestCount = biggest,
                        classes = `${biggest} voc-node`,
                        sgVal = voc,
                        node = makeNode({id, caption,layer, parent,
                                         counts,biggestCount,classes,sgVal
                                        }, nodesInLayers);
                    return node;
                  })));
  // split wide layers
  //let rowsInLayers = nodesInLayers.map((nodesInLayer,i) => Math.ceil(nodesInLayer / maxNodesPerRow));
  
  let nodesInRowsByLayer = 
        _.map(nodesInLayers, 
              nodesInLayer => {
                let remainingNodes = nodesInLayer, rowInLayerIdx = 0, rows = [];
                while (remainingNodes) {
                  let nodesInRow = remainingNodes > maxNodesPerRow
                                    ? maxNodesPerRow - rowInLayerIdx % 2
                                    : remainingNodes;
                  remainingNodes -= nodesInRow;
                  rows.push(nodesInRow);
                  rowInLayerIdx++;
                }
                return rows;
              });
  //console.log(nodesInRowsByLayer.join('\n'));
  let layerStartRows = 
        nodesInRowsByLayer
          .map(d=>d.length)
          .map((d,i,a) => _.sum(a.slice(0,i)) + i * rowsBetweenLayers + i * 1);
  window.colOffset = colOffset; // need console access to function while testing
  //let rowContentsForWayPoints = {}; // was working for waypoints, but not using waypoints now
                                      // and need rowContents for re-adjusting pos after size available
                                      // which is going to mess up waypoints anyway
  nodes.filter(d=>!d.isParent).forEach((node) => {
    let nodesInRows = nodesInRowsByLayer[node.layer];
    nodesInRows.forEach(
            (nodesInRow,i) => {
              if (
                    node.layerIdx >= _.sum(nodesInRows.slice(0, i)) &&
                    node.layerIdx <  _.sum(nodesInRows.slice(0, i + 1))
                 ) {
                      node.rowInLayer = i;
                      node.row = node.rowInLayer + layerStartRows[node.layer] + 1;

                      node.rowIdx = node.layerIdx -  // rowIdx == idx within the row
                                          _.sum(nodesInRows.slice(0, i));
                      node.col = node.rowIdx * 2
                                        + colOffset(node.rowInLayer,
                                                    nodesInRowsByLayer[node.layer]);
              }
            });
    // replacing waypoints stuff because not using, but might need again sometime
    //let row = _.get(rowContentsForWayPoints, [node.row, node.col]) || [];
    //row.push(node);
    //_.set(rowContentsForWayPoints, [node.row, node.col], row);
  });
  let x = d3.scaleLinear().domain([-2,d3.max(nodes.map(d=>d.col))]);
  let y = d3.scaleLinear().domain(d3.extent(nodes.map(d=>d.row))).range([.2,.8]);
  window.x = x; window.y = y;
  nodes.forEach(node => {
    node.x = x(node.col);
    node.y = y(node.row);
  });
  let lowestX = _.min(nodes.map(d=>d.x));
  let nodeGroups = [
        makeNode({  id:'Classification', isParent:true, classes: 'voc-node parent', 
                    x:x(-2), y:y(layerStartRows[0]), size:2 }),
        makeNode({  id:'Standard', isParent:true, classes: 'voc-node parent', 
                    x:x(-2), y:y(layerStartRows[1]), size:2 }),
        makeNode({  id:'Source', isParent:true, classes: 'voc-node parent', 
                    x:x(-2), y:y(layerStartRows[2]), size:2 })
  ];
  nodes = nodeGroups.concat(nodes);
  
  let edges = 
    _.flatten(sg.leafNodes()
              .filter(d=>d.dim==='linknodes')
              .filter(d=>_.includes(nodes.map(n=>n.id),d.toString()))
              .map(
                d => {
                  /*
                  let from = s.nodes(d.toString()),
                      to = s.nodes(d.parent.namePath(',')),
                      points = waypoints(from, to, rowContentsForWayPoints);
                  */
                  let e = makeEdge(d.toString(), d.parent.namePath(','));
                  //e.waypoints = points;
                  return e;
                }))
                //.filter(d=>d.classes==='not-self');
  return {nodes, edges}
}
function colOffset(row, nodesInRows, max=maxNodesPerRow) {
  // even rows (except last) have maxNodes
  let nodesInRow = nodesInRows[row];
  let offset = 0;
  if (row % 2) { // odd row
    if (nodesInRow < max - 1) // short row, adjust to center
      offset = max - nodesInRow;
    else
      offset = 1;
    if (row === nodesInRows.length - 1 &&
        nodesInRow === max) // last row, full length, don't adjust
      offset = 0;
  } else { // even row
    if (nodesInRow < max) // short row
      offset = max - nodesInRow;
  }
  return offset;
}
function makeNode(opts, nodesInLayers) {
  let node = _.clone(opts);

  if (typeof node.id === 'undefined')
    throw new Error('node needs an id');

  if (typeof node.caption === 'undefined')
    node.caption = node.id;

  if (typeof node.size === 'undefined')
    node.size = 1;

  if (typeof node.layer !== 'undefined')
    node.layerIdx = nodesInLayers[node.layer]++;

  node.type = node.type || 'react';
  return node;
}
function makeEdge(from, to) {
  return {
    //classes: from.id() === to.id() ? 'self' : 'not-self',
    //selectable: true,
    //events: 'no',
    //groups: 'edges',
    id: `${from}:${to}`,
    source: from,
    target: to,
    type: 'react',
    //color: function(e) { console.log(e); return 'green'; } // doesn't seem to work
    //color: 'steelblue',
    classes: `voc-edge`,
  };
}
/*

function findEmptyGridCol(row, fromCol, targetCol, rowContentsForWayPoints) {
  // for now just leave these empty and don't try to spread waypoints
  let targetGridLocation = _.get(rowContentsForWayPoints, [row, targetCol]);
  if (!targetGridLocation) return targetCol;
  let newTarget = targetCol > fromCol ? targetCol - 1 : targetCol + 1;
  targetGridLocation = _.get(rowContentsForWayPoints, [row, newTarget]);
  if (!targetGridLocation) return newTarget;
  throw new Error("can't find an empty grid col");
}
function rotateRad(cx, cy, x, y, radians) {
  var cos = Math.cos(radians),
      sin = Math.sin(radians),
      nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
      ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
  return [nx, ny];
}
function perpendicular_coords(x1, y1, x2, y2, xp, yp) {
  var dx = x2 - x1,
      dy = y2 - y1;

  //find intersection point    
  var k = (dy * (xp-x1) - dx * (yp-y1)) / (dy*dy + dx*dx);
  var x4 = xp - k * dy;
  var y4 = yp + k * dx;

  var ypt = Math.sqrt((y4-y1)*(y4-y1)+(x4-x1)*(x4-x1));
  var xpt = pointToLineDist(x1, y1, x2, y2, xp, yp);
  return [xpt, ypt];
}

function pointToLineDist(x1, y1, x2, y2, xp, yp) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.abs(dy*xp - dx*yp + x2*y1 - y2*x1) / Math.sqrt(dy*dy + dx*dx);
}
function pointToPointDist(x1, y1, x2, y2) {
  var dx = x2 - x1;
  var dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
function waypoints(from, to, rowContentsForWayPoints) {
  let stubPoint = { row: from().row, col: from().col, 
                    distance: 0, weight: .5, };
  if (from().layer === to().layer)
    return [stubPoint];
  let fromCol = from().col, 
      curCol = fromCol,
      toCol = to().col,
      fromRow = from().row,
      curRow = fromRow,
      toRow = to().row,
      fromX = from.position().x,
      fromY = from.position().y,
      toX = to.position().x,
      toY = to.position().y,
      x = d3.scaleLinear().domain([fromCol,toCol]).range([fromX,toX]),
      y = d3.scaleLinear().domain([fromRow,toRow]).range([fromY,toY]);
  let rowsBetween = _.range(fromRow, toRow).slice(1);
  let edgeLength = pointToPointDist(x(fromCol),y(fromRow),x(toCol),y(toRow));
  let points = rowsBetween.map(
    (nextRow,i) => {
      let colsRemaining = toCol - curCol;
      let colsNow = Math.ceil(colsRemaining / Math.abs(toRow - curRow));
      let nextCol = findEmptyGridCol(nextRow, curCol, curCol + colsNow, rowContentsForWayPoints);
      let curX = x(curCol), curY = y(curRow),
          nextX = x(nextCol), nextY = y(nextRow);
      let [distanceFromEdge, distanceOnEdge] = 
            perpendicular_coords(curX, curY, toX, toY, nextX, nextY);

      let point = {curCol, curRow, 
                    toCol, toRow,
                    nextCol, nextRow,
                    curX, curY, toX, toY, nextX, nextY,
                    edgeLength,
                    colsNow,
                    //wayCol, wayRow,
                    distance:-distanceFromEdge * 2, 
                    weight:distanceOnEdge / edgeLength,
                  };
      curCol = nextCol;
      curRow = nextRow;
      return point;
    });
  if (points.length === 0)
      return [stubPoint];
  return points;
}
*/
